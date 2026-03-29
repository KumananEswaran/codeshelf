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

export async function getCollectionStats(userId: string) {
  const [totalCollections, favoriteCollections] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);

  return { totalCollections, favoriteCollections };
}
