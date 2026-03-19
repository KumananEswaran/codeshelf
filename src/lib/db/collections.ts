import { prisma } from "@/lib/prisma";

const DEMO_USER_EMAIL = "demo@codeshelf.io";

async function getDemoUserId() {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true },
  });
  return user.id;
}

export interface CollectionWithTypes {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  dominantColor: string | null;
  typeIcons: { icon: string | null; color: string | null }[];
}

export async function getRecentCollections(
  limit = 6
): Promise<CollectionWithTypes[]> {
  const userId = await getDemoUserId();

  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      items: {
        select: {
          type: {
            select: { id: true, icon: true, color: true },
          },
        },
      },
    },
  });

  return collections.map((col) => {
    const typeCounts = new Map<
      string,
      { count: number; icon: string | null; color: string | null }
    >();

    for (const item of col.items) {
      const existing = typeCounts.get(item.type.id);
      if (existing) {
        existing.count++;
      } else {
        typeCounts.set(item.type.id, {
          count: 1,
          icon: item.type.icon,
          color: item.type.color,
        });
      }
    }

    // Find most-used type for border color
    let dominantColor: string | null = null;
    let maxCount = 0;
    for (const entry of typeCounts.values()) {
      if (entry.count > maxCount) {
        maxCount = entry.count;
        dominantColor = entry.color;
      }
    }

    // Unique type icons
    const typeIcons = Array.from(typeCounts.values()).map((t) => ({
      icon: t.icon,
      color: t.color,
    }));

    return {
      id: col.id,
      name: col.name,
      description: col.description,
      isFavorite: col.isFavorite,
      itemCount: col.items.length,
      dominantColor,
      typeIcons,
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

export async function getSidebarCollections(): Promise<{
  favorites: SidebarCollection[];
  recents: SidebarCollection[];
}> {
  const userId = await getDemoUserId();

  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        select: {
          type: {
            select: { id: true, color: true },
          },
        },
      },
    },
  });

  const mapped: SidebarCollection[] = collections.map((col) => {
    const typeCounts = new Map<string, { count: number; color: string | null }>();

    for (const item of col.items) {
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

    return {
      id: col.id,
      name: col.name,
      isFavorite: col.isFavorite,
      itemCount: col.items.length,
      dominantColor,
    };
  });

  const favorites = mapped.filter((c) => c.isFavorite);
  const recents = mapped.slice(0, 4);

  return { favorites, recents };
}

export async function getCollectionStats() {
  const userId = await getDemoUserId();

  const [totalCollections, favoriteCollections] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);

  return { totalCollections, favoriteCollections };
}
