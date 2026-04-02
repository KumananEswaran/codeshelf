import { prisma } from "@/lib/prisma";
import { type EditorPreferences, EDITOR_DEFAULTS } from "@/types/editor";

export async function getEditorPreferences(userId: string): Promise<EditorPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { editorPreferences: true },
  });

  if (!user?.editorPreferences) return EDITOR_DEFAULTS;

  const stored = user.editorPreferences as Record<string, unknown>;
  return { ...EDITOR_DEFAULTS, ...stored } as EditorPreferences;
}

export async function updateEditorPreferences(
  userId: string,
  preferences: EditorPreferences
): Promise<EditorPreferences> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { editorPreferences: JSON.parse(JSON.stringify(preferences)) },
    select: { editorPreferences: true },
  });

  return user.editorPreferences as unknown as EditorPreferences;
}
