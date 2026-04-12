"use server";

import { z } from "zod";
import { updateEditorPreferences } from "@/lib/db/editor-preferences";
import { requireSession } from "@/lib/action-guard";

const editorPreferencesSchema = z.object({
  fontSize: z.number().int().min(12).max(20),
  tabSize: z.number().int().refine((v) => [2, 4, 8].includes(v)),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(["vs-dark", "monokai", "github-dark"]),
});

export async function saveEditorPreferences(data: z.infer<typeof editorPreferencesSchema>) {
  const guard = await requireSession();
  if (!guard.ok) return guard.error;

  const parsed = editorPreferencesSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: "Invalid preferences" };
  }

  try {
    const updated = await updateEditorPreferences(guard.userId, parsed.data);
    return { success: true as const, data: updated };
  } catch {
    return { success: false as const, error: "Failed to save preferences" };
  }
}
