import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const systemItemTypes = [
  { name: "Snippet", icon: "</>", color: "#3B82F6" },
  { name: "Prompt", icon: "🤖", color: "#8B5CF6" },
  { name: "Note", icon: "📝", color: "#10B981" },
  { name: "Command", icon: ">_", color: "#F59E0B" },
  { name: "File", icon: "📄", color: "#6B7280" },
  { name: "Image", icon: "🖼️", color: "#EC4899" },
  { name: "URL", icon: "🔗", color: "#06B6D4" },
];

async function main() {
  console.log("Seeding system item types...");

  for (const itemType of systemItemTypes) {
    await prisma.itemType.upsert({
      where: { id: itemType.name.toLowerCase() },
      update: { ...itemType, isSystem: true },
      create: { id: itemType.name.toLowerCase(), ...itemType, isSystem: true },
    });
  }

  console.log(`Seeded ${systemItemTypes.length} system item types.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
