import { prisma } from "@/lib/prisma";

export interface CollectionWithTypes {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  dominantColor: string | null;
  typeIcons: { icon: string | null; color: string | null }[];
}

function computeDominantColor(
  items: { type: { id: string; color: string | null } }[]
): string | null {
  const typeCounts = new Map<string, { count: number; color: string | null }>();

  for (const item of items) {
    const existing = typeCounts.get(item.type.id);
    if (existing) {
      existing.count++;
    } else {
      typeCounts.set(item.type.id, { count: 1, color: item.type.color });
    }
  }

  let dominantColor: string | null = null;
  let maxCount = 0;
  for (const entry of typeCounts.values()) {
    if (entry.count > maxCount) {
      maxCount = entry.count;
      dominantColor = entry.color;
    }
  }

  return dominantColor;
}

export async function getRecentCollections(
  userId: string,
  limit = 6
): Promise<CollectionWithTypes[]> {
  const cappedLimit = Math.min(limit, 100);

  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: cappedLimit,
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      _count: { select: { items: true } },
      items: {
        take: 50,
        select: {
          type: {
            select: { id: true, icon: true, color: true },
          },
        },
      },
    },
  });

  return collections.map((col) => {
    const seen = new Map<string, { icon: string | null; color: string | null }>();
    for (const item of col.items) {
      if (!seen.has(item.type.id)) {
        seen.set(item.type.id, { icon: item.type.icon, color: item.type.color });
      }
    }

    return {
      id: col.id,
      name: col.name,
      description: col.description,
      isFavorite: col.isFavorite,
      itemCount: col._count.items,
      dominantColor: computeDominantColor(col.items),
      typeIcons: Array.from(seen.values()),
    };
  });
}

export interface SidebarCollection {
  id: string;
  name: string;
  isFavorite: boolean;
  itemCount: number;
  dominantColor: string | null;
}

export async function getSidebarCollections(userId: string): Promise<{
  favorites: SidebarCollection[];
  recents: SidebarCollection[];
}> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      isFavorite: true,
      _count: { select: { items: true } },
      items: {
        take: 50,
        select: {
          type: {
            select: { id: true, color: true },
          },
        },
      },
    },
  });

  const mapped: SidebarCollection[] = collections.map((col) => ({
    id: col.id,
    name: col.name,
    isFavorite: col.isFavorite,
    itemCount: col._count.items,
    dominantColor: computeDominantColor(col.items),
  }));

  const favorites = mapped.filter((c) => c.isFavorite);
  const recents = mapped.slice(0, 4);

  return { favorites, recents };
}

export async function createCollection(
  userId: string,
  data: { name: string; description: string | null }
) {
  return prisma.collection.create({
    data: {
      name: data.name,
      description: data.description,
      userId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      createdAt: true,
    },
  });
}

export async function getAllCollections(
  userId: string
): Promise<CollectionWithTypes[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      _count: { select: { items: true } },
      items: {
        take: 50,
        select: {
          type: {
            select: { id: true, icon: true, color: true },
          },
        },
      },
    },
  });

  return collections.map((col) => {
    const seen = new Map<string, { icon: string | null; color: string | null }>();
    for (const item of col.items) {
      if (!seen.has(item.type.id)) {
        seen.set(item.type.id, { icon: item.type.icon, color: item.type.color });
      }
    }

    return {
      id: col.id,
      name: col.name,
      description: col.description,
      isFavorite: col.isFavorite,
      itemCount: col._count.items,
      dominantColor: computeDominantColor(col.items),
      typeIcons: Array.from(seen.values()),
    };
  });
}

export async function getCollectionById(collectionId: string, userId: string) {
  return prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { items: true } },
    },
  });
}

export async function getCollectionItems(collectionId: string, userId: string) {
  return prisma.item.findMany({
    where: { collections: { some: { id: collectionId } }, userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      description: true,
      content: true,
      url: true,
      fileUrl: true,
      fileName: true,
      fileSize: true,
      isFavorite: true,
      isPinned: true,
      createdAt: true,
      type: { select: { name: true, icon: true, color: true } },
      tags: { select: { tag: { select: { name: true } } } },
    },
  });
}

export async function updateCollection(
  collectionId: string,
  userId: string,
  data: { name: string; description: string | null }
) {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true },
  });

  if (!collection) return null;

  return prisma.collection.update({
    where: { id: collectionId },
    data: {
      name: data.name,
      description: data.description,
    },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
    },
  });
}

export async function deleteCollection(collectionId: string, userId: string) {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true },
  });

  if (!collection) return { deleted: false };

  await prisma.collection.delete({
    where: { id: collectionId },
  });

  return { deleted: true };
}

export async function toggleCollectionFavorite(
  collectionId: string,
  userId: string
) {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true, isFavorite: true },
  });

  if (!collection) return null;

  return prisma.collection.update({
    where: { id: collectionId },
    data: { isFavorite: !collection.isFavorite },
    select: { id: true, isFavorite: true },
  });
}

export async function getUserCollectionsForSelect(userId: string) {
  return prisma.collection.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    take: 100,
    select: {
      id: true,
      name: true,
    },
  });
}

export async function getCollectionStats(userId: string) {
  const [totalCollections, favoriteCollections] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);

  return { totalCollections, favoriteCollections };
}
