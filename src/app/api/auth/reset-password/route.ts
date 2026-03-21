import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const RESET_PREFIX = "reset:";

export async function POST(request: Request) {
  try {
    const { success, reset } = await checkRateLimit("resetPassword", request);
    if (!success) return rateLimitResponse(reset);

    const { token, password, confirmPassword } = await request.json();

    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);

    const resetToken = await prisma.verificationToken.findUnique({
      where: { token: tokenHash },
    });

    if (!resetToken || !resetToken.identifier.startsWith(RESET_PREFIX)) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    if (resetToken.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token: tokenHash } });
      return NextResponse.json(
        { error: "Reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const email = resetToken.identifier.replace(RESET_PREFIX, "");
    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, passwordChangedAt: new Date() },
    });

    await prisma.verificationToken.delete({ where: { token: tokenHash } });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
