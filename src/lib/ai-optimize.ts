const MAX_PROMPT_CHARS = 4000;

export function parseOptimizedPromptResponse(raw: string): string {
  if (!raw) return "";

  let candidate: unknown = raw;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") {
      candidate = parsed;
    } else if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      candidate =
        obj.optimized ?? obj.prompt ?? obj.text ?? obj.content ?? "";
    }
  } catch {
    // Not JSON — treat as plain text
  }

  if (typeof candidate !== "string") return "";

  const cleaned = candidate.trim().replace(/^["']|["']$/g, "").trim();
  if (cleaned.length > MAX_PROMPT_CHARS) {
    return cleaned.slice(0, MAX_PROMPT_CHARS - 3).trimEnd() + "...";
  }
  return cleaned;
}
