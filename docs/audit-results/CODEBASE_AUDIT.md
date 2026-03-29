# CodeShelf Codebase Audit

**Date:** 2026-03-29
**Auditor:** Claude Code (Sonnet 4.6)
**Scope:** Full source tree — security, performance, code quality, component decomposition

---

## 🔴 Critical

### [C1] Header injection via unquoted filename in Content-Disposition

**File:** `src/app/api/download/[key]/route.ts` (line 33)

**Issue:** The `cleanName` value is interpolated directly into the `Content-Disposition` header using a plain double-quoted `filename=` parameter, with no encoding or sanitization. The filename is derived from user-controlled R2 key path segments. If a filename contains a double-quote or newline character, an attacker could inject arbitrary response headers (header injection) or break the Content-Disposition value.

**Code:**
```ts
"Content-Disposition": `attachment; filename="${cleanName}"`,
```

**Fix:** Use RFC 5987 encoding or `filename*=UTF-8''<percent-encoded>` for non-ASCII/special characters. At minimum, strip double-quotes and newlines from the filename before inserting it:

```ts
const safeCleanName = cleanName.replace(/["\r\n]/g, "_");
"Content-Disposition": `attachment; filename="${safeCleanName}"`,
```

A more robust approach is to always use the RFC 5987 form:
```ts
const encoded = encodeURIComponent(cleanName);
"Content-Disposition": `attachment; filename*=UTF-8''${encoded}`,
```

---

### [C2] R2 file key extraction is brittle and can silently serve wrong files

**Files:**
- `src/components/dashboard/ItemDrawer.tsx` (lines 465-469)
- `src/components/dashboard/FileListItem.tsx` (lines 68-70)

**Issue:** Both components reconstruct the R2 key by splitting the public file URL on `/` and slicing from index 3 onward. This assumes the R2 public URL has exactly two path segments before the key (e.g., `https://domain.com/<key>`). If the `R2_PUBLIC_URL` env var changes structure, or if a filename contains a URL-safe slash substitution, the key will silently be wrong — causing either a 403 from the download proxy (wrong user prefix check fails) or a fetch of the wrong file.

The download proxy already has the correct logic via `getR2KeyFromUrl()` in `src/lib/r2.ts`. Client components should not be re-deriving the key independently.

**Code (ItemDrawer.tsx lines 465-469):**
```ts
const publicUrl = item.fileUrl!;
const urlParts = publicUrl.split("/");
const key = urlParts.slice(3).join("/");
window.open(`/api/download/${encodeURIComponent(key)}`, "_blank");
```

**Fix:** Create a small utility function that centralizes the URL-to-key conversion so the logic is in one place. Since the server-side `getR2KeyFromUrl` is the authoritative version, expose the R2 public URL prefix as a `NEXT_PUBLIC_R2_PUBLIC_URL` env var and use it in a shared helper:

```ts
// src/lib/r2-utils.ts  (client-safe, no secrets)
export function getKeyFromPublicUrl(fileUrl: string): string | null {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!base || !fileUrl.startsWith(base)) return null;
  return fileUrl.slice(base.length + 1);
}
```

Both `ItemDrawer` and `FileListItem` should import and use this instead of the inline slice logic.

---

## 🟠 High

### [H1] No upload size cap enforced on the server request body

**File:** `src/app/api/upload/route.ts` (entire route)

**Issue:** The upload route calls `request.formData()` before doing any size check. The `validateUpload()` call happens _after_ the full body is already read into memory as a `Buffer`. An attacker can send an arbitrarily large upload and cause the server process to run out of memory before validation ever rejects it. The client-side limits on the `FileUpload` component are advisory only — they are trivially bypassed.

**Fix:** Next.js App Router allows configuring `bodyParser` limits via route segment config. Add a size limit to the route:

```ts
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "11mb", // just above the max allowed file size
    },
  },
};
```

For the App Router specifically, use route segment `maxDuration` and also configure your hosting (Vercel) upload limits. As a code-level guard, check `Content-Length` before reading the body:

```ts
const contentLength = request.headers.get("content-length");
if (contentLength && parseInt(contentLength) > 11 * 1024 * 1024) {
  return NextResponse.json({ error: "File too large" }, { status: 413 });
}
```

---

### [H2] `auth.ts` JWT callback makes a database query on every request

**File:** `src/auth.ts` (lines 23-34)

**Issue:** The `jwt` callback runs on every authenticated request and unconditionally fires a `prisma.user.findUnique` to check `passwordChangedAt`. This executes a database round-trip for every API call, Server Action, and page render that uses `auth()`. With no caching layer (Redis is listed as optional/not implemented), this is a significant per-request overhead that scales poorly.

**Code:**
```ts
if (token.sub && token.issuedAt) {
  const dbUser = await prisma.user.findUnique({
    where: { id: token.sub },
    select: { passwordChangedAt: true },
  });
  ...
}
```

**Fix:** Store `passwordChangedAt` as a timestamp in the JWT itself (updated when password changes), then compare client-side in the callback — no DB call needed:

```ts
// In jwt callback, when user signs in:
if (user) {
  token.sub = user.id;
  token.issuedAt = Date.now();
  token.passwordChangedAt = user.passwordChangedAt?.getTime() ?? null;
}

// Invalidation check — pure in-memory, no DB:
if (
  token.passwordChangedAt &&
  (token.passwordChangedAt as number) > (token.issuedAt as number)
) {
  return null as unknown as typeof token;
}
```

When the password is changed, update `passwordChangedAt` in the DB (already done) — the next JWT rotation will pick it up. The token TTL (typically 30 days) is the invalidation window, which is acceptable for password changes.

---

### [H3] `getItemsByType` has no result limit and no pagination

**File:** `src/lib/db/items.ts` (lines 158-172)

**Issue:** `getItemsByType` fetches all items of a given type for a user with no `take` limit. A user with 5,000 snippets will cause all 5,000 rows to be loaded into memory and serialized on every visit to `/dashboard/items/snippets`. Compare with `getRecentItems` which caps at 100. This function is called in a server component (`ItemsListPage`) and passes the full array to the client.

**Code:**
```ts
export async function getItemsByType(
  userId: string,
  typeName: string
): Promise<ItemWithDetails[]> {
  const items = await prisma.item.findMany({
    where: { userId, type: { name: typeName } },
    orderBy: { createdAt: "desc" },
    select: itemSelect,
    // no take/limit
  });
  ...
}
```

**Fix:** Add a default cap and prepare for cursor-based pagination:

```ts
export async function getItemsByType(
  userId: string,
  typeName: string,
  limit = 50
): Promise<ItemWithDetails[]> {
  const cappedLimit = Math.min(limit, 200);
  const items = await prisma.item.findMany({
    where: { userId, type: { name: typeName } },
    orderBy: { createdAt: "desc" },
    take: cappedLimit,
    select: itemSelect,
  });
  ...
}
```

---

### [H4] `getRecentCollections` loads all collection items to compute dominant color (unbounded)

**File:** `src/lib/db/collections.ts` (lines 14-82)

**Issue:** The query selects all items in every collection (`items: { select: { type: { select: { id, icon, color } } } }`) with no limit. For a collection with hundreds of items, every item's type is loaded just to count which color occurs most. The `getSidebarCollections` function has the same pattern. This is an O(total items across all collections) query.

**Code:**
```ts
items: {
  select: {
    type: {
      select: { id: true, icon: true, color: true },
    },
  },
},
```

**Fix:** Use a raw aggregation query or store `dominantColor` as a denormalized field on the Collection model. The simplest safe fix is to add a `take` limit on the items sub-query:

```ts
items: {
  take: 50, // enough to determine dominant color accurately
  select: {
    type: {
      select: { id: true, color: true },
    },
  },
},
```

---

## 🟡 Medium

### [M1] `mock-data.ts` is dead code that ships in the production bundle

**File:** `src/lib/mock-data.ts` (entire file, 192 lines)

**Issue:** This file exports `mockUser`, `mockItemTypes`, `mockCollections`, `mockItems`, and `mockItemTypeCounts`. No file in `src/` imports it (confirmed by grep). It exists in the live source tree and will be tree-shaken only if nothing uses it — but it adds noise and violates the coding standard "no unused imports or variables." It also contains hardcoded email addresses and IDs.

**Fix:** Delete the file.

---

### [M2] `getPinnedItems` has no result cap

**File:** `src/lib/db/items.ts` (lines 81-89)

**Issue:** `getPinnedItems` fetches all pinned items with no `take` limit. A user who pins dozens of items will load them all. While less severe than `getItemsByType`, it's inconsistent with the capping pattern applied to `getRecentItems` and `getRecentCollections`.

**Fix:**
```ts
export async function getPinnedItems(userId: string, limit = 20): Promise<ItemWithDetails[]> {
  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: itemSelect,
  });
  return items.map(formatItem);
}
```

---

### [M3] `updateItem` deletes and re-creates all tag associations outside a transaction

**File:** `src/lib/db/items.ts` (lines 252-321)

**Issue:** The update function runs `prisma.itemTag.deleteMany` and then `prisma.item.update` (which creates new tag associations) as two separate, sequential operations. If the server crashes between the two calls, the item ends up with no tags. This should be atomic.

**Code:**
```ts
// Delete existing tag associations
await prisma.itemTag.deleteMany({ where: { itemId } });

const updated = await prisma.item.update({
  where: { id: itemId },
  data: { ...tags: { create: ... } },
  ...
});
```

**Fix:** Wrap in `prisma.$transaction`:

```ts
const updated = await prisma.$transaction(async (tx) => {
  await tx.itemTag.deleteMany({ where: { itemId } });
  return tx.item.update({
    where: { id: itemId },
    data: { ...data, tags: { create: ... } },
    select: { ... },
  });
});
```

---

### [M4] Duplicate inline item card JSX in `PinnedItems` and `RecentItems`

**Files:**
- `src/components/dashboard/PinnedItems.tsx`
- `src/components/dashboard/RecentItems.tsx`

**Issue:** These two components render an identical card structure (icon, title, favorite star, pin icon, tags, date). The only differences are the section title/icon and that `PinnedItems` always shows the pin icon while `RecentItems` shows it conditionally. This is ~60 lines of JSX duplicated verbatim. Meanwhile `ItemCard.tsx` already renders this exact same layout for the item type list pages.

**Fix:** Both `PinnedItems` and `RecentItems` should use `ItemCard` with an `onClick` prop, exactly as `ItemsListWithDrawer` does. The card variant (with/without the always-on pin icon) can be handled by the existing `isPinned` flag already present on items.

---

### [M5] `TopBar` search input is not connected to any search logic

**File:** `src/components/dashboard/TopBar.tsx` (lines 8-11)

**Issue:** The search `<Input>` has `placeholder="Search items..."` but no `onChange`, no state, no action, and no submission handler. Clicking or typing in it does nothing. This is a non-functional UI element exposed to authenticated users.

This is distinct from "feature not built yet" — a visible, interactive-looking input that silently does nothing is a UX defect. It should either be removed until search is implemented, or disabled with a tooltip explaining it's coming soon.

**Fix:** Either remove the input from `TopBar` until search is implemented, or render it in a disabled state:

```tsx
<Input
  placeholder="Search items..."
  className="pl-9"
  disabled
  title="Search coming soon"
/>
```

---

### [M6] `register` route returns a misleading 201 success for existing emails

**File:** `src/app/api/auth/register/route.ts` (lines 36-49)

**Issue:** When an email already exists, the route returns `{ success: true, requireVerification: true, message: "Check your email..." }` with status 201. The intent is to prevent email enumeration (good), but the response body contains `requireVerification: true` which the `RegisterForm` component uses to show the "check your email" state — implying a verification email was sent when it was not. An existing user trying to re-register will wait for an email that never arrives.

**Fix:** If `REQUIRE_EMAIL_VERIFICATION` is `false` (which it is by default), the existing user path should return `requireVerification: false` so the UI redirects to sign-in, not to a waiting screen. If verification is on, the behavior is acceptable (no email is sent, but the user is in a safe wait state). Add a comment making this explicit, and consider the non-verification path:

```ts
if (existingUser) {
  return NextResponse.json(
    {
      success: true,
      requireVerification: process.env.REQUIRE_EMAIL_VERIFICATION === "true",
      message:
        process.env.REQUIRE_EMAIL_VERIFICATION === "true"
          ? "Check your email to verify your account"
          : "Account created successfully",
    },
    { status: 201 }
  );
}
```

---

### [M7] Inline styles used extensively in card components (violates coding standards)

**Files:**
- `src/components/dashboard/ItemCard.tsx` (lines 19-23, 27-29)
- `src/components/dashboard/PinnedItems.tsx` (lines 30-32, 37)
- `src/components/dashboard/RecentItems.tsx` (lines 30-32, 37)
- `src/components/dashboard/CollectionsGrid.tsx` (lines 31-35)

**Issue:** Inline `style={{ borderLeftColor: item.type.color, borderLeftWidth: 3 }}` and `style={{ color: item.type.color }}` are used across multiple components to apply dynamic colors from the database. The coding standard says "No inline styles — use Tailwind." While dynamic database-driven colors require some CSS custom property approach, the same pattern appears repeatedly across four files with no abstraction.

**Fix:** For dynamic colors, use CSS custom properties and a wrapper div:

```tsx
<div style={{ "--item-color": item.type.color } as React.CSSProperties}>
  <Card className="border-l-[3px] border-l-[var(--item-color)]">
```

Or extract a small helper that returns the `style` prop shape so it's defined once:

```ts
function itemColorStyle(color: string | null) {
  return color ? { borderLeftColor: color, borderLeftWidth: 3 } : undefined;
}
```

---

## 🔵 Low

### [L1] `proxy.ts` is misnamed — the file is actually the NextAuth middleware

**File:** `src/proxy.ts`

**Issue:** The Next.js middleware file that protects `/dashboard` routes is named `proxy.ts` instead of `middleware.ts`. This is confusing — "proxy" suggests it forwards requests, but it's actually an auth guard. Next.js requires the middleware file to be at `src/middleware.ts` to be picked up automatically. It works currently only because there is a manual `export const config` matcher in the same file, but naming it `proxy.ts` means any developer looking for middleware won't find it in the expected location.

Wait — on reflection, Next.js does discover middleware from `src/middleware.ts`. Checking that this file is actually being loaded: the file exports `default auth(...)` and has a `config` matcher. Next.js only picks up `middleware.ts` (or `middleware.js`) at the project root or `src/`. If this file is `proxy.ts`, it is **not** being used as Next.js middleware at all. The dashboard is only protected by the `redirect()` calls in the layout and page server components, not by an edge middleware proxy.

**Fix:** Rename `src/proxy.ts` to `src/middleware.ts`. This makes the edge-level auth guard actually active and provides a second layer of protection in addition to the server component redirects.

---

### [L2] `CollectionsGrid` uses index as key for type icons

**File:** `src/components/dashboard/CollectionsGrid.tsx` (lines 57-63)

**Issue:** The icon array in a collection card uses the array index as the React key: `key={i}`. If the array reorders (e.g., after an update), React will not correctly reconcile the elements.

**Code:**
```tsx
{col.typeIcons.map((t, i) => {
  const IconComponent = getIcon(t.icon);
  return (
    <IconComponent
      key={i}
      ...
    />
  );
})}
```

**Fix:** Use a stable key. Since `typeIcons` entries have an `icon` field that is unique per type within a collection, use that:

```tsx
<IconComponent key={t.icon ?? i} ... />
```

---

### [L3] `ItemDrawer` `Favorite` and `Pin` action buttons are non-functional stubs

**File:** `src/components/dashboard/ItemDrawer.tsx` (lines 249-277)

**Issue:** The Favorite and Pin buttons in the action bar render correctly but have no `onClick` handler — they cannot be interacted with. Unlike the search input (M5), these are buttons in a feature-complete component (the drawer with working edit/delete), which makes them look broken rather than planned.

**Fix:** Either wire them up to `toggleFavorite`/`togglePin` server actions, or add `disabled` props with a `title="Coming soon"` tooltip until implemented.

---

### [L4] `ItemDrawer` copy button is also a non-functional stub

**File:** `src/components/dashboard/ItemDrawer.tsx` (line 272)

**Issue:** The Copy button inside the drawer's action bar (separate from the `CopyButton` component on item cards) has no `onClick` handler. The Copy functionality does exist in `CopyButton.tsx` but is not wired into the drawer's action bar.

**Fix:** Reuse the `CopyButton` component here, passing the loaded `item` object.

---

### [L5] `formatDate` does not include the year, causing ambiguity for older items

**File:** `src/lib/utils.ts` (lines 8-12)

**Issue:** `formatDate` formats dates as `"Mar 15"` with no year. For items created in previous years this displays an ambiguous date. The `ItemDetail` type includes both `createdAt` and `updatedAt`, and these are shown in the drawer.

**Fix:**

```ts
export function formatDate(date: Date): string {
  const now = new Date();
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}
```

---

### [L6] `getRecentCollections` fetches type icons for display but `getItemsByType` items list page doesn't show collection context

Minor observation: `getRecentCollections` eagerly loads type icons to show in collection cards (good). But the full `items` set in that query (all items in each collection, no limit — see H4) is used only to derive `dominantColor` and `typeIcons`. The icon display requires at most one item per type, not all items.

(This is the same root cause as H4 but worth noting separately as a readability note — the intent and the query size are misaligned.)

---

### [L7] `ItemsListWithDrawer` derives layout type from first item, which is fragile

**File:** `src/components/dashboard/ItemsListWithDrawer.tsx` (line 19)

**Issue:**
```ts
const typeName = items.length > 0 ? items[0].type.name : "";
const isImageGrid = typeName === "image";
const isFileList = typeName === "file";
```

The layout mode is inferred from the first item's type. If a mixed list is ever passed (e.g., a future "all items" view or after a filter change), the first item's type controls the entire grid layout for all items. The `type` that determines layout should be passed as a prop from the parent (which knows the route slug).

**Fix:**
```ts
interface ItemsListWithDrawerProps {
  items: ItemWithDetails[];
  typeName?: string; // explicit, from the page
}
```

---

## Summary

| Severity | Count |
|---|---|
| Critical | 2 |
| High | 4 |
| Medium | 7 |
| Low | 7 |
| **Total** | **20** |

### Top 3 Most Impactful Fixes

1. **[C1] Header injection via Content-Disposition** — One-line fix with real security impact. An unencoded filename in an HTTP header can enable response-splitting attacks.

2. **[L1] `proxy.ts` is not being loaded as Next.js middleware** — If this file is actually not running as middleware (Next.js requires `middleware.ts`), the edge-level auth guard for `/dashboard` is entirely absent. All protection relies solely on server component redirects. Rename the file to confirm it works as intended.

3. **[H2] DB query on every JWT callback** — Every authenticated request (page load, server action, API call) currently hits the database to check `passwordChangedAt`. Moving this into the token payload eliminates this overhead completely and requires a small change.

### Overall Health Assessment

The codebase is well-structured with consistent patterns: auth checks on all routes, Zod validation on server actions, proper `userId` scoping in all Prisma queries, and good separation of concerns. The main concerns are an unloaded middleware file, a header injection point in the download route, and a handful of unbounded Prisma queries that will cause performance degradation at scale. No SQL injection or exposed credentials were found.
