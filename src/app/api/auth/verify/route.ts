import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/sign-in?error=missing-token", request.url)
      );
    }

    const tokenHash = hashToken(token);

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: tokenHash },
    });

    if (!verificationToken) {
      return NextResponse.redirect(
        new URL("/sign-in?error=invalid-token", request.url)
      );
    }

    if (verificationToken.expires < new Date()) {
      // Clean up expired token
      await prisma.verificationToken.delete({
        where: { token: tokenHash },
      });
      return NextResponse.redirect(
        new URL("/sign-in?error=expired-token", request.url)
      );
    }

    // Mark user as verified and delete the token
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.delete({
      where: { token: tokenHash },
    });

    return NextResponse.redirect(
      new URL("/sign-in?verified=true", request.url)
    );
  } catch {
    return NextResponse.redirect(
      new URL("/sign-in?error=verification-failed", request.url)
    );
  }
}
