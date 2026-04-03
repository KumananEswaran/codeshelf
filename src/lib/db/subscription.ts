import { prisma } from "@/lib/prisma";

export async function getUserItemCount(userId: string): Promise<number> {
  return prisma.item.count({ where: { userId } });
}

export async function getUserCollectionCount(userId: string): Promise<number> {
  return prisma.collection.count({ where: { userId } });
}

export async function activateProSubscription(
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string
) {
  await prisma.user.updateMany({
    where: { id: userId },
    data: {
      isPro: true,
      stripeCustomerId,
      stripeSubscriptionId,
    },
  });
}

export async function deactivateProSubscription(stripeCustomerId: string) {
  await prisma.user.updateMany({
    where: { stripeCustomerId },
    data: {
      isPro: false,
      stripeSubscriptionId: null,
    },
  });
}

export async function getUserByStripeCustomerId(stripeCustomerId: string) {
  return prisma.user.findFirst({
    where: { stripeCustomerId },
    select: {
      id: true,
      email: true,
      isPro: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });
}
