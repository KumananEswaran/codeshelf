import NextAuth, { CredentialsSignin } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import authConfig from "./auth.config";

class EmailNotVerifiedError extends CredentialsSignin {
  code = "email-not-verified";
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  theme: { colorScheme: "dark" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.issuedAt = Date.now();
      }
      // Invalidate token if password was changed after token was issued
      if (token.sub && token.issuedAt) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { passwordChangedAt: true },
        });
        if (
          dbUser?.passwordChangedAt &&
          dbUser.passwordChangedAt.getTime() > (token.issuedAt as number)
        ) {
          return null as unknown as typeof token;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  ...authConfig,
  providers: [
    ...authConfig.providers.filter(
      (p) => (p as { id?: string }).id !== "credentials"
    ),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        if (
          process.env.REQUIRE_EMAIL_VERIFICATION === "true" &&
          !user.emailVerified
        ) {
          throw new EmailNotVerifiedError();
        }

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
});
