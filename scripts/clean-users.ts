import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const KEEP_EMAIL = "demo@codeshelf.io";

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { not: KEEP_EMAIL } },
    select: { id: true, email: true },
  });

  if (users.length === 0) {
    console.log("No users to delete. Only the demo user exists.");
    return;
  }

  console.log(`Found ${users.length} user(s) to delete:`);
  for (const user of users) {
    console.log(`  - ${user.email} (${user.id})`);
  }

  const userIds = users.map((u) => u.id);

  // Delete in order to respect foreign key constraints
  const deletedItemTags = await prisma.itemTag.deleteMany({
    where: { item: { userId: { in: userIds } } },
  });
  console.log(`\nDeleted ${deletedItemTags.count} item tags`);

  const deletedItems = await prisma.item.deleteMany({
    where: { userId: { in: userIds } },
  });
  console.log(`Deleted ${deletedItems.count} items`);

  const deletedCollections = await prisma.collection.deleteMany({
    where: { userId: { in: userIds } },
  });
  console.log(`Deleted ${deletedCollections.count} collections`);

  const deletedTags = await prisma.tag.deleteMany({
    where: { userId: { in: userIds } },
  });
  console.log(`Deleted ${deletedTags.count} tags`);

  const deletedItemTypes = await prisma.itemType.deleteMany({
    where: { userId: { in: userIds } },
  });
  console.log(`Deleted ${deletedItemTypes.count} custom item types`);

  const deletedSessions = await prisma.session.deleteMany({
    where: { userId: { in: userIds } },
  });
  console.log(`Deleted ${deletedSessions.count} sessions`);

  const deletedAccounts = await prisma.account.deleteMany({
    where: { userId: { in: userIds } },
  });
  console.log(`Deleted ${deletedAccounts.count} accounts`);

  const deletedTokens = await prisma.verificationToken.deleteMany();
  console.log(`Deleted ${deletedTokens.count} verification tokens`);

  const deletedUsers = await prisma.user.deleteMany({
    where: { id: { in: userIds } },
  });
  console.log(`Deleted ${deletedUsers.count} users`);

  console.log("\nCleanup complete! Only the demo user remains.");
}

main()
  .catch((e) => {
    console.error("Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
