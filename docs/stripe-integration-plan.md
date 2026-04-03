# Stripe Integration Plan — CodeShelf Pro

> RM29/mo monthly · RM252/year annual (RM21/mo billed yearly)

---

## 1. Current State Analysis

### User Model (Prisma Schema)

The `User` model already has the necessary Stripe fields (`prisma/schema.prisma:53-75`):

```prisma
model User {
  isPro                Boolean  @default(false)
  stripeCustomerId     String?
  stripeSubscriptionId String?
  // ...other fields
}
```

**No migration needed** — fields exist and are nullable.

### Auth & Session

- **NextAuth v5** with JWT strategy (`src/auth.ts`)
- Session only exposes `user.id` — **`isPro` is NOT on the session/token** currently
- JWT callback queries DB for `passwordChangedAt` already (`src/auth.ts:24-26`)
- Route protection: `auth()` check in layouts/pages, no middleware file
- Server actions pattern: `const session = await auth()` → check `session?.user?.id`

### Key Issue: `isPro` in Session

The JWT callback must be modified to include `isPro` on the token so both server and client components can access Pro status without extra DB queries. Per the research notes, always sync from DB (not trigger-based):

```typescript
async jwt({ token, user }) {
  if (user) {
    token.sub = user.id;
    token.issuedAt = Date.now();
  }
  if (token.sub) {
    const dbUser = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { passwordChangedAt: true, isPro: true },
    });
    if (
      dbUser?.passwordChangedAt &&
      dbUser.passwordChangedAt.getTime() > (token.issuedAt as number)
    ) {
      return null as unknown as typeof token;
    }
    token.isPro = dbUser?.isPro ?? false;
  }
  return token;
},
session({ session, token }) {
  if (token.sub) {
    session.user.id = token.sub;
  }
  session.user.isPro = (token.isPro as boolean) ?? false;
  return session;
},
```

This piggybacks on the existing `passwordChangedAt` query — just adds `isPro` to the `select`.

### Server Action Pattern

All actions follow the same shape (`src/actions/items.ts`, `src/actions/collections.ts`):

```typescript
"use server";
const session = await auth();
if (!session?.user?.id) return { success: false, error: "Unauthorized" };
// Zod validation → DB query → return { success, data/error }
```

### API Route Pattern

API routes use `NextResponse.json()` with status codes, rate limiting where applicable (`src/app/api/auth/login/route.ts`).

### Environment Variables

Already defined in `.env.example`:

```env
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_ID_MONTHLY=""
STRIPE_PRICE_ID_YEARLY=""
```

---

## 2. Feature Gating Analysis

### Free Tier Limits (from project spec)

| Resource     | Free | Pro       |
|-------------|------|-----------|
| Items       | 50   | Unlimited |
| Collections | 3    | Unlimited |
| File uploads| No   | Yes       |
| AI features | No   | Yes       |
| Custom types| No   | Yes       |
| Export      | No   | Yes       |

### Current Enforcement Status

**None.** There are currently **no limit checks** anywhere. Constants exist for pagination (`src/lib/constants.ts`) but not for tier limits:

```typescript
export const ITEMS_PER_PAGE = 21;
export const COLLECTIONS_PER_PAGE = 21;
```

### Where Limits Should Be Enforced

| Check Point | File | What to Check |
|---|---|---|
| Create item | `src/actions/items.ts` → `createItem()` | Count user's items, block at 50 if !isPro |
| Create collection | `src/actions/collections.ts` → `createCollection()` | Count user's collections, block at 3 if !isPro |
| File/Image upload | `src/app/api/upload/route.ts` | Block file type uploads if !isPro |
| File/Image type pages | `src/app/dashboard/items/[type]/page.tsx` | Show upgrade prompt if !isPro |

### Existing Pro Indicators

- Sidebar shows **PRO** badge on Files and Images types (`src/components/dashboard/Sidebar.tsx:24`):
  ```typescript
  const PRO_TYPES = new Set(["file", "image"]);
  ```
- Homepage pricing section shows correct prices and feature lists (`src/components/homepage/PricingSection.tsx`)

---

## 3. Implementation Plan

### 3.1 Stripe Dashboard Setup

1. **Create Products & Prices:**
   - Product: "CodeShelf Pro"
   - Price 1 (monthly): RM29/month, recurring
   - Price 2 (yearly): RM252/year, recurring
2. **Configure Customer Portal:**
   - Enable subscription cancellation
   - Enable plan switching (monthly ↔ yearly)
   - Enable payment method update
   - Set return URL to `{APP_URL}/settings`
3. **Create Webhook Endpoint:**
   - URL: `{APP_URL}/api/webhooks/stripe`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
4. **Copy IDs to `.env`:**
   - `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET` (from webhook creation)
   - `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY` (from price creation)

### 3.2 Files to Create

#### `src/lib/stripe.ts` — Stripe Client

```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});
```

#### `src/lib/subscription.ts` — Limit Constants & Helpers

```typescript
export const FREE_LIMITS = {
  MAX_ITEMS: 50,
  MAX_COLLECTIONS: 3,
} as const;

export const PRO_TYPES = new Set(["file", "image"]);

/** Check if a type requires Pro */
export function requiresPro(typeName: string): boolean {
  return PRO_TYPES.has(typeName);
}
```

#### `src/lib/db/subscription.ts` — DB Helpers

```typescript
import { prisma } from "@/lib/prisma";

export async function getUserItemCount(userId: string): Promise<number> {
  return prisma.item.count({ where: { userId } });
}

export async function getUserCollectionCount(userId: string): Promise<number> {
  return prisma.collection.count({ where: { userId } });
}

export async function activateProSubscription(
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string
) {
  return prisma.user.update({
    where: { id: userId },
    data: { isPro: true, stripeCustomerId, stripeSubscriptionId },
  });
}

export async function deactivateProSubscription(stripeCustomerId: string) {
  return prisma.user.updateMany({
    where: { stripeCustomerId },
    data: { isPro: false, stripeSubscriptionId: null },
  });
}

export async function getUserByStripeCustomerId(stripeCustomerId: string) {
  return prisma.user.findFirst({
    where: { stripeCustomerId },
    select: { id: true, email: true, isPro: true },
  });
}
```

#### `src/app/api/stripe/checkout/route.ts` — Create Checkout Session

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { priceId } = await request.json();

  // Validate priceId is one of our known prices
  const validPrices = [
    process.env.STRIPE_PRICE_ID_MONTHLY,
    process.env.STRIPE_PRICE_ID_YEARLY,
  ];
  if (!validPrices.includes(priceId)) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, stripeCustomerId: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Reuse existing Stripe customer or create new one
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    metadata: { userId: session.user.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
```

#### `src/app/api/stripe/portal/route.ts` — Customer Portal

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account found" },
      { status: 400 }
    );
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
  });

  return NextResponse.json({ url: portalSession.url });
}
```

#### `src/app/api/webhooks/stripe/route.ts` — Webhook Handler

```typescript
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import {
  activateProSubscription,
  deactivateProSubscription,
} from "@/lib/db/subscription";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (userId && customerId && subscriptionId) {
        await activateProSubscription(userId, customerId, subscriptionId);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      if (subscription.status === "active") {
        // Reactivated or plan changed — ensure Pro is on
        const user = await import("@/lib/db/subscription").then((m) =>
          m.getUserByStripeCustomerId(customerId)
        );
        if (user && !user.isPro) {
          await activateProSubscription(
            user.id,
            customerId,
            subscription.id
          );
        }
      } else if (
        subscription.status === "canceled" ||
        subscription.status === "unpaid"
      ) {
        await deactivateProSubscription(customerId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await deactivateProSubscription(subscription.customer as string);
      break;
    }

    case "invoice.payment_failed": {
      // Optional: send email notification via Resend
      // For now, Stripe handles dunning emails automatically
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

**Important:** This route must receive the raw body (not parsed JSON). In Next.js App Router, `request.text()` provides this automatically — no special config needed.

#### `src/components/settings/BillingSection.tsx` — Settings Billing UI

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, ExternalLink, Loader2 } from "lucide-react";

interface BillingSectionProps {
  isPro: boolean;
  hasStripeCustomer: boolean;
}

export default function BillingSection({ isPro, hasStripeCustomer }: BillingSectionProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(plan: "monthly" | "yearly") {
    setLoading(plan);
    try {
      const priceId =
        plan === "monthly"
          ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY
          : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY;

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  async function handlePortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Crown className="h-5 w-5" />
        Subscription
      </h2>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-muted-foreground">Current plan:</span>
        {isPro ? (
          <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30">
            Pro
          </Badge>
        ) : (
          <Badge variant="secondary">Free</Badge>
        )}
      </div>

      {isPro ? (
        <Button variant="outline" onClick={handlePortal} disabled={!!loading}>
          {loading === "portal" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Manage Subscription
          <ExternalLink className="ml-2 h-3.5 w-3.5" />
        </Button>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Upgrade to Pro for unlimited items, collections, file uploads, AI features, and more.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => handleCheckout("monthly")} disabled={!!loading}>
              {loading === "monthly" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              RM29/month
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCheckout("yearly")}
              disabled={!!loading}
              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
            >
              {loading === "yearly" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              RM21/mo (yearly)
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
```

#### `src/components/shared/UpgradePrompt.tsx` — Reusable Limit Gate

```typescript
import Link from "next/link";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpgradePromptProps {
  feature: string; // e.g., "create more items", "upload files"
}

export function UpgradePrompt({ feature }: UpgradePromptProps) {
  return (
    <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-6 text-center">
      <Crown className="h-8 w-8 text-blue-400 mx-auto mb-3" />
      <h3 className="text-lg font-semibold mb-1">Upgrade to Pro</h3>
      <p className="text-sm text-muted-foreground mb-4">
        You need a Pro subscription to {feature}.
      </p>
      <Button asChild className="bg-blue-500 hover:bg-blue-600 text-white">
        <Link href="/settings">Upgrade Now</Link>
      </Button>
    </div>
  );
}
```

### 3.3 Files to Modify

#### `src/auth.ts` — Add `isPro` to JWT/Session

**Change:** Merge `isPro` into the existing `passwordChangedAt` DB query and pass it through token → session.

**Also need:** Extend NextAuth types for `isPro` on session.

#### `src/types/next-auth.d.ts` — Type Augmentation (create)

```typescript
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isPro: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isPro?: boolean;
    issuedAt?: number;
  }
}
```

#### `src/actions/items.ts` — Add Item Limit Check

In `createItem()`, after auth check:

```typescript
// Free tier: max 50 items
if (!session.user.isPro) {
  const count = await getUserItemCount(session.user.id);
  if (count >= FREE_LIMITS.MAX_ITEMS) {
    return { success: false, error: "Free plan limit reached (50 items). Upgrade to Pro for unlimited items." };
  }
}
```

#### `src/actions/collections.ts` — Add Collection Limit Check

In `createCollection()`, after auth check:

```typescript
// Free tier: max 3 collections
if (!session.user.isPro) {
  const count = await getUserCollectionCount(session.user.id);
  if (count >= FREE_LIMITS.MAX_COLLECTIONS) {
    return { success: false, error: "Free plan limit reached (3 collections). Upgrade to Pro for unlimited." };
  }
}
```

#### `src/app/api/upload/route.ts` — Block Free File Uploads

Add auth check + Pro gate at the top of the POST handler:

```typescript
const session = await auth();
if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
if (!session.user.isPro) return NextResponse.json({ error: "Pro required" }, { status: 403 });
```

#### `src/app/settings/page.tsx` — Add Billing Section

Add `BillingSection` component before Editor Preferences:

```typescript
import BillingSection from "@/components/settings/BillingSection";
// ... in render:
<BillingSection isPro={profile.isPro} hasStripeCustomer={!!profile.stripeCustomerId} />
```

Requires updating `getProfileData` to return `isPro` and `stripeCustomerId`.

#### `src/app/dashboard/layout.tsx` — Pass `isPro` to Shell

Pass `isPro` from session to `DashboardShell` so sidebar and TopBar can show Pro status.

#### `src/components/dashboard/Sidebar.tsx` — Use Session `isPro`

Replace hardcoded PRO badges with conditional logic that hides them for Pro users (or shows them as active).

#### `src/components/homepage/PricingSection.tsx` — Link to Checkout

Change "Upgrade to Pro" button `href` from `/register` to `/settings` for logged-in users.

#### `.env.example` — Already Has Stripe Vars

Already includes `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY`. Also need to add:

```env
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=""
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=""
```

(Client-side needs price IDs to send to checkout endpoint.)

---

## 4. Implementation Order

| Step | Task | Files |
|------|------|-------|
| 1 | Install `stripe` package | `package.json` |
| 2 | Create Stripe client | `src/lib/stripe.ts` |
| 3 | Create subscription constants + DB helpers | `src/lib/subscription.ts`, `src/lib/db/subscription.ts` |
| 4 | Add `isPro` to JWT/session + type augmentation | `src/auth.ts`, `src/types/next-auth.d.ts` |
| 5 | Create checkout API route | `src/app/api/stripe/checkout/route.ts` |
| 6 | Create portal API route | `src/app/api/stripe/portal/route.ts` |
| 7 | Create webhook handler | `src/app/api/webhooks/stripe/route.ts` |
| 8 | Create BillingSection component | `src/components/settings/BillingSection.tsx` |
| 9 | Add BillingSection to settings page | `src/app/settings/page.tsx` |
| 10 | Add free tier limits to server actions | `src/actions/items.ts`, `src/actions/collections.ts` |
| 11 | Gate file uploads | `src/app/api/upload/route.ts` |
| 12 | Create UpgradePrompt component | `src/components/shared/UpgradePrompt.tsx` |
| 13 | Pass `isPro` through dashboard layout → sidebar | `src/app/dashboard/layout.tsx`, `src/components/dashboard/Sidebar.tsx` |
| 14 | Update homepage pricing links | `src/components/homepage/PricingSection.tsx` |

---

## 5. Testing Checklist

### Stripe CLI Local Testing

```bash
# Install Stripe CLI and login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the webhook signing secret (whsec_...) to .env
```

### Manual Test Scenarios

- [ ] **Free user creates item** — works up to 50, blocked at 51
- [ ] **Free user creates collection** — works up to 3, blocked at 4
- [ ] **Free user tries file upload** — blocked with upgrade prompt
- [ ] **Free user clicks upgrade** — redirected to Stripe Checkout
- [ ] **Complete checkout** — webhook fires, `isPro` = true, session refreshes on page reload
- [ ] **Pro user creates unlimited items/collections** — no limits
- [ ] **Pro user uploads files** — works
- [ ] **Pro user opens billing portal** — can view/cancel subscription
- [ ] **Cancel subscription** — webhook fires, `isPro` = false
- [ ] **Failed payment** — subscription goes `past_due`, user notified
- [ ] **Switch plan** (monthly → yearly) — portal handles it, webhook confirms
- [ ] **Delete account** — should cancel Stripe subscription first (update delete account flow)

### Webhook Events to Test

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```

### Edge Cases

- [ ] User signs up with GitHub OAuth then upgrades — `stripeCustomerId` created correctly
- [ ] Same email, different Stripe customer — reuse existing `stripeCustomerId`
- [ ] Webhook arrives before checkout redirect — user still gets Pro on refresh
- [ ] Multiple rapid webhook deliveries — `updateMany` is idempotent
- [ ] User is already Pro and tries to checkout again — Stripe shows existing subscription

---

## 6. Architecture Notes

### Why Raw Body Works in Next.js App Router

Next.js App Router does **not** auto-parse the request body. Calling `request.text()` returns the raw string, which is exactly what `stripe.webhooks.constructEvent()` needs for signature verification. No special config is required (unlike Pages Router which needs `config.api.bodyParser = false`).

### Why Always-Sync `isPro` in JWT

The research notes flag that `trigger === "update"` in NextAuth v5 JWT callback is unreliable for picking up webhook-driven DB changes. Instead, we always read `isPro` from the DB during token validation. This adds one small query (which we're already doing for `passwordChangedAt`) but guarantees the session stays in sync. A simple page reload after checkout is sufficient.

### Idempotent Webhook Handling

All webhook handlers are idempotent:
- `activateProSubscription` sets fields to specific values (not toggles)
- `deactivateProSubscription` uses `updateMany` which is safe if no match
- Processing the same event twice has no negative effect

### Account Deletion Consideration

The existing delete account flow (`src/app/api/profile/delete-account/route.ts`) should be updated to cancel any active Stripe subscription before deleting the user:

```typescript
if (user.stripeSubscriptionId) {
  await stripe.subscriptions.cancel(user.stripeSubscriptionId);
}
```
