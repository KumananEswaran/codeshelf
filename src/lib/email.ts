import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "CodeShelf <onboarding@resend.dev>";

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Verify your CodeShelf account",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #fff; margin-bottom: 16px;">Welcome to CodeShelf</h2>
        <p style="color: #ccc; line-height: 1.6;">
          Click the button below to verify your email address and activate your account.
        </p>
        <a
          href="${verifyUrl}"
          style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;"
        >
          Verify Email
        </a>
        <p style="color: #888; font-size: 14px; line-height: 1.6;">
          This link expires in 24 hours. If you didn&rsquo;t create a CodeShelf account, you can ignore this email.
        </p>
      </div>
    `,
  });
}
