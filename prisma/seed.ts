import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { hashSync } from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// ─── System Item Types (Lucide icon names) ──────────────────────

const systemItemTypes = [
  { id: "snippet", name: "snippet", icon: "Code", color: "#3b82f6" },
  { id: "prompt", name: "prompt", icon: "Sparkles", color: "#8b5cf6" },
  { id: "command", name: "command", icon: "Terminal", color: "#f97316" },
  { id: "note", name: "note", icon: "StickyNote", color: "#fde047" },
  { id: "file", name: "file", icon: "File", color: "#6b7280" },
  { id: "image", name: "image", icon: "Image", color: "#ec4899" },
  { id: "link", name: "link", icon: "Link", color: "#10b981" },
];

// ─── Seed Data ──────────────────────────────────────────────────

async function main() {
  console.log("Seeding database...\n");

  // 1. System Item Types
  console.log("Seeding system item types...");
  for (const itemType of systemItemTypes) {
    await prisma.itemType.upsert({
      where: { id: itemType.id },
      update: { name: itemType.name, icon: itemType.icon, color: itemType.color, isSystem: true },
      create: { ...itemType, isSystem: true },
    });
  }
  // Remove old "url" type if it exists (replaced by "link")
  await prisma.itemType.deleteMany({ where: { id: "url" } });

  console.log(`  ✓ ${systemItemTypes.length} system item types\n`);

  // 2. Demo User
  console.log("Seeding demo user...");
  const user = await prisma.user.upsert({
    where: { email: "demo@codeshelf.io" },
    update: {},
    create: {
      email: "demo@codeshelf.io",
      name: "Demo User",
      password: hashSync("12345678", 12),
      isPro: false,
      emailVerified: new Date(),
    },
  });
  console.log(`  ✓ Demo user (${user.email})\n`);

  // 3. Collections & Items
  console.log("Seeding collections & items...");

  // ── React Patterns ──────────────────────────────────────────
  const reactPatterns = await prisma.collection.upsert({
    where: { id: "col-react-patterns" },
    update: {},
    create: {
      id: "col-react-patterns",
      name: "React Patterns",
      description: "Reusable React patterns and hooks",
      userId: user.id,
    },
  });

  await upsertItem({
    id: "item-use-debounce",
    title: "useDebounce Hook",
    contentType: "text",
    language: "typescript",
    typeId: "snippet",
    collectionId: reactPatterns.id,
    userId: user.id,
    isFavorite: true,
    content: `import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}`,
  });

  await upsertItem({
    id: "item-compound-component",
    title: "Compound Component Pattern",
    contentType: "text",
    language: "typescript",
    typeId: "snippet",
    collectionId: reactPatterns.id,
    userId: user.id,
    content: `import { createContext, useContext, useState, type ReactNode } from "react";

interface AccordionContextType {
  activeIndex: number | null;
  toggle: (index: number) => void;
}

const AccordionContext = createContext<AccordionContextType | null>(null);

function useAccordion() {
  const context = useContext(AccordionContext);
  if (!context) throw new Error("useAccordion must be used within Accordion");
  return context;
}

export function Accordion({ children }: { children: ReactNode }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const toggle = (index: number) =>
    setActiveIndex((prev) => (prev === index ? null : index));

  return (
    <AccordionContext.Provider value={{ activeIndex, toggle }}>
      {children}
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ index, title, children }: { index: number; title: string; children: ReactNode }) {
  const { activeIndex, toggle } = useAccordion();
  return (
    <div>
      <button onClick={() => toggle(index)}>{title}</button>
      {activeIndex === index && <div>{children}</div>}
    </div>
  );
}`,
  });

  await upsertItem({
    id: "item-cn-utility",
    title: "cn() Utility — Merge Tailwind Classes",
    contentType: "text",
    language: "typescript",
    typeId: "snippet",
    collectionId: reactPatterns.id,
    userId: user.id,
    content: `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage:
// cn("px-4 py-2", isActive && "bg-blue-500", className)`,
  });

  // ── AI Workflows ────────────────────────────────────────────
  const aiWorkflows = await prisma.collection.upsert({
    where: { id: "col-ai-workflows" },
    update: {},
    create: {
      id: "col-ai-workflows",
      name: "AI Workflows",
      description: "AI prompts and workflow automations",
      userId: user.id,
    },
  });

  await upsertItem({
    id: "item-code-review-prompt",
    title: "Code Review Prompt",
    contentType: "text",
    typeId: "prompt",
    collectionId: aiWorkflows.id,
    userId: user.id,
    isPinned: true,
    content: `Review the following code for:

1. **Security** — SQL injection, XSS, auth bypass, secrets in code
2. **Performance** — N+1 queries, unnecessary re-renders, missing memoization
3. **Readability** — naming, complexity, dead code
4. **Edge cases** — null/undefined, empty arrays, concurrent access

For each issue found, provide:
- Severity (critical / warning / suggestion)
- Line number or code reference
- Suggested fix with code example

Code to review:
\`\`\`
{{paste code here}}
\`\`\``,
  });

  await upsertItem({
    id: "item-doc-generation-prompt",
    title: "Documentation Generator",
    contentType: "text",
    typeId: "prompt",
    collectionId: aiWorkflows.id,
    userId: user.id,
    content: `Generate comprehensive documentation for the following code:

1. **Overview** — What does this module/function do?
2. **Parameters** — List each parameter with type and description
3. **Return value** — What is returned and when
4. **Examples** — 2-3 usage examples covering common cases
5. **Edge cases** — Document any limitations or gotchas

Use JSDoc/TSDoc format for inline docs and Markdown for the overview.

Code:
\`\`\`
{{paste code here}}
\`\`\``,
  });

  await upsertItem({
    id: "item-refactoring-prompt",
    title: "Refactoring Assistant",
    contentType: "text",
    typeId: "prompt",
    collectionId: aiWorkflows.id,
    userId: user.id,
    content: `Refactor the following code to improve quality. Focus on:

1. **Single Responsibility** — Split functions that do too many things
2. **DRY** — Extract repeated logic into reusable helpers
3. **Naming** — Use descriptive, consistent names
4. **Simplification** — Reduce nesting, use early returns
5. **Type Safety** — Add or improve TypeScript types

Provide the refactored code with a brief explanation of each change.

Code to refactor:
\`\`\`
{{paste code here}}
\`\`\``,
  });

  // ── DevOps ──────────────────────────────────────────────────
  const devops = await prisma.collection.upsert({
    where: { id: "col-devops" },
    update: {},
    create: {
      id: "col-devops",
      name: "DevOps",
      description: "Infrastructure and deployment resources",
      userId: user.id,
    },
  });

  await upsertItem({
    id: "item-docker-compose",
    title: "Docker Compose — Dev Stack",
    contentType: "text",
    language: "yaml",
    typeId: "snippet",
    collectionId: devops.id,
    userId: user.id,
    content: `version: "3.9"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/app
      - REDIS_URL=redis://cache:6379
    depends_on:
      - db
      - cache

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    volumes:
      - pgdata:/var/lib/postgresql/data

  cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:`,
  });

  await upsertItem({
    id: "item-deploy-script",
    title: "Production Deploy Script",
    contentType: "text",
    typeId: "command",
    collectionId: devops.id,
    userId: user.id,
    content: `#!/bin/bash
set -euo pipefail

echo "Running pre-deploy checks..."
npm run lint && npm run build

echo "Running database migrations..."
npx prisma migrate deploy

echo "Deploying to production..."
vercel --prod

echo "Deploy complete!"`,
  });

  await upsertItem({
    id: "item-vercel-docs",
    title: "Vercel Deployment Documentation",
    contentType: "text",
    typeId: "link",
    collectionId: devops.id,
    userId: user.id,
    url: "https://vercel.com/docs",
    description: "Official Vercel deployment documentation and guides",
    content: "Comprehensive docs for deploying Next.js apps on Vercel — covers environment variables, edge functions, build settings, and more.",
  });

  await upsertItem({
    id: "item-docker-docs",
    title: "Docker Compose Documentation",
    contentType: "text",
    typeId: "link",
    collectionId: devops.id,
    userId: user.id,
    url: "https://docs.docker.com/compose/",
    description: "Official Docker Compose reference and tutorials",
    content: "Docker Compose documentation covering service definitions, networking, volumes, and multi-container orchestration.",
  });

  // ── Terminal Commands ───────────────────────────────────────
  const terminalCommands = await prisma.collection.upsert({
    where: { id: "col-terminal-commands" },
    update: {},
    create: {
      id: "col-terminal-commands",
      name: "Terminal Commands",
      description: "Useful shell commands for everyday development",
      userId: user.id,
      isFavorite: true,
    },
  });

  await upsertItem({
    id: "item-git-commands",
    title: "Git — Interactive Rebase & Cleanup",
    contentType: "text",
    typeId: "command",
    collectionId: terminalCommands.id,
    userId: user.id,
    isPinned: true,
    content: `# Squash last N commits
git rebase -i HEAD~N

# Undo last commit (keep changes staged)
git reset --soft HEAD~1

# Clean up merged branches
git branch --merged main | grep -v "main" | xargs git branch -d

# Amend last commit message
git commit --amend -m "new message"`,
  });

  await upsertItem({
    id: "item-docker-commands",
    title: "Docker — Container Management",
    contentType: "text",
    typeId: "command",
    collectionId: terminalCommands.id,
    userId: user.id,
    content: `# Stop all running containers
docker stop $(docker ps -q)

# Remove all stopped containers, unused networks, and dangling images
docker system prune -f

# View logs for a container (follow mode)
docker logs -f <container_name>

# Execute a shell inside a running container
docker exec -it <container_name> /bin/sh`,
  });

  await upsertItem({
    id: "item-process-commands",
    title: "Process Management",
    contentType: "text",
    typeId: "command",
    collectionId: terminalCommands.id,
    userId: user.id,
    content: `# Find process using a port
lsof -i :3000

# Kill process on a specific port
kill -9 $(lsof -t -i :3000)

# Monitor system resources in real-time
htop

# Watch a command output every 2 seconds
watch -n 2 "docker ps"`,
  });

  await upsertItem({
    id: "item-package-commands",
    title: "Package Manager Utilities",
    contentType: "text",
    typeId: "command",
    collectionId: terminalCommands.id,
    userId: user.id,
    content: `# Check for outdated packages
npm outdated

# List all globally installed packages
npm ls -g --depth=0

# Why is a package installed? (dependency chain)
npm why <package>

# Clean npm cache
npm cache clean --force`,
  });

  // ── Design Resources ────────────────────────────────────────
  const designResources = await prisma.collection.upsert({
    where: { id: "col-design-resources" },
    update: {},
    create: {
      id: "col-design-resources",
      name: "Design Resources",
      description: "UI/UX resources and references",
      userId: user.id,
    },
  });

  await upsertItem({
    id: "item-tailwind-docs",
    title: "Tailwind CSS Documentation",
    contentType: "text",
    typeId: "link",
    collectionId: designResources.id,
    userId: user.id,
    isFavorite: true,
    url: "https://tailwindcss.com/docs",
    description: "Official Tailwind CSS documentation with utility class reference",
    content: "Complete reference for all Tailwind CSS utility classes, configuration, and customization options.",
  });

  await upsertItem({
    id: "item-shadcn-ui",
    title: "shadcn/ui Component Library",
    contentType: "text",
    typeId: "link",
    collectionId: designResources.id,
    userId: user.id,
    url: "https://ui.shadcn.com",
    description: "Beautifully designed, accessible components built with Radix UI and Tailwind CSS",
    content: "Copy-paste component library for React — includes buttons, dialogs, forms, tables, and more. Built on Radix UI primitives.",
  });

  await upsertItem({
    id: "item-radix-ui",
    title: "Radix UI — Design System Primitives",
    contentType: "text",
    typeId: "link",
    collectionId: designResources.id,
    userId: user.id,
    url: "https://www.radix-ui.com",
    description: "Unstyled, accessible UI primitives for building design systems",
    content: "Low-level UI component library focused on accessibility, customization, and developer experience.",
  });

  await upsertItem({
    id: "item-lucide-icons",
    title: "Lucide Icons",
    contentType: "text",
    typeId: "link",
    collectionId: designResources.id,
    userId: user.id,
    url: "https://lucide.dev/icons",
    description: "Beautiful & consistent open-source icon library",
    content: "Community-maintained fork of Feather Icons with 1500+ icons. Used in this project for all UI icons.",
  });

  console.log("  ✓ 5 collections with 18 items\n");
  console.log("Seeding complete!");
}

// ─── Helpers ──────────────────────────────────────────────────

interface UpsertItemData {
  id: string;
  title: string;
  contentType: string;
  typeId: string;
  collectionId: string;
  userId: string;
  content?: string;
  language?: string;
  url?: string;
  description?: string;
  isFavorite?: boolean;
  isPinned?: boolean;
}

async function upsertItem(data: UpsertItemData) {
  await prisma.item.upsert({
    where: { id: data.id },
    update: {},
    create: {
      id: data.id,
      title: data.title,
      contentType: data.contentType,
      content: data.content ?? null,
      language: data.language ?? null,
      url: data.url ?? null,
      description: data.description ?? null,
      isFavorite: data.isFavorite ?? false,
      isPinned: data.isPinned ?? false,
      typeId: data.typeId,
      userId: data.userId,
      collections: data.collectionId
        ? { connect: { id: data.collectionId } }
        : undefined,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
