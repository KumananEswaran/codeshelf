import { prisma } from "@/lib/prisma";
import { getDemoUserId } from "@/lib/db/user";

export interface ItemWithDetails {
  id: string;
  title: string;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  type: {
    name: string;
    icon: string | null;
    color: string | null;
  };
  tags: { name: string }[];
}

const itemSelect = {
  id: true,
  title: true,
  description: true,
  isFavorite: true,
  isPinned: true,
  createdAt: true,
  type: {
    select: { name: true, icon: true, color: true },
  },
  tags: {
    select: {
      tag: {
        select: { name: true },
      },
    },
  },
} as const;

function formatItem(
  item: {
    id: string;
    title: string;
    description: string | null;
    isFavorite: boolean;
    isPinned: boolean;
    createdAt: Date;
    type: { name: string; icon: string | null; color: string | null };
    tags: { tag: { name: string } }[];
  }
): ItemWithDetails {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    createdAt: item.createdAt,
    type: item.type,
    tags: item.tags.map((t) => ({ name: t.tag.name })),
  };
}

export async function getPinnedItems(): Promise<ItemWithDetails[]> {
  const userId = await getDemoUserId();
  if (!userId) return [];

  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: { createdAt: "desc" },
    select: itemSelect,
  });

  return items.map(formatItem);
}

export async function getRecentItems(
  limit = 10
): Promise<ItemWithDetails[]> {
  const cappedLimit = Math.min(limit, 100);
  const userId = await getDemoUserId();
  if (!userId) return [];

  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: cappedLimit,
    select: itemSelect,
  });

  return items.map(formatItem);
}

export interface ItemTypeWithCount {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  count: number;
}

const TYPE_DISPLAY_ORDER = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
];

export async function getItemTypesWithCounts(): Promise<ItemTypeWithCount[]> {
  const userId = await getDemoUserId();

  const types = await prisma.itemType.findMany({
    where: { isSystem: true },
    select: {
      id: true,
      name: true,
      icon: true,
      color: true,
      _count: {
        select: {
          items: userId ? { where: { userId } } : true,
        },
      },
    },
  });

  const mapped = types.map((t) => ({
    id: t.id,
    name: t.name,
    icon: t.icon,
    color: t.color,
    count: t._count.items,
  }));

  mapped.sort((a, b) => {
    const ai = TYPE_DISPLAY_ORDER.indexOf(a.name);
    const bi = TYPE_DISPLAY_ORDER.indexOf(b.name);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return mapped;
}

export async function getItemStats() {
  const userId = await getDemoUserId();
  if (!userId) return { totalItems: 0, favoriteItems: 0 };

  const [totalItems, favoriteItems] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ]);

  return { totalItems, favoriteItems };
}
