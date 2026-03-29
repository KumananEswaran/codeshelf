# Decomposition Review — CodeShelf

> Audit date: 2026-03-29
> Scope: `src/` directory
> Focus: Component decomposition, function extraction, and duplicate logic

---

## Summary

| Category | Count |
|---|---|
| Duplicate logic worth extracting | 3 |
| Large components worth splitting | 2 |
| Inline logic worth moving to utilities | 3 |
| Long functions worth breaking up | 1 |

The overall structure is good. Most components are already focused. The issues below are concentrated in a few hot spots — most importantly `ItemDrawer.tsx` and the repeated item-row pattern across three components.

---

## 1. Duplicate item-row markup across PinnedItems, RecentItems, and ItemCard

**Files:**
- `src/components/dashboard/PinnedItems.tsx` (lines 33–70)
- `src/components/dashboard/RecentItems.tsx` (lines 33–70)
- `src/components/dashboard/ItemCard.tsx` (entire file)

**What's duplicated:**

All three render essentially the same item row: a colored icon box, a title with optional Star/Pin badges, a description, a tag list, and a date. The markup is structurally identical between `PinnedItems` and `RecentItems` — they differ only in that `PinnedItems` always shows the Pin icon and `RecentItems` shows it conditionally. `ItemCard` wraps this same structure in a `<Card>` with a `CopyButton`.

`PinnedItems` row (lines 33–69):
```tsx
<Card style={{ borderLeftColor: item.type.color, ... }} onClick={...}>
  <CardContent className="flex items-center gap-4">
    <div className="... h-10 w-10 rounded-lg bg-muted" style={{ color: item.type.color }}>
      <IconComponent className="h-5 w-5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium truncate">{item.title}</p>
      {item.isFavorite && <Star ... />}
      <Pin ... />  {/* always shown */}
      ...tags...
    </div>
    <span className="text-xs">{formatDate(item.createdAt)}</span>
  </CardContent>
</Card>
```

`RecentItems` row (lines 33–70) is byte-for-byte identical except Pin is conditional, and `ItemCard` is the same without the outer-section wrapper.

**Why it matters:**

Three places render the same item card structure. When the item card design changes (e.g., adding a `language` badge, changing the icon box size, adjusting the tag overflow), the change must be made in three places. This has already diverged slightly — `ItemCard` has a `CopyButton` overlay that `PinnedItems`/`RecentItems` don't, even though both are interactive cards.

**Recommended extraction:**

`PinnedItems` and `RecentItems` can simply use `ItemCard` directly since `ItemCard` already accepts `onClick` and renders the same thing. `DashboardItems` would pass `onItemClick` down and the two section components would render `ItemCard` rows rather than duplicating the markup.

```tsx
// PinnedItems.tsx — simplified
export default function PinnedItems({ items, onItemClick }: PinnedItemsProps) {
  if (items.length === 0) return null;
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Pin className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Pinned</h2>
      </div>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} onClick={() => onItemClick?.(item.id)} />
        ))}
      </div>
    </section>
  );
}
```

The one small difference (Pin icon always shown in `PinnedItems`) is cosmetically trivial — all pinned items already have `isPinned: true`, so `ItemCard`'s conditional `{item.isPinned && <Pin />}` already handles it correctly.

---

## 2. Duplicate download URL construction logic

**Files:**
- `src/components/dashboard/ItemDrawer.tsx` (lines 463–471)
- `src/components/dashboard/FileListItem.tsx` (lines 66–70)

**The duplicated code:**

`ItemDrawer.tsx` lines 463–471:
```tsx
const publicUrl = item.fileUrl!;
const urlParts = publicUrl.split("/");
const key = urlParts.slice(3).join("/");
window.open(`/api/download/${encodeURIComponent(key)}`, "_blank");
```

`FileListItem.tsx` lines 66–70:
```tsx
if (!item.fileUrl) return;
const urlParts = item.fileUrl.split("/");
const key = urlParts.slice(3).join("/");
window.open(`/api/download/${encodeURIComponent(key)}`, "_blank");
```

Both perform the same URL-to-key extraction (splitting on `/`, taking from index 3) and construct the same download route. This is also inconsistent with the server-side logic in `src/lib/r2.ts`, which uses `getR2KeyFromUrl()` for the same extraction — client-side code duplicates what the server already has as a utility.

**Why it matters:**

If the R2 public URL format ever changes, or if the download proxy route changes, this must be updated in two places. The extraction logic is also subtly fragile — slicing from index 3 assumes a specific URL structure (`https://domain/bucket/key`). A centralized client utility would be one place to fix.

**Recommended extraction:**

Add a utility to `src/lib/utils.ts`:

```ts
export function getDownloadUrl(fileUrl: string): string {
  const urlParts = fileUrl.split("/");
  const key = urlParts.slice(3).join("/");
  return `/api/download/${encodeURIComponent(key)}`;
}
```

Then both components call `window.open(getDownloadUrl(item.fileUrl), "_blank")`.

---

## 3. Duplicate dominant-color computation in collections queries

**File:** `src/lib/db/collections.ts`

**The duplicated logic:**

`getRecentCollections` (lines 40–72) and `getSidebarCollections` (lines 116–144) each contain an identical block that computes the dominant type color from a collection's items:

```ts
// Appears verbatim in both functions
const typeCounts = new Map<string, { count: number; color: string | null }>();
for (const item of col.items) {
  const existing = typeCounts.get(item.type.id);
  if (existing) {
    existing.count++;
  } else {
    typeCounts.set(item.type.id, { count: 1, color: item.type.color });
  }
}
let dominantColor: string | null = null;
let maxCount = 0;
for (const entry of typeCounts.values()) {
  if (entry.count > maxCount) {
    maxCount = entry.count;
    dominantColor = entry.color;
  }
}
```

`getRecentCollections` extends this to also build `typeIcons`, but the dominant color computation itself is identical.

**Why it matters:**

The logic is non-trivial (a two-pass map reduce). If the tie-breaking rule or counting logic ever changes, both functions need updating. The functions are in the same file, making this straightforward to extract.

**Recommended extraction:**

```ts
function computeDominantColor(
  items: { type: { id: string; color: string | null } }[]
): string | null {
  const counts = new Map<string, { count: number; color: string | null }>();
  for (const item of items) {
    const existing = counts.get(item.type.id);
    if (existing) existing.count++;
    else counts.set(item.type.id, { count: 1, color: item.type.color });
  }
  let dominant: string | null = null;
  let max = 0;
  for (const entry of counts.values()) {
    if (entry.count > max) { max = entry.count; dominant = entry.color; }
  }
  return dominant;
}
```

Both `getRecentCollections` and `getSidebarCollections` then call `computeDominantColor(col.items)`.

---

## 4. ItemDrawer mixes data fetching, edit state, and view rendering

**File:** `src/components/dashboard/ItemDrawer.tsx` (554 lines)

**What's happening:**

`ItemDrawer` is doing three jobs:

1. **Data fetching** — `useEffect` + `fetch('/api/items/:id')` with loading/error state (lines 75–97)
2. **Edit form state management** — six `useState` fields for the edit form, `enterEditMode`, `cancelEdit`, `handleSave` (lines 62–151)
3. **View rendering** — the full JSX tree splitting into view mode and edit mode for each field type (lines 173–553)

The edit-mode fields block (lines 330–515) has seven distinct conditional sections (description, content, language, URL, image preview, file info, tags) each with an `editing ? <edit-field> : <display-value>` branch. This makes the render function very long and hard to scan.

**Why splitting helps:**

- The data-fetch hook is generic — it could be `useItemDetail(itemId)` and reused if a second surface ever needs item detail.
- The edit form state + handlers are self-contained and could be `useItemEditForm(item)` returning `{ fields, handlers, saving }`.
- The content section (lines 329–543) could be two named subcomponents: `<ItemViewContent item={item} />` and `<ItemEditContent fields={...} typeName={...} onChange={...} />`, making the per-field branching much clearer.

**Concrete split:**

```
ItemDrawer.tsx           — Sheet shell, orchestrates state, renders header/action bar
useItemDetail.ts         — fetch hook: itemId → { item, loading }
useItemEditForm.ts       — edit form hook: item → { fields, handlers, saving }
ItemViewContent.tsx      — renders description/content/URL/file/tags/dates in view mode
ItemEditContent.tsx      — renders editable fields in edit mode
```

This is a quality-of-life split rather than a hard bug, but at 554 lines with two parallel render trees it is the largest single component in the codebase and is the most likely to cause merge conflicts as features are added.

---

## 5. File size formatting inline in ItemDrawer

**File:** `src/components/dashboard/ItemDrawer.tsx` (lines 452–455)

**The inline logic:**

```tsx
{item.fileSize >= 1024 * 1024
  ? `${(item.fileSize / (1024 * 1024)).toFixed(1)} MB`
  : `${(item.fileSize / 1024).toFixed(1)} KB`}
```

This is a partial reimplementation of `formatFileSize` from `src/lib/utils.ts`, which already handles B/KB/MB/GB. The drawer version only handles KB and MB, and omits the `< 1024 B` case.

**Why it matters:**

`formatFileSize` already exists and handles edge cases the inline version misses. This is a straightforward call-site replacement.

**Fix:**

```tsx
import { formatFileSize } from "@/lib/utils";
// ...
{item.fileSize && (
  <p className="text-xs text-muted-foreground">
    {formatFileSize(item.fileSize)}
  </p>
)}
```

---

## 6. Auth forms duplicate the "check your email" confirmation card pattern

**Files:**
- `src/components/auth/RegisterForm.tsx` (lines 59–84) — email sent state
- `src/components/auth/ForgotPasswordForm.tsx` (lines 45–67) — password reset sent state

**The duplicated structure:**

Both render an identical card layout: centered icon in a colored circle, a `CardTitle`, a `CardDescription` with contextual text, and a "Back to Sign In" link button. The only differences are the icon, the circle color (`bg-primary/10` vs same), and the description text.

```tsx
// RegisterForm.tsx emailSent card
<Card className="w-full max-w-sm">
  <CardHeader className="text-center">
    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
      <MailCheck className="h-6 w-6 text-primary" />
    </div>
    <CardTitle>Check your email</CardTitle>
    <CardDescription>...</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>

// ForgotPasswordForm.tsx sent card — identical structure
<Card className="w-full max-w-sm">
  <CardHeader className="text-center">
    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
      <Mail className="h-6 w-6 text-primary" />
    </div>
    <CardTitle>Check Your Email</CardTitle>
    <CardDescription>...</CardDescription>
  </CardHeader>
  ...
</Card>
```

`ResetPasswordForm.tsx` (lines 62–79) and `SignInForm.tsx` (lines 52–73) each add a third and fourth instance of the same "status card" pattern (success state, verified state).

**Why it matters:**

There are four instances of the pattern `<Card w-full max-w-sm> <CardHeader text-center> <icon circle> <CardTitle> <CardDescription> <CardContent>`. This is a good candidate for a shared `<AuthStatusCard>` component.

**Recommended extraction:**

```tsx
// src/components/auth/AuthStatusCard.tsx
interface AuthStatusCardProps {
  icon: React.ReactNode;
  iconBg?: string; // e.g. "bg-primary/10", "bg-green-500/10"
  title: string;
  description: React.ReactNode;
  children: React.ReactNode; // action buttons
}
```

All four status-card instances become a single well-named component that is visually consistent across all auth flows.

---

## Not flagged (intentional patterns)

- **`NewItemDialog`** — 297 lines but it is a single cohesive form with many conditional fields. The per-type field visibility is the right amount of branching for a single form. Not worth splitting.
- **`Sidebar`** — 192 lines with three distinct sections (types, collections, user). Slightly large but each section is 20–30 lines of straightforward link rendering. Acceptable.
- **`actions/items.ts`** — Two nearly-identical Zod schemas (`createItemSchema`, `updateItemSchema`). The URL refinement is duplicated but sharing a base schema object would add indirection for minimal gain. Leave as-is.
- **Auth form components** — `RegisterForm`, `SignInForm`, `ForgotPasswordForm`, `ResetPasswordForm` each manage their own form state. These are correctly separated by feature; the shared card pattern (finding #6) is the only overlap worth extracting.
