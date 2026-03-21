# Current Feature: Rate Limiting for Auth

## Goals

- Add rate limiting to auth-related API routes using Upstash Redis with `@upstash/ratelimit`
- Create reusable `src/lib/rate-limit.ts` utility with sliding window algorithm
- Protect endpoints: login (5/15min), register (3/1hr), forgot-password (3/1hr), reset-password (5/15min), resend-verification (3/15min)
- Key rate limits by IP or IP + email depending on endpoint
- Return 429 responses with `Retry-After` header and user-friendly error messages
- Display rate limit errors via toast notifications on the frontend
- Fail open if Upstash is unavailable

## Notes

- Requires Upstash Redis env vars: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Upstash free tier allows 10k requests/day (sufficient for auth limiting)
- Login limiting with NextAuth credentials may need custom sign-in handler
- Extract IP from `x-forwarded-for` header (Vercel) or request
- Consider adding rate limiting middleware for cleaner implementation later

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
- 2026-03-20: Auth UI — Sign In, Register & Sign Out completed — custom /sign-in and /register pages with server component + client form pattern, reusable UserAvatar component with initials fallback, sidebar user area with dropdown menu (Profile + Sign out), NextAuth custom pages config, Sonner toast on registration success
- 2026-03-20: Email Verification on Register completed — Resend integration for verification emails, 24h token expiry, inline check-your-email and verified states on auth pages, unverified sign-in blocked, dashboard queries switched from getDemoUserId to session user ID, clean-users script added
- 2026-03-20: Email Verification Toggle completed — REQUIRE_EMAIL_VERIFICATION env variable to enable/disable email verification, default false for development without Resend domain
- 2026-03-20: Forgot Password completed — forgot password link on sign-in, /forgot-password and /reset-password pages, reset token via VerificationToken with reset: prefix, Resend email, single-use 24h tokens, OAuth users excluded
- 2026-03-20: Profile Page completed — /profile route with user info (avatar, email, join date), usage stats with per-type breakdown, change password for email users, delete account with confirmation dialog, shadcn dialog component added
