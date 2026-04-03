# Stripe Integration Phase 1 - Core Infrastructure

## Overview

Set up Stripe SDK, subscription helpers, usage-limit constants, DB helpers, and add `isPro` to the NextAuth JWT/session. This phase is pure backend — no UI, no webhooks, no Stripe Dashboard setup required. Everything here is unit-testable locally.

## Requirements

- Install `stripe` npm package
- Create Stripe client singleton
- Define free-tier limit constants and helper functions
- Create DB helper functions for subscription lifecycle
- Add `isPro` to JWT token and session (piggyback on existing `passwordChangedAt` query)
- Augment NextAuth types for `isPro`
- Unit tests for the usage-limits module

## Files to Create

### 1. `src/lib/stripe.ts` — Stripe Client

```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});
```

### 2. `src/lib/subscription.ts` — Limit Constants & Helpers

```typescript
export const FREE_LIMITS = {
  MAX_ITEMS: 50,
  MAX_COLLECTIONS: 3,
} as const;

export const PRO_TYPES = new Set(["file", "image"]);

export function requiresPro(typeName: string): boolean {
  return PRO_TYPES.has(typeName);
}

export function canCreateItem(currentCount: number, isPro: boolean): boolean {
  return isPro || currentCount < FREE_LIMITS.MAX_ITEMS;
}

export function canCreateCollection(currentCount: number, isPro: boolean): boolean {
  return isPro || currentCount < FREE_LIMITS.MAX_COLLECTIONS;
}
```

### 3. `src/lib/subscription.test.ts` — Unit Tests

Test the following:

- `requiresPro("file")` returns `true`
- `requiresPro("image")` returns `true`
- `requiresPro("snippet")` returns `false`
- `requiresPro("note")` returns `false`
- `canCreateItem(49, false)` returns `true` (under limit)
- `canCreateItem(50, false)` returns `false` (at limit)
- `canCreateItem(50, true)` returns `true` (Pro bypasses)
- `canCreateItem(999, true)` returns `true` (Pro unlimited)
- `canCreateCollection(2, false)` returns `true` (under limit)
- `canCreateCollection(3, false)` returns `false` (at limit)
- `canCreateCollection(3, true)` returns `true` (Pro bypasses)
- `FREE_LIMITS.MAX_ITEMS` equals `50`
- `FREE_LIMITS.MAX_COLLECTIONS` equals `3`

### 4. `src/lib/db/subscription.ts` — DB Helpers

Functions to create (all use Prisma):

| Function | Purpose |
|---|---|
| `getUserItemCount(userId)` | Count user's items |
| `getUserCollectionCount(userId)` | Count user's collections |
| `activateProSubscription(userId, stripeCustomerId, stripeSubscriptionId)` | Set `isPro=true` + store Stripe IDs |
| `deactivateProSubscription(stripeCustomerId)` | Set `isPro=false`, clear `stripeSubscriptionId` |
| `getUserByStripeCustomerId(stripeCustomerId)` | Look up user by Stripe customer ID |

All handlers must be idempotent (safe to call multiple times with same input).

### 5. `src/types/next-auth.d.ts` — Type Augmentation (modify existing)

Add `isPro: boolean` to `Session.user` and `isPro?: boolean` to `JWT`.

## Files to Modify

### 1. `src/auth.ts` — Add `isPro` to JWT/Session

**In the `jwt` callback:**
- Add `isPro: true` to the existing `prisma.user.findUnique` `select` clause (already queries `passwordChangedAt`)
- Set `token.isPro = dbUser?.isPro ?? false`

**In the `session` callback:**
- Set `session.user.isPro = (token.isPro as boolean) ?? false`

### 2. `.env.example` — Add Client-Side Price IDs

Append:
```
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=""
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=""
```

## Key Notes

- The `isPro` query piggybacks on the existing `passwordChangedAt` DB call — no extra query
- `PRO_TYPES` centralizes the set currently hardcoded in `src/components/dashboard/Sidebar.tsx:24`
- All DB helpers use `updateMany` or specific `where` clauses for idempotency
- No Stripe Dashboard setup needed for this phase — only the SDK and local code

## Testing

1. `npm test` — unit tests for subscription constants and helpers pass
2. `npm run build` — no type errors
3. Verify session includes `isPro: false` for existing users (check via browser DevTools or `console.log` in a server component)
