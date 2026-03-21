import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { generateToken } from "@/lib/tokens";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const RESET_PREFIX = "reset:";

const ForgotPasswordSchema = z.object({
  email: z.email("Invalid email address"),
});

export async function POST(request: Request) {
  try {
    const { success, reset } = await checkRateLimit("forgotPassword", request);
    if (!success) return rateLimitResponse(reset);

    const body = await request.json();
    const parsed = ForgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      // User doesn't exist or is an OAuth-only user — return success anyway
      return NextResponse.json({
        success: true,
        message: "If an account exists, a reset link has been sent",
      });
    }

    // Generate reset token (expires in 24 hours)
    const { raw, hashed } = generateToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Remove any existing reset tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { identifier: `${RESET_PREFIX}${email}` },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: `${RESET_PREFIX}${email}`,
        token: hashed,
        expires,
      },
    });

    // Send the raw token in the email — only the hash is stored
    await sendPasswordResetEmail(email, raw);

    return NextResponse.json({
      success: true,
      message: "If an account exists, a reset link has been sent",
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
