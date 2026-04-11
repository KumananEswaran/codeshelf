"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { AI_MODEL, getOpenAIClient } from "@/lib/openai";
import { parseTagsResponse } from "@/lib/ai-tags";
import { parseSummaryResponse } from "@/lib/ai-summary";
import { parseExplanationResponse } from "@/lib/ai-explain";
import { checkUserRateLimit } from "@/lib/rate-limit";

const MAX_CONTENT_CHARS = 2000;
const MAX_EXPLAIN_CONTENT_CHARS = 4000;

const autoTagSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  content: z.string().optional().default(""),
});

const summarySchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  content: z.string().optional().default(""),
  url: z.string().optional().default(""),
  fileName: z.string().optional().default(""),
  typeName: z.string().optional().default(""),
});

const explainSchema = z.object({
  content: z.string().trim().min(1, "Content is required"),
  language: z.string().optional().default(""),
  typeName: z.enum(["snippet", "command"]),
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

const EXPLAIN_INSTRUCTIONS = `You are a developer tool assistant that explains code snippets and terminal commands to developers. Write a clear, concise explanation (200-300 words) covering what the code does and the key concepts involved. Use markdown formatting: short paragraphs, inline code for identifiers, and bullet lists when helpful. Do not invent context that isn't in the code. No meta-commentary, no preamble like "This code...", just the explanation itself. Reply with a JSON object of the form {"explanation": "..."}.`;

export async function explainCode(
  data: z.input<typeof explainSchema>
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  if (!session.user.isPro) {
    return { success: false as const, error: "Pro subscription required" };
  }

  const parsed = explainSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: "Content is required" };
  }

  const rate = await checkUserRateLimit("ai", session.user.id);
  if (!rate.success) {
    return {
      success: false as const,
      error: "AI rate limit reached. Please try again later.",
    };
  }

  const { content, language, typeName } = parsed.data;
  const truncated = content.slice(0, MAX_EXPLAIN_CONTENT_CHARS);
  const label = typeName === "command" ? "Terminal command" : "Code snippet";
  const langLine = language ? `\nLanguage: ${language}` : "";
  const input = `Explain the following ${label.toLowerCase()} in 200-300 words. Respond as JSON in the form {"explanation": "..."}.${langLine}\n\n${label}:\n${truncated}`;

  try {
    const client = getOpenAIClient();
    const response = await client.responses.create({
      model: AI_MODEL,
      instructions: EXPLAIN_INSTRUCTIONS,
      input,
      text: { format: { type: "json_object" } },
    });

    const explanation = parseExplanationResponse(response.output_text ?? "");
    if (!explanation) {
      return {
        success: false as const,
        error: "AI could not generate an explanation. Try again.",
      };
    }
    return { success: true as const, data: explanation };
  } catch (error) {
    console.error("[explainCode] OpenAI request failed:", error);
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

const SUMMARY_INSTRUCTIONS = `You are a developer tool assistant that writes concise descriptions for saved developer items (code snippets, prompts, notes, commands, files, images, and links). Write a factual 1-2 sentence description (max ~250 characters) that states what the item is and its purpose. Do NOT mention missing, empty, or absent fields — only describe what is present. No marketing language, no first person, no meta-commentary about the input, no quotes around the output. Reply with a JSON object of the form {"summary": "..."}.`;

export async function generateSummary(
  data: z.input<typeof summarySchema>
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" };
  }

  if (!session.user.isPro) {
    return { success: false as const, error: "Pro subscription required" };
  }

  const parsed = summarySchema.safeParse(data);
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

  const { title, content, url, fileName, typeName } = parsed.data;
  const truncated = content.slice(0, MAX_CONTENT_CHARS);

  const parts = [`Title: ${title}`];
  if (typeName) parts.push(`Type: ${typeName}`);
  if (url) parts.push(`URL: ${url}`);
  if (fileName) parts.push(`File name: ${fileName}`);
  if (truncated) parts.push(`Content:\n${truncated}`);

  const input = `Write a concise 1-2 sentence description for the following developer item. Respond as JSON in the form {"summary": "..."}.\n\n${parts.join("\n\n")}`;

  try {
    const client = getOpenAIClient();
    const response = await client.responses.create({
      model: AI_MODEL,
      instructions: SUMMARY_INSTRUCTIONS,
      input,
      text: { format: { type: "json_object" } },
    });

    const summary = parseSummaryResponse(response.output_text ?? "");
    if (!summary) {
      return {
        success: false as const,
        error: "AI could not generate a description. Try adding more content.",
      };
    }
    return { success: true as const, data: summary };
  } catch (error) {
    console.error("[generateSummary] OpenAI request failed:", error);
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
