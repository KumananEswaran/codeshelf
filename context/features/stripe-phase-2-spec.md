# Stripe Integration Phase 2 - Webhooks, Feature Gating & UI

## Overview

Wire up Stripe Checkout, Customer Portal, webhook handler, free-tier enforcement in server actions, and billing UI in settings. Requires Stripe Dashboard products/prices created and Stripe CLI for local webhook testing.

## Prerequisites

- Phase 1 completed (Stripe client, subscription helpers, `isPro` in session)
- Stripe Dashboard: product "CodeShelf Pro" with two prices created (RM29/mo monthly, RM252/yr annual)
- Stripe Customer Portal configured (cancel, plan switch, payment method update, return URL → `/settings`)
- Stripe CLI installed and authenticated (`stripe login`)
- `.env` populated with all Stripe keys and price IDs

## Files to Create

### 1. `src/app/api/stripe/checkout/route.ts` — Create Checkout Session

- POST route, requires auth
- Accepts `{ priceId }` in body
- Validates `priceId` against `STRIPE_PRICE_ID_MONTHLY` and `STRIPE_PRICE_ID_YEARLY`
- Reuses existing `stripeCustomerId` or creates new Stripe customer with `metadata.userId`
- Saves `stripeCustomerId` to DB if newly created
- Creates checkout session with `mode: "subscription"`, `success_url` → `/dashboard?upgraded=true`, `cancel_url` → `/settings`
- Returns `{ url }` for client-side redirect

### 2. `src/app/api/stripe/portal/route.ts` — Customer Portal

- POST route, requires auth
- Looks up user's `stripeCustomerId`
- Returns 400 if no billing account
- Creates portal session with `return_url` → `/settings`
- Returns `{ url }` for client-side redirect

### 3. `src/app/api/webhooks/stripe/route.ts` — Webhook Handler

- POST route, no auth (Stripe sends directly)
- Reads raw body via `request.text()` (App Router does not auto-parse)
- Verifies signature with `stripe.webhooks.constructEvent()`
- Handles these events:

| Event | Action |
|---|---|
| `checkout.session.completed` | `activateProSubscription(userId, customerId, subscriptionId)` |
| `customer.subscription.updated` | Re-activate if `status === "active"`, deactivate if `canceled` or `unpaid` |
| `customer.subscription.deleted` | `deactivateProSubscription(customerId)` |
| `invoice.payment_failed` | No-op for now (Stripe handles dunning emails) |

- Returns `{ received: true }` on success

### 4. `src/components/settings/BillingSection.tsx` — Billing UI

Client component with props `{ isPro, hasStripeCustomer }`:

- **Free users:** shows current plan badge (Free), upgrade text, two buttons:
  - "RM29/month" → calls checkout with monthly price ID
  - "RM21/mo (yearly)" → calls checkout with yearly price ID, blue accent styling
- **Pro users:** shows Pro badge, "Manage Subscription" button → calls portal endpoint
- Loading states with Loader2 spinner on each button independently
- Uses `NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY` and `NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY` env vars

### 5. `src/components/shared/UpgradePrompt.tsx` — Reusable Limit Gate

- Server component, accepts `{ feature: string }` (e.g., "create more items", "upload files")
- Crown icon, "Upgrade to Pro" heading, feature-specific message
- "Upgrade Now" button links to `/settings`
- Blue accent border/background styling

## Files to Modify

### 1. `src/actions/items.ts` — Item Limit Check

In `createItem()`, after auth check and before Zod validation:

```typescript
if (!session.user.isPro) {
  const count = await getUserItemCount(session.user.id);
  if (count >= FREE_LIMITS.MAX_ITEMS) {
    return { success: false, error: "Free plan limit reached (50 items). Upgrade to Pro for unlimited items." };
  }
}
```

Import `getUserItemCount` from `@/lib/db/subscription` and `FREE_LIMITS` from `@/lib/subscription`.

### 2. `src/actions/collections.ts` — Collection Limit Check

In `createCollection()`, after auth check:

```typescript
if (!session.user.isPro) {
  const count = await getUserCollectionCount(session.user.id);
  if (count >= FREE_LIMITS.MAX_COLLECTIONS) {
    return { success: false, error: "Free plan limit reached (3 collections). Upgrade to Pro for unlimited." };
  }
}
```

### 3. `src/app/api/upload/route.ts` — Block Free File Uploads

Add at top of POST handler, after auth check:

```typescript
if (!session.user.isPro) {
  return NextResponse.json({ error: "Pro required" }, { status: 403 });
}
```

### 4. `src/app/settings/page.tsx` — Add Billing Section

- Import and render `BillingSection` before Editor Preferences section
- Update `getProfileData` query to include `isPro` and `stripeCustomerId` in select
- Pass `isPro={profile.isPro}` and `hasStripeCustomer={!!profile.stripeCustomerId}`

### 5. `src/app/dashboard/layout.tsx` — Pass `isPro` to Shell

- Pass `isPro` from session to `DashboardShell` so sidebar can conditionally show Pro badges

### 6. `src/components/dashboard/Sidebar.tsx` — Use Session `isPro`

- Accept `isPro` prop
- Import `PRO_TYPES` from `@/lib/subscription` instead of local constant
- Hide PRO badge for Pro users (or show as unlocked indicator)

### 7. `src/components/homepage/PricingSection.tsx` — Checkout Links

- For logged-in users, "Upgrade to Pro" button should link to `/settings` instead of `/register`

### 8. `src/app/api/profile/delete-account/route.ts` — Cancel on Delete

Before deleting user, cancel active Stripe subscription:

```typescript
if (user.stripeSubscriptionId) {
  await stripe.subscriptions.cancel(user.stripeSubscriptionId);
}
```

## Stripe Dashboard Setup (Manual)

1. Create product "CodeShelf Pro"
2. Create price: RM29/month recurring
3. Create price: RM252/year recurring
4. Configure Customer Portal (cancel, switch plan, update payment, return URL)
5. Create webhook endpoint → `{APP_URL}/api/webhooks/stripe`
6. Subscribe to events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
7. Copy all keys/IDs to `.env`

## Testing

### Local Webhook Testing (Stripe CLI)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy whsec_... to STRIPE_WEBHOOK_SECRET in .env
```

### Manual Test Scenarios

- [ ] Free user creates items up to 50 — works; item 51 returns limit error
- [ ] Free user creates collections up to 3 — works; collection 4 returns limit error
- [ ] Free user tries file upload — returns 403
- [ ] Free user clicks upgrade on settings — redirects to Stripe Checkout
- [ ] Complete checkout — webhook fires, `isPro` flips to true, session reflects on reload
- [ ] Pro user creates unlimited items/collections — no limits
- [ ] Pro user uploads files — works
- [ ] Pro user opens billing portal — can view/cancel/switch plan
- [ ] Cancel subscription via portal — webhook fires, `isPro` flips to false
- [ ] Switch monthly to yearly via portal — webhook confirms, Pro stays active
- [ ] Delete account with active subscription — Stripe subscription cancelled first

### Webhook Events to Trigger

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```

### Edge Cases

- [ ] GitHub OAuth user upgrades — `stripeCustomerId` created correctly
- [ ] Existing `stripeCustomerId` reused on repeat checkout
- [ ] Webhook arrives before checkout redirect — user gets Pro on next page load
- [ ] Multiple rapid webhook deliveries — idempotent, no duplicate effects
- [ ] Already-Pro user visits checkout — Stripe shows existing subscription
