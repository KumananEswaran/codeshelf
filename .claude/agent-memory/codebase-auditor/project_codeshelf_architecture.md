---
name: CodeShelf architecture and key decomposition findings
description: High-level architecture, component relationships, and known decomposition debt in CodeShelf src/
type: project
---

CodeShelf is a Next.js App Router project with Prisma/Neon, NextAuth v5, Tailwind v4, shadcn/ui, and Cloudflare R2.

**Key decomposition findings (as of 2026-03-29):**

1. `PinnedItems` and `RecentItems` duplicate the `ItemCard` markup. Both should render `<ItemCard>` directly instead of repeating the icon-box/title/tags/date row.

2. Download URL construction (`fileUrl.split("/").slice(3).join("/")`) is copy-pasted in `ItemDrawer.tsx` and `FileListItem.tsx`. A `getDownloadUrl(fileUrl)` utility in `src/lib/utils.ts` would consolidate it. Note: `src/lib/r2.ts` already has `getR2KeyFromUrl` server-side — the client version is a separate duplicate.

3. Dominant-color computation is copy-pasted between `getRecentCollections` and `getSidebarCollections` in `src/lib/db/collections.ts`. Extract a `computeDominantColor(items)` helper in that file.

4. `ItemDrawer.tsx` (554 lines) mixes data-fetch logic, edit-form state, and view/edit render trees. Candidate for splitting into `useItemDetail`, `useItemEditForm`, `ItemViewContent`, and `ItemEditContent`.

5. `ItemDrawer.tsx` line 452–455 reimplements `formatFileSize` partially (KB/MB only). Should call `formatFileSize` from `src/lib/utils.ts` instead.

6. All four auth forms (`SignInForm`, `RegisterForm`, `ForgotPasswordForm`, `ResetPasswordForm`) repeat an identical "status card" layout (centered icon circle + CardTitle + CardDescription + action button). Extractable to `<AuthStatusCard>`.

**Why:** and **How to apply:** These are quality-of-life issues, not bugs. Prioritize #1 (duplicated item row) and #3 (dominant-color) since those are in active render paths. #4 (ItemDrawer split) is the largest complexity hotspot.
