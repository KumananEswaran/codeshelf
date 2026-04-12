"use server";

import { z } from "zod";
import {
  createCollection as createCollectionQuery,
  updateCollection as updateCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  toggleCollectionFavorite as toggleFavoriteQuery,
} from "@/lib/db/collections";
import { getUserCollectionCount } from "@/lib/db/subscription";
import { FREE_LIMITS } from "@/lib/subscription";
import { requireSession } from "@/lib/action-guard";

const collectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().nullable().optional().default(null),
});

export async function createCollection(
  data: z.input<typeof collectionSchema>
) {
  const guard = await requireSession();
  if (!guard.ok) return guard.error;

  if (!guard.isPro) {
    const count = await getUserCollectionCount(guard.userId);
    if (count >= FREE_LIMITS.MAX_COLLECTIONS) {
      return {
        success: false as const,
        error: `Free plan limit reached (${FREE_LIMITS.MAX_COLLECTIONS} collections). Upgrade to Pro for unlimited collections.`,
      };
    }
  }

  const parsed = collectionSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  const collection = await createCollectionQuery(guard.userId, parsed.data);
  return { success: true as const, data: collection };
}

export async function updateCollection(
  collectionId: string,
  data: z.input<typeof collectionSchema>
) {
  const guard = await requireSession();
  if (!guard.ok) return guard.error;

  const parsed = collectionSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  const updated = await updateCollectionQuery(
    collectionId,
    guard.userId,
    parsed.data
  );
  if (!updated) {
    return { success: false as const, error: "Collection not found" };
  }

  return { success: true as const, data: updated };
}

export async function deleteCollection(collectionId: string) {
  const guard = await requireSession();
  if (!guard.ok) return guard.error;

  const result = await deleteCollectionQuery(collectionId, guard.userId);
  if (!result.deleted) {
    return { success: false as const, error: "Collection not found" };
  }

  return { success: true as const };
}

export async function toggleCollectionFavorite(collectionId: string) {
  const guard = await requireSession();
  if (!guard.ok) return guard.error;

  const result = await toggleFavoriteQuery(collectionId, guard.userId);
  if (!result) {
    return { success: false as const, error: "Collection not found" };
  }

  return { success: true as const, data: result };
}
