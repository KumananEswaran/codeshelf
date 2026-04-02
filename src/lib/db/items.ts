import { prisma } from "@/lib/prisma";

export interface ItemWithDetails {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
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
  content: true,
  url: true,
  fileUrl: true,
  fileName: true,
  fileSize: true,
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
    content: string | null;
    url: string | null;
    fileUrl: string | null;
    fileName: string | null;
    fileSize: number | null;
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
    content: item.content,
    url: item.url,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
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

export interface PaginatedItems {
  items: ItemWithDetails[];
  totalCount: number;
  page: number;
  totalPages: number;
}

export async function getItemsByType(
  userId: string,
  typeName: string,
  page = 1,
  perPage = 21
): Promise<PaginatedItems> {
  const where = { userId, type: { name: typeName } };
  const skip = (page - 1) * perPage;

  const [items, totalCount] = await Promise.all([
    prisma.item.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
      select: itemSelect,
    }),
    prisma.item.count({ where }),
  ]);

  return {
    items: items.map(formatItem),
    totalCount,
    page,
    totalPages: Math.ceil(totalCount / perPage),
  };
}

export interface ItemDetail {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  contentType: string;
  language: string | null;
  url: string | null;
  fileUrl: string | null;
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
  collections: { id: string; name: string }[];
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
      fileUrl: true,
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
      collections: {
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
  collectionIds?: string[];
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
      collections: data.collectionIds !== undefined
        ? { set: data.collectionIds.map((id) => ({ id })) }
        : undefined,
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
      fileUrl: true,
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
      collections: {
        select: { id: true, name: true },
      },
    },
  });

  return {
    ...updated,
    tags: updated.tags.map((t) => ({ name: t.tag.name })),
  };
}

export interface CreateItemData {
  title: string;
  description: string | null;
  content: string | null;
  language: string | null;
  url: string | null;
  typeName: string;
  tags: string[];
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  collectionIds?: string[];
}

export async function createItem(
  userId: string,
  data: CreateItemData
): Promise<ItemDetail> {
  const itemType = await prisma.itemType.findFirst({
    where: { name: data.typeName, isSystem: true },
    select: { id: true },
  });

  if (!itemType) {
    throw new Error(`Unknown item type: ${data.typeName}`);
  }

  const item = await prisma.item.create({
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      contentType: data.fileUrl ? "file" : "text",
      language: data.language,
      url: data.url,
      fileUrl: data.fileUrl ?? null,
      fileName: data.fileName ?? null,
      fileSize: data.fileSize ?? null,
      userId,
      typeId: itemType.id,
      collections: data.collectionIds?.length
        ? { connect: data.collectionIds.map((id) => ({ id })) }
        : undefined,
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
      fileUrl: true,
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
      collections: {
        select: { id: true, name: true },
      },
    },
  });

  return {
    ...item,
    tags: item.tags.map((t: { tag: { name: string } }) => ({ name: t.tag.name })),
  };
}

export async function deleteItem(
  itemId: string,
  userId: string
): Promise<{ deleted: false } | { deleted: true; fileUrl: string | null }> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true, fileUrl: true },
  });

  if (!item) return { deleted: false };

  await prisma.itemTag.deleteMany({ where: { itemId } });
  await prisma.item.delete({ where: { id: itemId } });

  return { deleted: true, fileUrl: item.fileUrl };
}

export async function getFavoriteItems(
  userId: string,
  page = 1,
  perPage = 21
): Promise<PaginatedItems> {
  const where = { userId, isFavorite: true };
  const skip = (page - 1) * perPage;

  const [items, totalCount] = await Promise.all([
    prisma.item.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: perPage,
      select: itemSelect,
    }),
    prisma.item.count({ where }),
  ]);

  return {
    items: items.map(formatItem),
    totalCount,
    page,
    totalPages: Math.ceil(totalCount / perPage),
  };
}

export async function toggleItemFavorite(itemId: string, userId: string) {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true, isFavorite: true },
  });

  if (!item) return null;

  return prisma.item.update({
    where: { id: itemId },
    data: { isFavorite: !item.isFavorite },
    select: { id: true, isFavorite: true },
  });
}

export async function getItemStats(userId: string) {
  const [totalItems, favoriteItems] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ]);

  return { totalItems, favoriteItems };
}
