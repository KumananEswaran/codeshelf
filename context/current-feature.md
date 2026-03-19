# Current Feature

## Seed Data

Populate the database with sample data for development and demos by updating the existing `prisma/seed.ts` script.

### Requirements

#### Demo User
- **Email:** demo@codeshelf.io
- **Name:** Demo User
- **Password:** 12345678 (hash with bcryptjs, 12 rounds)
- **isPro:** false
- **emailVerified:** current date

#### System Item Types (update existing)
| Name    | Icon       | Color   |
| ------- | ---------- | ------- |
| snippet | Code       | #3b82f6 |
| prompt  | Sparkles   | #8b5cf6 |
| command | Terminal   | #f97316 |
| note    | StickyNote | #fde047 |
| file    | File       | #6b7280 |
| image   | Image      | #ec4899 |
| link    | Link       | #10b981 |

Icons are Lucide React component names. All types have `isSystem: true`.

#### Collections & Items

1. **React Patterns** — _Reusable React patterns and hooks_
   - 3 snippets (TypeScript): useDebounce/useLocalStorage hooks, compound components, utility functions

2. **AI Workflows** — _AI prompts and workflow automations_
   - 3 prompts: code review, documentation generation, refactoring assistance

3. **DevOps** — _Infrastructure and deployment resources_
   - 1 snippet (Docker/CI-CD config), 1 command (deployment scripts), 2 links (real URLs)

4. **Terminal Commands** — _Useful shell commands for everyday development_
   - 4 commands: Git operations, Docker commands, process management, package manager utilities

5. **Design Resources** — _UI/UX resources and references_
   - 4 links (real URLs): CSS/Tailwind references, component libraries, design systems, icon libraries

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
