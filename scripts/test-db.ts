import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Testing database connection...\n");

  // Test connection by counting item types
  const itemTypes = await prisma.itemType.findMany({
    orderBy: { name: "asc" },
  });

  console.log(`Found ${itemTypes.length} system item types:\n`);
  for (const type of itemTypes) {
    console.log(`  ${type.icon} ${type.name} (id: ${type.id})`);
  }

  // Test user count
  const userCount = await prisma.user.count();
  console.log(`\nUsers: ${userCount}`);

  // Test item count
  const itemCount = await prisma.item.count();
  console.log(`Items: ${itemCount}`);

  // Test collection count
  const collectionCount = await prisma.collection.count();
  console.log(`Collections: ${collectionCount}`);

  console.log("\nDatabase connection successful!");
}

main()
  .catch((e) => {
    console.error("Database connection failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
