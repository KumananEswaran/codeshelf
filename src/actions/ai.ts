"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { AI_MODEL, getOpenAIClient } from "@/lib/openai";
import { parseTagsResponse } from "@/lib/ai-tags";
import { checkUserRateLimit } from "@/lib/rate-limit";

const MAX_CONTENT_CHARS = 2000;

const autoTagSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  content: z.string().optional().default(""),
});

const SYSTEM_INSTRUCTIONS = `You are a developer tool assistant that suggests concise, lowercase tags for code snippets, prompts, notes, commands, and developer content. Return 3-5 short tags using common developer terminology. Reply with a JSON object of the form {"tags": ["tag1", "tag2"]}.`;

export async function generateAutoTags(
  data: z.input<typeof autoTagSchema>
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  if (!session.user.isPro) {
    return { success: false as const, error: "Pro subscription required" };
  }

  const parsed = autoTagSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: "Title is required" };
  }

  const rate = await checkUserRateLimit("ai", session.user.id);
  if (!rate.success) {
    return {
      success: false as const,
      error: "AI rate limit reached. Please try again later.",
    };
  }

  const { title, content } = parsed.data;
  const truncated = content.slice(0, MAX_CONTENT_CHARS);
  const input = `Suggest 3-5 short lowercase tags for the following developer item. Respond as JSON in the form {"tags": ["tag1", "tag2"]}.\n\nTitle: ${title}\n\nContent:\n${truncated || "(no content)"}`;

  try {
    const client = getOpenAIClient();
    const response = await client.responses.create({
      model: AI_MODEL,
      instructions: SYSTEM_INSTRUCTIONS,
      input,
      text: { format: { type: "json_object" } },
    });

    const tags = parseTagsResponse(response.output_text ?? "");
    if (tags.length === 0) {
      return {
        success: false as const,
        error: "AI could not generate tags. Try adding more content.",
      };
    }
    return { success: true as const, data: tags };
  } catch (error) {
    console.error("[generateAutoTags] OpenAI request failed:", error);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("rate_limit")) {
      return {
        success: false as const,
        error: "AI service is busy. Please try again in a moment.",
      };
    }
    return {
      success: false as const,
      error: "AI feature temporarily unavailable.",
    };
  }
}
