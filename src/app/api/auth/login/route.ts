import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { signIn } from "@/auth";
import { CredentialsSignin } from "next-auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Rate limit by IP + email
    const { success, reset } = await checkRateLimit("login", request, email);
    if (!success) return rateLimitResponse(reset);

    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      if (error.code === "email-not-verified") {
        return NextResponse.json(
          { error: "Please verify your email before signing in. Check your inbox.", code: "email-not-verified" },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // NextAuth may throw a redirect-like error on successful signIn — check for NEXT_REDIRECT
    if (
      error instanceof Error &&
      "digest" in error &&
      typeof (error as Record<string, unknown>).digest === "string" &&
      ((error as Record<string, unknown>).digest as string).includes("NEXT_REDIRECT")
    ) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
