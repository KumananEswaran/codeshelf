"use server";

import { z } from "zod";
import { auth } from "@/auth";
import {
  createCollection as createCollectionQuery,
  updateCollection as updateCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  toggleCollectionFavorite as toggleFavoriteQuery,
} from "@/lib/db/collections";
import { getUserCollectionCount } from "@/lib/db/subscription";
import { FREE_LIMITS } from "@/lib/subscription";

const collectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().nullable().optional().default(null),
});

export async function createCollection(
  data: z.input<typeof collectionSchema>
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  if (!session.user.isPro) {
    const count = await getUserCollectionCount(session.user.id);
    if (count >= FREE_LIMITS.MAX_COLLECTIONS) {
      return {
        success: false as const,
        error: `Free plan limit reached (${FREE_LIMITS.MAX_COLLECTIONS} collections). Upgrade to Pro for unlimited.`,
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

  const collection = await createCollectionQuery(session.user.id, parsed.data);
  return { success: true as const, data: collection };
}

export async function updateCollection(
  collectionId: string,
  data: z.input<typeof collectionSchema>
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  const parsed = collectionSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  const updated = await updateCollectionQuery(
    collectionId,
    session.user.id,
    parsed.data
  );
  if (!updated) {
    return { success: false as const, error: "Collection not found" };
  }

  return { success: true as const, data: updated };
}

export async function deleteCollection(collectionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  const result = await deleteCollectionQuery(collectionId, session.user.id);
  if (!result.deleted) {
    return { success: false as const, error: "Collection not found" };
  }

  return { success: true as const };
}

export async function toggleCollectionFavorite(collectionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  const result = await toggleFavoriteQuery(collectionId, session.user.id);
  if (!result) {
    return { success: false as const, error: "Collection not found" };
  }

  return { success: true as const, data: result };
}
