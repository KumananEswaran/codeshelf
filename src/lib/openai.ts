import OpenAI from "openai";

export const AI_MODEL = "gpt-5-nano";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!process.env.OPEN_API_KEY) {
    throw new Error("OPEN_API_KEY is not configured");
  }
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPEN_API_KEY,
      maxRetries: 2,
    });
  }
  return client;
}
