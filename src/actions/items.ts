"use server";

import { z } from "zod";
import {
  createItem as createItemQuery,
  updateItem as updateItemQuery,
  deleteItem as deleteItemQuery,
  toggleItemFavorite as toggleItemFavoriteQuery,
  toggleItemPin as toggleItemPinQuery,
} from "@/lib/db/items";
import { getUserItemCount } from "@/lib/db/subscription";
import { FREE_LIMITS } from "@/lib/subscription";
import { deleteFromR2, getR2KeyFromUrl } from "@/lib/r2";
import { requireSession } from "@/lib/action-guard";

const ALLOWED_TYPES = ["snippet", "prompt", "command", "note", "link", "file", "image"] as const;

const nullableUrl = z
  .string()
  .trim()
  .nullable()
  .optional()
  .default(null)
  .refine((val) => !val || z.string().url().safeParse(val).success, {
    message: "Invalid URL",
  });

const itemBaseSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().nullable().optional().default(null),
  content: z.string().nullable().optional().default(null),
  language: z.string().trim().nullable().optional().default(null),
  url: nullableUrl,
  tags: z.array(z.string().trim().min(1)).default([]),
  collectionIds: z.array(z.string()).default([]),
});

const createItemSchema = itemBaseSchema.extend({
  typeName: z.enum(ALLOWED_TYPES, { message: "Invalid item type" }),
  fileUrl: z.string().url().nullable().optional().default(null),
  fileName: z.string().nullable().optional().default(null),
  fileSize: z.number().int().positive().nullable().optional().default(null),
});

const updateItemSchema = itemBaseSchema;

export async function createItem(
  data: z.input<typeof createItemSchema>
) {
  const guard = await requireSession();
  if (!guard.ok) return guard.error;

  if (!guard.isPro) {
    const count = await getUserItemCount(guard.userId);
    if (count >= FREE_LIMITS.MAX_ITEMS) {
      return {
        success: false as const,
        error: `Free plan limit reached (${FREE_LIMITS.MAX_ITEMS} items). Upgrade to Pro for unlimited items.`,
      };
    }
  }

  const parsed = createItemSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  const item = await createItemQuery(guard.userId, parsed.data);
  return { success: true as const, data: item };
}

export async function updateItem(
  itemId: string,
  data: z.input<typeof updateItemSchema>
) {
  const guard = await requireSession();
  if (!guard.ok) return guard.error;

  const parsed = updateItemSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  const updated = await updateItemQuery(itemId, guard.userId, parsed.data);
  if (!updated) {
    return { success: false as const, error: "Item not found" };
  }

  return { success: true as const, data: updated };
}

export async function deleteItem(itemId: string) {
  const guard = await requireSession();
  if (!guard.ok) return guard.error;

  const result = await deleteItemQuery(itemId, guard.userId);
  if (!result.deleted) {
    return { success: false as const, error: "Item not found" };
  }

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
  const guard = await requireSession();
  if (!guard.ok) return guard.error;

  const result = await toggleItemFavoriteQuery(itemId, guard.userId);
  if (!result) {
    return { success: false as const, error: "Item not found" };
  }

  return { success: true as const, data: result };
}

export async function toggleItemPin(itemId: string) {
  const guard = await requireSession();
  if (!guard.ok) return guard.error;

  const result = await toggleItemPinQuery(itemId, guard.userId);
  if (!result) {
    return { success: false as const, error: "Item not found" };
  }

  return { success: true as const, data: result };
}
