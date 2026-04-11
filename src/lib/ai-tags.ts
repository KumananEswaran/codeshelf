/** Normalize the AI model output into a flat lowercase string array of tags. */
export function parseTagsResponse(raw: string): string[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  let candidate: unknown = parsed;
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    candidate = (parsed as Record<string, unknown>).tags;
  }
  if (!Array.isArray(candidate)) return [];

  const seen = new Set<string>();
  const tags: string[] = [];
  for (const entry of candidate) {
    if (typeof entry !== "string") continue;
    const cleaned = entry.trim().toLowerCase();
    if (!cleaned || cleaned.length > 30) continue;
    if (seen.has(cleaned)) continue;
    seen.add(cleaned);
    tags.push(cleaned);
    if (tags.length >= 5) break;
  }
  return tags;
}
