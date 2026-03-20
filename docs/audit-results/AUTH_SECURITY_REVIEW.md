# Authentication Security Review — CodeShelf

**Date:** 2026-03-20
**Auditor:** Security Audit (Claude Code)
**Scope:** All developer-written authentication and account management code
**NextAuth Version:** next-auth@5.0.0-beta.30

---

## Executive Summary

The codebase demonstrates solid foundational security practices in several areas: bcrypt is used correctly, password reset tokens are cryptographically random, and API routes that modify user data validate the session before acting. However, **one critical vulnerability was found**: the middleware route protection is completely non-functional due to an incorrect filename. This means `/dashboard` and all sub-routes are accessible without authentication at the page-render level. Two High-severity issues were also found regarding lack of rate limiting and active sessions remaining valid after a password reset.

---

## Findings

---

### [CRITICAL] Middleware is Not Active — Route Protection Is Entirely Bypassed

**File:** `src/proxy.ts`
**Lines:** 1–16

**Code:**
```typescript
// src/proxy.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith("/dashboard")) {
    const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

**Impact:**
Next.js only recognizes middleware that is exported from a file named `middleware.ts` (or `middleware.js`) located at the project root (`/`) or inside the `src/` directory. The file is named `proxy.ts` and placed in `src/`. Next.js never loads it. The exported `proxy` function and `config` matcher are silently ignored.

As a result, the middleware-level redirect to `/sign-in` for unauthenticated `/dashboard` requests **never fires**. A user who navigates directly to `/dashboard` is not redirected at the edge.

**Important nuance:** The `dashboard/layout.tsx` does contain a server-side `auth()` check followed by `redirect("/sign-in")`. This means the page itself will redirect unauthenticated users before rendering user data. However, relying solely on a layout-level check is a defense-in-depth gap: middleware is the first line of defense and is expected to protect routes before the server component tree runs. Any future route added under `/dashboard` that doesn't have an explicit layout check will be completely unprotected.

**Fix:**
Rename `src/proxy.ts` to `src/middleware.ts`. The `export const config` matcher and the auth guard logic do not need to change.

```bash
mv src/proxy.ts src/middleware.ts
```

---

### [HIGH] No Rate Limiting on Any Authentication Endpoint

**Files:**
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`

**Impact:**
None of the authentication API routes implement any form of rate limiting or brute-force protection. The `authorize` callback in NextAuth's Credentials provider (in `src/auth.ts`) also has no lockout or throttle.

Specific abuse vectors:

1. **Credential brute force:** An attacker can make unlimited POST requests to the NextAuth credentials endpoint (`/api/auth/callback/credentials`). There is no account lockout, no exponential backoff, and no IP-based throttle. Any account with a weak password can be brute-forced with no server-side resistance.

2. **Password reset spam:** An attacker who knows a victim's email can call `POST /api/auth/forgot-password` in a tight loop. Each request generates a new token, deletes the old one, and sends a new email. This allows flooding the victim's inbox and exhausting any Resend sending quota.

3. **Registration spam:** `POST /api/auth/register` has no rate limit. Automated bots can create thousands of accounts, consuming database rows and email quota.

**Fix:**
Implement rate limiting using a package such as `@upstash/ratelimit` (pairs well with the planned Redis layer) or `next-rate-limit`. Apply limits at the route level:

```typescript
// Example for forgot-password — apply same pattern to register and reset-password
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 requests per 15 minutes per IP
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  // ... rest of handler
}
```

For credential brute force, also add per-email rate limiting (not just per-IP) so that distributed attacks are also throttled.

---

### [HIGH] Active Sessions Not Invalidated After Password Reset

**File:** `src/app/api/auth/reset-password/route.ts`
**Lines:** 54–59

**Code:**
```typescript
await prisma.user.update({
  where: { email },
  data: { password: hashedPassword },
});

await prisma.verificationToken.delete({ where: { token } });
```

**Impact:**
When a user (or an attacker who obtained a password reset link) successfully resets a password, the route only updates the hashed password and deletes the reset token. It does **not** invalidate existing sessions.

Because the application uses JWT sessions (`session: { strategy: "jwt" }` in `src/auth.ts`), active JWT tokens continue to be valid after the password is changed. If an attacker had gained access to an account and a legitimate user then resets their password to regain control, the attacker's existing session JWT remains valid until it naturally expires.

The same issue applies to `POST /api/profile/change-password/route.ts` (lines 58–63): changing a password from within the profile page also does not invalidate other active sessions.

**Fix:**
The standard approach with JWT sessions is to store a `passwordChangedAt` timestamp on the User model and validate it in the JWT callback. If the token was issued before the password was last changed, reject it.

Step 1 — Add field to schema:
```prisma
model User {
  // ...
  passwordChangedAt DateTime?
}
```

Step 2 — Update both password-change routes to set `passwordChangedAt: new Date()`.

Step 3 — Validate in the JWT callback in `src/auth.ts`:
```typescript
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.sub = user.id;
      token.issuedAt = Date.now();
    }
    // On every token refresh, check if password changed after token issuance
    if (token.sub && token.issuedAt) {
      const dbUser = await prisma.user.findUnique({
        where: { id: token.sub as string },
        select: { passwordChangedAt: true },
      });
      if (
        dbUser?.passwordChangedAt &&
        dbUser.passwordChangedAt.getTime() > (token.issuedAt as number)
      ) {
        return null; // Invalidate the token
      }
    }
    return token;
  },
  session({ session, token }) {
    if (token.sub) session.user.id = token.sub;
    return session;
  },
},
```

---

### [MEDIUM] No Email Format Validation on Registration or Password Reset

**Files:**
- `src/app/api/auth/register/route.ts` — lines 11–16
- `src/app/api/auth/forgot-password/route.ts` — lines 10–17

**Code (register):**
```typescript
if (!name || !email || !password || !confirmPassword) {
  return NextResponse.json(
    { error: "All fields are required" },
    { status: 400 }
  );
}
```

**Impact:**
Both routes accept any non-empty string as a valid email address. Passing `"notanemail"` or `"a@"` will pass the presence check and proceed to a `prisma.user.findUnique({ where: { email: "notanemail" } })` query or attempt to send an email via Resend. While Resend will reject invalid addresses, the account row is still created in the database with the malformed email in the register case (lines 43–48 of register route — the user is created before the email send). This leaves unreachable zombie accounts in the database.

The browser-side `<input type="email">` provides client-side validation but this is trivially bypassed by calling the API directly.

**Fix:**
Add server-side email validation with a library like Zod (already referenced in `coding-standards.md`):

```typescript
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
});

// In the route handler:
const parsed = RegisterSchema.safeParse(await request.json());
if (!parsed.success) {
  return NextResponse.json({ error: "Invalid input" }, { status: 400 });
}
```

---

### [MEDIUM] Registration Confirms Email Existence via Distinct HTTP Status Code

**File:** `src/app/api/auth/register/route.ts`
**Lines:** 34–39

**Code:**
```typescript
const existingUser = await prisma.user.findUnique({ where: { email } });

if (existingUser) {
  return NextResponse.json(
    { error: "A user with this email already exists" },
    { status: 409 }
  );
}
```

**Impact:**
The registration endpoint returns HTTP 409 with an explicit message when an email is already registered. An attacker can enumerate which email addresses have accounts by submitting registration requests and observing the response code/body. This leaks account existence information, which has privacy implications and can be used to target specific users (e.g., for phishing or social engineering).

Note: the forgot-password endpoint correctly avoids this by always returning 200 (`"If an account exists, a reset link has been sent"`).

**Fix:**
Two acceptable approaches:

**Option A** — Return HTTP 200 with a generic message that does not distinguish between "email already taken" and "registration successful pending verification". The UI shows "If this email is new, check your inbox for a verification link." This matches the forgot-password pattern.

**Option B** (simpler to implement) — Return HTTP 422 with a generic message `"Registration failed. Please try again or sign in."` This avoids the explicit confirmation while still signaling failure. This is a lower-protection option since 422 on a known email vs 201 on an unknown one still leaks information, but removes the explicit message.

Option A is preferred for proper email enumeration protection.

---

### [MEDIUM] Password Reset Token Not Hashed in Database

**File:** `src/app/api/auth/forgot-password/route.ts`
**Lines:** 31–44

**Code:**
```typescript
const token = crypto.randomBytes(32).toString("hex");
// ...
await prisma.verificationToken.create({
  data: {
    identifier: `${RESET_PREFIX}${email}`,
    token,   // stored as plaintext
    expires,
  },
});
```

**Impact:**
The raw reset token (64 hex characters, 256 bits) is stored in plaintext in the `VerificationToken` table. The same is true for email verification tokens in `src/app/api/auth/register/route.ts` (line 56).

If an attacker gains read access to the database (via SQL injection, a misconfigured connection, or a database backup leak), they can extract valid reset tokens and take over any account that has an active reset request. The 24-hour expiry window means there is a meaningful exposure window.

**Note:** The token itself has sufficient entropy (256 bits) so it cannot be guessed. The risk is purely from database read access.

**Fix:**
Store a SHA-256 hash of the token in the database, and hash the incoming token before the lookup:

```typescript
// On creation:
import crypto from "crypto";
const rawToken = crypto.randomBytes(32).toString("hex");
const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
await prisma.verificationToken.create({
  data: { identifier: `${RESET_PREFIX}${email}`, token: tokenHash, expires },
});
// Send rawToken in the email URL

// On validation:
const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
const resetToken = await prisma.verificationToken.findUnique({
  where: { token: tokenHash },
});
```

---

### [LOW] Name Field Has No Length Constraint at API Level

**File:** `src/app/api/auth/register/route.ts`
**Lines:** 11–16, 43–48

**Code:**
```typescript
if (!name || !email || !password || !confirmPassword) {
  // only checks presence
}
// ...
await prisma.user.create({
  data: { name, email, password: hashedPassword },
});
```

**Impact:**
The `name` field accepts any length string. An attacker can submit a name of arbitrary length (e.g., 1 MB). This payload is hashed through bcrypt (only the first 72 bytes are used by bcrypt, so the password itself is not a DoS vector), but the full `name` string is written to the database. Without a max-length constraint, this could cause excessive database row sizes and potentially affect performance at scale, though the immediate practical impact is low.

**Fix:**
Add a maximum length validation server-side. A reasonable limit is 100 characters:

```typescript
if (name.length > 100) {
  return NextResponse.json({ error: "Name is too long" }, { status: 400 });
}
```

Or include it in a Zod schema as shown in the email validation fix above.

---

### [LOW] bcrypt Password Length Truncation Is Silent (Not a Bug, but Worth Documenting)

**File:** `src/auth.ts` — line 43; `src/app/api/auth/register/route.ts` — line 41

**Impact:**
`bcryptjs` silently truncates input passwords to 72 bytes before hashing. This is an inherent limitation of the bcrypt algorithm. A password of `"A".repeat(73)` and `"A".repeat(72)` produce the same hash. This is a known bcrypt property, not a bug in the code. It is noted here as a documentation item because the only server-side validation is `password.length < 8`, with no upper bound.

In practice, an attacker who knows the 72-byte truncation property could use a password longer than 72 bytes and append arbitrary padding — all such passwords would be equivalent. This is a marginal risk but worth being aware of.

**Fix (optional):**
Add a maximum password length of 72 characters on the server side to make the behavior explicit and prevent user confusion (a user who sets an 80-character password and then types only the first 72 characters would successfully authenticate, which is surprising):

```typescript
if (password.length > 72) {
  return NextResponse.json(
    { error: "Password must be 72 characters or fewer" },
    { status: 400 }
  );
}
```

Alternatively, pre-hash the password with SHA-256 before passing to bcrypt (the "pre-hash" pattern), but this adds complexity and is not necessary here.

---

## Passed Checks

The following areas were reviewed and found to be correctly implemented:

| Area | Verdict | Notes |
|---|---|---|
| **Password hashing algorithm** | PASS | bcrypt with cost factor 12 used consistently in all three places: register, change-password, and reset-password |
| **Password comparison timing safety** | PASS | `bcrypt.compare()` is used in all cases; no manual string comparison |
| **Password returned in API responses** | PASS | No route returns the password hash. The `getProfileData` function reads the password field but only exposes `hasPassword: !!user.password` (boolean) to the client |
| **Token generation randomness** | PASS | `crypto.randomBytes(32).toString("hex")` (256 bits) used for both verification and reset tokens — cryptographically secure |
| **Token expiration enforcement** | PASS | Both verification and reset routes check `expires < new Date()` before accepting a token |
| **Token single-use enforcement** | PASS | Tokens are deleted immediately after successful use in both the verify and reset-password routes |
| **Email enumeration on password reset** | PASS | `/api/auth/forgot-password` always returns the same generic success response regardless of whether the email exists |
| **Profile page session validation** | PASS | `src/app/profile/page.tsx` calls `auth()` and redirects to `/sign-in` if no session before fetching any user data |
| **Dashboard layout session validation** | PASS | `src/app/dashboard/layout.tsx` calls `auth()` and redirects to `/sign-in` if no session |
| **Change-password requires current password** | PASS | `/api/profile/change-password` verifies `currentPassword` against the stored hash before allowing a change |
| **IDOR on profile endpoints** | PASS | All profile API routes use `session.user.id` (from the verified JWT) as the database lookup key — there are no user-supplied IDs that could be swapped |
| **Change-password session validation** | PASS | `/api/profile/change-password` calls `auth()` and returns 401 if no session |
| **Delete-account session validation** | PASS | `/api/profile/delete-account` calls `auth()` and returns 401 if no session |
| **Account deletion cleans up data** | PASS | Prisma schema has `onDelete: Cascade` for all user-owned models (Item, Collection, Tag, Account, Session), so deletion of the User row removes all associated data |
| **Error messages leak internal details** | PASS | All catch blocks return generic `"Something went wrong"` messages without stack traces or internal error details |
| **OAuth users cannot use password reset** | PASS | `/api/auth/forgot-password` checks `!user.password` and returns a generic success response for OAuth-only accounts, preventing them from being given a reset token |
| **JWT secret configuration** | PASS | The `AUTH_SECRET` env var is used by NextAuth v5 for JWT signing. The `.env.example` shows it as a required blank that must be generated with `npx auth secret` (which produces a 32-byte random secret) |
| **JWT session data exposure** | PASS | The JWT callback only adds `user.id` to the session; password, isPro, stripeCustomerId, and other sensitive fields are not included |
| **Email verification token scope isolation** | PASS | Reset tokens are namespaced with `"reset:"` prefix in the identifier, preventing a verification token from being used as a reset token and vice versa |

---

## Prioritized Recommendations

| Priority | Finding | Effort |
|---|---|---|
| 1 (Critical) | Rename `src/proxy.ts` to `src/middleware.ts` | 5 minutes |
| 2 (High) | Add rate limiting to register, forgot-password, and reset-password routes | 2–4 hours |
| 3 (High) | Invalidate active sessions after password reset/change | 3–5 hours |
| 4 (Medium) | Add server-side email format validation with Zod | 30 minutes |
| 5 (Medium) | Change registration duplicate-email response to avoid enumeration | 30 minutes |
| 6 (Medium) | Hash reset and verification tokens before storing in database | 1–2 hours |
| 7 (Low) | Add max-length constraint on name field | 15 minutes |
| 8 (Low) | Document or enforce bcrypt 72-byte password length limit | 15 minutes |

---

## Files Audited

- `src/auth.ts`
- `src/auth.config.ts`
- `src/proxy.ts`
- `src/types/next-auth.d.ts`
- `src/lib/email.ts`
- `src/lib/prisma.ts`
- `src/lib/db/profile.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/verify/route.ts`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`
- `src/app/api/profile/change-password/route.ts`
- `src/app/api/profile/delete-account/route.ts`
- `src/app/dashboard/layout.tsx`
- `src/app/profile/page.tsx`
- `src/app/sign-in/page.tsx`
- `src/app/register/page.tsx`
- `src/app/forgot-password/page.tsx`
- `src/app/reset-password/page.tsx`
- `src/components/auth/SignInForm.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/components/auth/ForgotPasswordForm.tsx`
- `src/components/auth/ResetPasswordForm.tsx`
- `src/components/profile/ChangePasswordSection.tsx`
- `src/components/profile/DeleteAccountSection.tsx`
- `prisma/schema.prisma`
- `package.json`
- `.env.example`
- `next.config.ts`
