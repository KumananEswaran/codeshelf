"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { updateItem as updateItemQuery } from "@/lib/db/items";

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
