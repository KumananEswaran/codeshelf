import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Testing database connection...\n");

  // ─── System Item Types ──────────────────────────────────────
  const itemTypes = await prisma.itemType.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true } } },
  });

  console.log(`System Item Types (${itemTypes.length}):`);
  for (const type of itemTypes) {
    console.log(`  ${type.icon} ${type.name} — ${type.color} (${type._count.items} items)`);
  }

  // ─── Demo User ─────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { email: "demo@codeshelf.io" },
    include: {
      _count: { select: { items: true, collections: true, tags: true } },
    },
  });

  console.log("\nDemo User:");
  if (user) {
    console.log(`  Name: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Pro: ${user.isPro}`);
    console.log(`  Email Verified: ${user.emailVerified ? "Yes" : "No"}`);
    console.log(`  Password Set: ${user.password ? "Yes" : "No"}`);
    console.log(`  Items: ${user._count.items} | Collections: ${user._count.collections} | Tags: ${user._count.tags}`);
  } else {
    console.log("  Not found — run npm run db:seed first");
  }

  // ─── Collections & Items ───────────────────────────────────
  const collections = await prisma.collection.findMany({
    orderBy: { name: "asc" },
    include: {
      items: {
        orderBy: { title: "asc" },
        include: { type: true },
      },
    },
  });

  console.log(`\nCollections (${collections.length}):`);
  for (const col of collections) {
    const fav = col.isFavorite ? " ★" : "";
    console.log(`\n  ${col.name}${fav}`);
    console.log(`  ${col.description}`);
    console.log(`  Items (${col.items.length}):`);
    for (const item of col.items) {
      const flags = [
        item.isFavorite && "★",
        item.isPinned && "📌",
        item.language,
        item.url,
      ].filter(Boolean).join(" | ");
      console.log(`    ${item.type.icon} ${item.title}${flags ? ` (${flags})` : ""}`);
    }
  }

  // ─── Summary ───────────────────────────────────────────────
  const totalItems = await prisma.item.count();
  const pinnedItems = await prisma.item.count({ where: { isPinned: true } });
  const favoriteItems = await prisma.item.count({ where: { isFavorite: true } });

  console.log("\n─── Summary ───");
  console.log(`  Item Types: ${itemTypes.length}`);
  console.log(`  Collections: ${collections.length}`);
  console.log(`  Items: ${totalItems} (${pinnedItems} pinned, ${favoriteItems} favorited)`);

  console.log("\nDatabase test complete!");
}

main()
  .catch((e) => {
    console.error("Database connection failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
