"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { updateEditorPreferences } from "@/lib/db/editor-preferences";

const editorPreferencesSchema = z.object({
  fontSize: z.number().int().min(12).max(20),
  tabSize: z.number().int().refine((v) => [2, 4, 8].includes(v)),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(["vs-dark", "monokai", "github-dark"]),
});

export async function saveEditorPreferences(data: z.infer<typeof editorPreferencesSchema>) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = editorPreferencesSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid preferences" };
  }

  try {
    const updated = await updateEditorPreferences(session.user.id, parsed.data);
    return { success: true, data: updated };
  } catch {
    return { success: false, error: "Failed to save preferences" };
  }
}
