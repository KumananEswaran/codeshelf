import { prisma } from "@/lib/prisma";

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

export async function getPinnedItems(userId: string): Promise<ItemWithDetails[]> {
  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: { createdAt: "desc" },
    select: itemSelect,
  });

  return items.map(formatItem);
}

export async function getRecentItems(
  userId: string,
  limit = 10
): Promise<ItemWithDetails[]> {
  const cappedLimit = Math.min(limit, 100);

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

export async function getItemTypesWithCounts(userId: string): Promise<ItemTypeWithCount[]> {
  const types = await prisma.itemType.findMany({
    where: { isSystem: true },
    select: {
      id: true,
      name: true,
      icon: true,
      color: true,
      _count: {
        select: {
          items: { where: { userId } },
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

export async function getItemsByType(
  userId: string,
  typeName: string
): Promise<ItemWithDetails[]> {
  const items = await prisma.item.findMany({
    where: {
      userId,
      type: { name: typeName },
    },
    orderBy: { createdAt: "desc" },
    select: itemSelect,
  });

  return items.map(formatItem);
}

export interface ItemDetail {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  contentType: string;
  language: string | null;
  url: string | null;
  fileName: string | null;
  fileSize: number | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  type: {
    name: string;
    icon: string | null;
    color: string | null;
  };
  tags: { name: string }[];
  collection: { id: string; name: string } | null;
}

export async function getItemById(
  itemId: string,
  userId: string
): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: {
      id: true,
      title: true,
      description: true,
      content: true,
      contentType: true,
      language: true,
      url: true,
      fileName: true,
      fileSize: true,
      isFavorite: true,
      isPinned: true,
      createdAt: true,
      updatedAt: true,
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
      collection: {
        select: { id: true, name: true },
      },
    },
  });

  if (!item) return null;

  return {
    ...item,
    tags: item.tags.map((t) => ({ name: t.tag.name })),
  };
}

export interface UpdateItemData {
  title: string;
  description: string | null;
  content: string | null;
  language: string | null;
  url: string | null;
  tags: string[];
}

export async function updateItem(
  itemId: string,
  userId: string,
  data: UpdateItemData
): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true },
  });

  if (!item) return null;

  // Delete existing tag associations
  await prisma.itemTag.deleteMany({ where: { itemId } });

  const updated = await prisma.item.update({
    where: { id: itemId },
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      language: data.language,
      url: data.url,
      tags: {
        create: data.tags.map((tagName) => ({
          tag: {
            connectOrCreate: {
              where: { name_userId: { name: tagName, userId } },
              create: { name: tagName, userId },
            },
          },
        })),
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      content: true,
      contentType: true,
      language: true,
      url: true,
      fileName: true,
      fileSize: true,
      isFavorite: true,
      isPinned: true,
      createdAt: true,
      updatedAt: true,
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
      collection: {
        select: { id: true, name: true },
      },
    },
  });

  return {
    ...updated,
    tags: updated.tags.map((t) => ({ name: t.tag.name })),
  };
}

export async function deleteItem(
  itemId: string,
  userId: string
): Promise<boolean> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true },
  });

  if (!item) return false;

  await prisma.itemTag.deleteMany({ where: { itemId } });
  await prisma.item.delete({ where: { id: itemId } });

  return true;
}

export async function getItemStats(userId: string) {
  const [totalItems, favoriteItems] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ]);

  return { totalItems, favoriteItems };
}
