# Current Feature: Auth UI — Sign In, Register & Sign Out

## Goals

- Custom sign-in page (`/sign-in`) with email/password fields, GitHub OAuth button, and link to register
- Custom register page (`/register`) with name, email, password, confirm password fields and validation
- User avatar in bottom of sidebar (GitHub image or initials fallback)
- Dropdown/up menu on avatar click with "Sign out" option
- Avatar click navigates to `/profile`
- Reusable avatar component handling both image and initials cases

## Notes

- Replace NextAuth default pages with custom UI
- Register form submits to existing `/api/auth/register` endpoint
- Redirect to sign-in on successful registration
- Avatar initials: extract from name (e.g., "Brad Traversy" → "BT")
- Form validation: passwords match, email format, error display

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
- 2026-03-20: Auth Setup — NextAuth + GitHub Provider completed — NextAuth v5 beta with Prisma adapter, split config (auth.config.ts + auth.ts) for edge compatibility, GitHub OAuth provider, JWT session strategy with user.id, proxy-based /dashboard/* route protection, API route handler, env vars configured
- 2026-03-20: Auth Credentials — Email/Password Provider completed — Credentials provider with split pattern, bcrypt validation in auth.ts, registration API route with input validation and duplicate check, dark theme on default sign-in page
