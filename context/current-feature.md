# Current Feature

## Goals

<!-- Goals for the current feature -->

## Notes

<!-- Additional context, constraints, or details -->

## Status

Not Started

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
- 2026-03-21: Rate Limiting for Auth completed — Upstash Redis with @upstash/ratelimit, reusable rate-limit.ts utility with sliding window, custom /api/auth/login route for credentials with rate limiting, protected register/forgot-password/reset-password endpoints, 429 responses with Retry-After header, fail-open design
- 2026-03-21: Fix GitHub OAuth Redirect completed — switched GitHub sign-in from client-side signIn (next-auth/react) to server-side signIn via Server Action, fixing two-click redirect issue
- 2026-03-21: Items List View completed — dynamic /dashboard/items/[type] route with getItemsByType query, reusable ItemCard component, responsive 2-column grid with type-colored left borders, sidebar links updated
- 2026-03-21: Vitest Setup completed — vitest and coverage configured for server actions and utilities only, sample utils tests, test/test:watch/test:coverage scripts, docs updated
- 2026-03-21: Items Grid 3-Column Layout completed — changed items grid from 2 to 3 columns on lg+ screens, responsive 1/2/3 column breakpoints
- 2026-03-21: Item Drawer completed — right-side Sheet drawer on item click, getItemById query, GET /api/items/[id] with auth, ItemDrawer with type badge/action bar/content/tags/collection/dates, DashboardItems and ItemsListWithDrawer client wrappers, loading state
- 2026-03-21: Item Drawer Edit Mode completed — inline edit mode with Save/Cancel, editable title/description/tags + type-specific content/language/URL fields, updateItem server action with Zod validation, updateItem query with tag disconnect/connect-or-create, toast feedback and router.refresh()
- 2026-03-21: Delete Item completed — deleteItem DB query and server action with auth, AlertDialog confirmation in ItemDrawer, destructive styling, toast on success, drawer close and list refresh
- 2026-03-21: Item Create completed — NewItemDialog with type selector (snippet/prompt/command/note/link), dynamic fields per type, createItem server action with Zod validation, createItem query with tag connectOrCreate, shadcn Select component added
- 2026-03-24: Code Editor completed — Monaco Editor component with macOS window dots, copy button, language label, readonly/edit modes, fluid height (400px max), replaces textarea for snippet/command types in ItemDrawer and NewItemDialog, type-specific "New Item" button on item type pages with preselected type
- 2026-03-24: Markdown Editor completed — MarkdownEditor component with Write/Preview tabs, react-markdown + remark-gfm, dark theme CSS matching CodeEditor, replaces Textarea for note/prompt types in ItemDrawer and NewItemDialog, readonly preview mode for view
- 2026-03-28: File Upload with Cloudflare R2 completed — R2 client (src/lib/r2.ts) with upload/download/delete and validation, drag-and-drop FileUpload component with progress, upload and download proxy API routes, image preview and file info with download button in ItemDrawer, R2 cleanup on item deletion, file/image types added to NewItemDialog and type pages
- 2026-03-28: Image Gallery View completed — ImageCard component with 16:9 aspect-video thumbnails, object-cover fill, hover zoom effect, fileUrl added to ItemWithDetails query, ItemsListWithDrawer conditionally renders ImageCard for image type
- 2026-03-28: File List View completed — FileListItem component with extension-based icons, single-column list layout for /dashboard/items/files, file name/description/size/date/download per row, responsive mobile stacking, formatFileSize utility added
- 2026-03-29: Audit Quick Wins completed — sanitized Content-Disposition header filename, added take:50 cap to collection items sub-queries, stable React key in CollectionsGrid, formatDate shows year for older dates
- 2026-03-29: Code Decomposition completed — PinnedItems/RecentItems reuse ItemCard, getDownloadUrl utility extracted, computeDominantColor helper extracted, formatFileSize reused in ItemDrawer, AuthStatusCard shared across 4 auth forms
- 2026-03-29: Collection Create completed — NewCollectionDialog with name/description, createCollection server action with Zod validation, DB functions for CRUD/favorite/toggle, GET /api/collections route, TopBar updated with dialog
- 2026-03-29: Add Items to Collection completed — many-to-many schema migration (Item↔Collection junction table), CollectionPicker multi-select component, collection selector in NewItemDialog and ItemDrawer edit mode, collections displayed as badges in ItemDrawer view mode
- 2026-04-01: Collections Pages completed
- 2026-04-02: Collection Management Actions completed — EditCollectionDialog, CollectionActions (detail page edit/delete/favorite buttons), CollectionCardMenu (3-dot dropdown on cards), CollectionCard client component with programmatic navigation, controlled AlertDialog for delete confirmation with redirect — /dashboard/collections page with all collections grid and New Collection button, /dashboard/collections/[id] page with grouped items (general cards, Images section, Files section), CollectionItemsList component, sidebar and collection card links updated to /dashboard/ prefix, getCollectionItems returns ItemWithDetails[]
- 2026-04-02: Global Search / Command Palette completed — cmdk-based command palette (Ctrl+K / Cmd+K), fuzzy search across items and collections, grouped results with type icons and item counts, keyboard navigation, TopBar search button with Ctrl+K hint, /api/search route, global ItemDrawer for search-selected items
