import { auth } from "@/auth";
import { checkUserRateLimit } from "@/lib/rate-limit";

type ActionError = { success: false; error: string };

const err = (error: string): ActionError => ({ success: false, error });

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, error: err("Unauthorized") };
  }
  return {
    ok: true as const,
    session,
    userId: session.user.id,
    isPro: Boolean(session.user.isPro),
  };
}

export async function requireProSession() {
  const guard = await requireSession();
  if (!guard.ok) return guard;
  if (!guard.isPro) {
    return { ok: false as const, error: err("Pro subscription required") };
  }
  return guard;
}

export async function checkAiRateLimit(userId: string) {
  const rate = await checkUserRateLimit("ai", userId);
  if (!rate.success) {
    return {
      ok: false as const,
      error: err("AI rate limit reached. Please try again later."),
    };
  }
  return { ok: true as const };
}
