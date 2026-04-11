import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Lazy-initialize Redis client (only when rate limiting is configured)
function getRedis(): Redis | null {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// Pre-configured rate limiters for auth endpoints
const limiters = {
  /** Login: 5 attempts per 15 minutes */
  login: { requests: 5, window: "15 m" as const },
  /** Register: 3 attempts per hour */
  register: { requests: 3, window: "1 h" as const },
  /** Forgot password: 3 attempts per hour */
  forgotPassword: { requests: 3, window: "1 h" as const },
  /** Reset password: 5 attempts per 15 minutes */
  resetPassword: { requests: 5, window: "15 m" as const },
  /** Resend verification: 3 attempts per 15 minutes */
  resendVerification: { requests: 3, window: "15 m" as const },
  /** AI features: 20 requests per hour per user */
  ai: { requests: 20, window: "1 h" as const },
} as const;

export type RateLimitType = keyof typeof limiters;

/** Extract client IP from request headers */
function getIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "127.0.0.1";
}

/** Build rate limit key from IP and optional identifier */
function buildKey(type: RateLimitType, ip: string, identifier?: string): string {
  const base = `ratelimit:${type}:${ip}`;
  return identifier ? `${base}:${identifier}` : base;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for a given type and request.
 * Fails open — if Upstash is not configured or unavailable, allows the request.
 */
export async function checkRateLimit(
  type: RateLimitType,
  request: Request,
  identifier?: string
): Promise<RateLimitResult> {
  try {
    const redis = getRedis();
    if (!redis) {
      // Fail open: no Redis configured
      return { success: true, remaining: -1, reset: 0 };
    }

    const config = limiters[type];
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.requests, config.window),
      prefix: "codeshelf",
    });

    const ip = getIP(request);
    const key = buildKey(type, ip, identifier);
    const result = await ratelimit.limit(key);

    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch {
    // Fail open: if Upstash is down, allow the request
    return { success: true, remaining: -1, reset: 0 };
  }
}

/**
 * Check rate limit for a server action (no Request object) using a user identifier.
 * Fails open — if Upstash is not configured or unavailable, allows the request.
 */
export async function checkUserRateLimit(
  type: RateLimitType,
  userId: string
): Promise<RateLimitResult> {
  try {
    const redis = getRedis();
    if (!redis) {
      return { success: true, remaining: -1, reset: 0 };
    }

    const config = limiters[type];
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.requests, config.window),
      prefix: "codeshelf",
    });

    const result = await ratelimit.limit(`ratelimit:${type}:user:${userId}`);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch {
    return { success: true, remaining: -1, reset: 0 };
  }
}

/** Create a 429 response with Retry-After header and user-friendly message */
export function rateLimitResponse(reset: number): NextResponse {
  const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);
  const retryMinutes = Math.ceil(retryAfterSeconds / 60);

  return NextResponse.json(
    {
      error: `Too many attempts. Please try again in ${retryMinutes} minute${retryMinutes === 1 ? "" : "s"}.`,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
}
