import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { generateToken } from "@/lib/tokens";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const RegisterSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100, "Name is too long"),
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  try {
    const { success, reset } = await checkRateLimit("register", request);
    if (!success) return rateLimitResponse(reset);

    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      // Return generic response to prevent email enumeration
      return NextResponse.json(
        {
          success: true,
          requireVerification: true,
          message: "Check your email to verify your account",
        },
        { status: 201 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const requireVerification =
      process.env.REQUIRE_EMAIL_VERIFICATION === "true";

    if (requireVerification) {
      // Generate verification token (expires in 24 hours)
      const { raw, hashed } = generateToken();
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Remove any existing tokens for this email
      await prisma.verificationToken.deleteMany({
        where: { identifier: email },
      });

      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token: hashed,
          expires,
        },
      });

      // Send the raw token in the email — only the hash is stored
      await sendVerificationEmail(email, raw);
    }

    return NextResponse.json(
      {
        success: true,
        requireVerification,
        message: requireVerification
          ? "Check your email to verify your account"
          : "Account created successfully",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
