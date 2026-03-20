# Current Feature: Auth Setup — NextAuth + GitHub Provider

## Goals

- Install NextAuth v5 (`next-auth@beta`) and `@auth/prisma-adapter`
- Set up split auth config pattern for edge compatibility (`src/auth.config.ts` + `src/auth.ts`)
- Add GitHub OAuth provider
- Create API route handler at `src/app/api/auth/[...nextauth]/route.ts`
- Protect `/dashboard/*` routes using Next.js 16 proxy (`src/proxy.ts`)
- Redirect unauthenticated users to sign-in
- Extend Session type with `user.id` (`src/types/next-auth.d.ts`)
- Add `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` env vars

## Notes

- Use `next-auth@beta` (not `@latest` which installs v4)
- Proxy file must be at `src/proxy.ts` (same level as `app/`)
- Use named export: `export const proxy = auth(...)` not default export
- Use `session: { strategy: 'jwt' }` with split config pattern
- Don't set custom `pages.signIn` — use NextAuth's default page
- Use Context7 to verify newest config and conventions

## Status

In Progress

## History

<!-- Keep this updated. Earliest to latest -->
- 2026-03-15: Initial Next.js 16 and Tailwind CSS v4 setup via create-next-app
- 2026-03-18: Current feature updated to Dashboard UI Phase 1 with status set to In Progress
- 2026-03-18: Dashboard UI Phase 1 completed — ShadCN initialized, /dashboard route with layout, top bar with search/New Collection/New Item buttons, sidebar and main placeholders, dark mode default
- 2026-03-19: Dashboard UI Phase 2 completed — Collapsible sidebar with item types/counts, favorite and recent collections, user avatar area, drawer toggle, mobile sheet drawer
- 2026-03-19: Dashboard UI Phase 3 completed — Stats cards, collections grid, pinned items, recent items sections, typography switched to Inter + JetBrains Mono
- 2026-03-19: Current feature updated to Prisma + Neon PostgreSQL Setup with status set to In Progress
- 2026-03-19: Prisma + Neon PostgreSQL Setup completed — Prisma 7 with driver adapter, initial migration, NextAuth models, system item types seeded, db scripts added
- 2026-03-19: Current feature updated to Seed Data with status set to In Progress
- 2026-03-19: Seed Data completed — demo user, 7 system item types with Lucide icons, 5 collections with 18 items, updated test-db script
- 2026-03-19: Current feature updated to Dashboard Collections (Real Data) with status set to In Progress
- 2026-03-19: Dashboard Collections (Real Data) completed — src/lib/db/collections.ts with Prisma queries, CollectionsGrid with type icons and dominant-color border, dashboard page as async server component fetching from Neon DB
- 2026-03-19: Current feature updated to Dashboard Items (Real Data) with status set to In Progress
- 2026-03-19: Dashboard Items (Real Data) completed — src/lib/db/items.ts with Prisma queries (pinned, recent, stats), PinnedItems and RecentItems components updated with Lucide icon map and type-colored borders, mock data removed from dashboard page
- 2026-03-19: Current feature updated to Stats & Sidebar (Real Data) with status set to In Progress
- 2026-03-19: Stats & Sidebar (Real Data) completed — getItemTypesWithCounts and getSidebarCollections DB functions, Sidebar rewritten with Lucide icons, colored circles for recents, star icons for favorites, "View all collections" link, data passed from layout via DashboardShell props
- 2026-03-19: Add Pro Badge to Sidebar completed — ShadCN Badge with secondary variant added to Files and Images types in sidebar, PRO_TYPES set for easy extension
- 2026-03-20: Codebase Cleanup — Quick Wins completed — extracted shared ICON_MAP/getDemoUserId/formatDate, fixed N+1 query with _count, added Collection createdAt index via migration, dashboard loading/error states, query limit caps, safe getIcon() fallback, ESLint generated ignore, shadcn moved to devDeps
