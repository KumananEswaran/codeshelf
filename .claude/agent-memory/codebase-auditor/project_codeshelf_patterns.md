---
name: CodeShelf codebase patterns and known issues
description: Architectural patterns, recurring issues, and audit findings for the CodeShelf codebase
type: project
---

Key findings from 2026-03-29 audit:

- `src/proxy.ts` is named incorrectly — Next.js middleware must be `src/middleware.ts`. Verify this is actually running as edge middleware.
- `src/lib/mock-data.ts` is dead code (not imported anywhere) — safe to delete.
- JWT callback in `src/auth.ts` fires a DB query on every authenticated request to check `passwordChangedAt`.
- `getItemsByType` in `src/lib/db/items.ts` has no result limit — will degrade for users with many items.
- `getPinnedItems` also has no cap.
- `getRecentCollections` and `getSidebarCollections` load all items in every collection just to compute dominant color — needs a `take` limit on the items sub-query.
- `updateItem` in `src/lib/db/items.ts` runs a delete + update for tags without a transaction.
- Download route at `src/app/api/download/[key]/route.ts` has an unescaped filename in Content-Disposition header — header injection risk.
- R2 key extraction logic is duplicated across `ItemDrawer` and `FileListItem` via fragile `urlParts.slice(3)` instead of using the shared `getR2KeyFromUrl` utility.
- `PinnedItems` and `RecentItems` components duplicate the item card JSX already in `ItemCard.tsx`.
- Favorite/Pin/Copy action buttons in `ItemDrawer` are non-functional stubs with no onClick handlers.

**Why:** Audit conducted to identify real issues before further feature development.
**How to apply:** When working in any of the above files, apply the fixes noted in CODEBASE_AUDIT.md before adding new code.
