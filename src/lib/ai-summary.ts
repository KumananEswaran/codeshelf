/** Normalize the AI model output into a single trimmed summary string. */
export function parseSummaryResponse(raw: string): string {
  if (!raw) return "";

  let candidate: unknown = raw;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") {
      candidate = parsed;
    } else if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      candidate = obj.summary ?? obj.description ?? obj.text ?? "";
    }
  } catch {
    // Not JSON — treat raw as plain text
  }

  if (typeof candidate !== "string") return "";

  const cleaned = candidate
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();

  if (cleaned.length > 300) {
    return cleaned.slice(0, 297).trimEnd() + "...";
  }
  return cleaned;
}
