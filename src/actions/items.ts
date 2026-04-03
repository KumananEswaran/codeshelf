"use server";

import { z } from "zod";
import { auth } from "@/auth";
import {
  createItem as createItemQuery,
  updateItem as updateItemQuery,
  deleteItem as deleteItemQuery,
  toggleItemFavorite as toggleItemFavoriteQuery,
  toggleItemPin as toggleItemPinQuery,
} from "@/lib/db/items";
import { deleteFromR2, getR2KeyFromUrl } from "@/lib/r2";

const ALLOWED_TYPES = ["snippet", "prompt", "command", "note", "link", "file", "image"] as const;

const createItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().nullable().optional().default(null),
  content: z.string().nullable().optional().default(null),
  language: z.string().trim().nullable().optional().default(null),
  url: z
    .string()
    .trim()
    .nullable()
    .optional()
    .default(null)
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: "Invalid URL",
    }),
  typeName: z.enum(ALLOWED_TYPES, { message: "Invalid item type" }),
  tags: z.array(z.string().trim().min(1)).default([]),
  fileUrl: z.string().url().nullable().optional().default(null),
  fileName: z.string().nullable().optional().default(null),
  fileSize: z.number().int().positive().nullable().optional().default(null),
  collectionIds: z.array(z.string()).default([]),
});

export async function createItem(
  data: z.input<typeof createItemSchema>
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  const parsed = createItemSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  const item = await createItemQuery(session.user.id, parsed.data);
  return { success: true as const, data: item };
}

const updateItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().nullable().optional().default(null),
  content: z.string().nullable().optional().default(null),
  language: z.string().trim().nullable().optional().default(null),
  url: z
    .string()
    .trim()
    .nullable()
    .optional()
    .default(null)
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: "Invalid URL",
    }),
  tags: z
    .array(z.string().trim().min(1))
    .default([]),
  collectionIds: z.array(z.string()).default([]),
});

export async function updateItem(
  itemId: string,
  data: z.input<typeof updateItemSchema>
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  const parsed = updateItemSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  const updated = await updateItemQuery(itemId, session.user.id, parsed.data);
  if (!updated) {
    return { success: false as const, error: "Item not found" };
  }

  return { success: true as const, data: updated };
}

export async function deleteItem(itemId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  const result = await deleteItemQuery(itemId, session.user.id);
  if (!result.deleted) {
    return { success: false as const, error: "Item not found" };
  }

  // Clean up R2 file if present
  if (result.fileUrl) {
    const key = getR2KeyFromUrl(result.fileUrl);
    if (key) {
      try {
        await deleteFromR2(key);
      } catch {
        // File cleanup is best-effort
      }
    }
  }

  return { success: true as const };
}

export async function toggleItemFavorite(itemId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  const result = await toggleItemFavoriteQuery(itemId, session.user.id);
  if (!result) {
    return { success: false as const, error: "Item not found" };
  }

  return { success: true as const, data: result };
}

export async function toggleItemPin(itemId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  const result = await toggleItemPinQuery(itemId, session.user.id);
  if (!result) {
    return { success: false as const, error: "Item not found" };
  }

  return { success: true as const, data: result };
}
