import { prisma } from "@/lib/prisma";

const DEMO_USER_EMAIL = "demo@codeshelf.io";

export async function getDemoUserId(): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true },
  });
  return user?.id ?? null;
}
