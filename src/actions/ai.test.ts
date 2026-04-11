import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
const checkUserRateLimitMock = vi.fn();
const responsesCreateMock = vi.fn();

vi.mock("@/auth", () => ({
  auth: () => authMock(),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkUserRateLimit: (...args: unknown[]) => checkUserRateLimitMock(...args),
}));

vi.mock("@/lib/openai", () => ({
  AI_MODEL: "gpt-5-nano",
  getOpenAIClient: () => ({
    responses: { create: (...args: unknown[]) => responsesCreateMock(...args) },
  }),
}));

import { generateAutoTags, generateSummary } from "./ai";
import { parseTagsResponse } from "@/lib/ai-tags";

beforeEach(() => {
  vi.clearAllMocks();
  checkUserRateLimitMock.mockResolvedValue({ success: true, remaining: 19, reset: 0 });
});

describe("parseTagsResponse", () => {
  it("parses {tags: [...]} shape and lowercases", () => {
    expect(parseTagsResponse('{"tags":["React","HOOKS","useState"]}')).toEqual([
      "react",
      "hooks",
      "usestate",
    ]);
  });

  it("parses bare array shape", () => {
    expect(parseTagsResponse('["typescript","zod"]')).toEqual(["typescript", "zod"]);
  });

  it("returns empty for invalid JSON", () => {
    expect(parseTagsResponse("not json")).toEqual([]);
  });

  it("dedupes and trims", () => {
    expect(parseTagsResponse('{"tags":["a","A"," b ","a"]}')).toEqual(["a", "b"]);
  });

  it("caps at 5 tags", () => {
    expect(parseTagsResponse('{"tags":["a","b","c","d","e","f","g"]}')).toHaveLength(5);
  });

  it("drops overlong and non-string entries", () => {
    expect(
      parseTagsResponse('{"tags":["ok","' + "x".repeat(40) + '",123,""]}')
    ).toEqual(["ok"]);
  });
});

describe("generateAutoTags", () => {
  it("returns Unauthorized when no session", async () => {
    authMock.mockResolvedValue(null);
    const result = await generateAutoTags({ title: "Test", content: "" });
    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("requires Pro subscription", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", isPro: false } });
    const result = await generateAutoTags({ title: "Test", content: "" });
    expect(result).toEqual({ success: false, error: "Pro subscription required" });
  });

  it("validates title", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", isPro: true } });
    const result = await generateAutoTags({ title: "  ", content: "x" });
    expect(result.success).toBe(false);
  });

  it("returns 429 message when rate limit hit", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", isPro: true } });
    checkUserRateLimitMock.mockResolvedValue({ success: false, remaining: 0, reset: 0 });
    const result = await generateAutoTags({ title: "Test", content: "x" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/rate limit/i);
  });

  it("returns parsed tags on success and truncates content", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", isPro: true } });
    responsesCreateMock.mockResolvedValue({
      output_text: '{"tags":["React","Hooks"]}',
    });

    const longContent = "x".repeat(5000);
    const result = await generateAutoTags({ title: "Test", content: longContent });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(["react", "hooks"]);

    const callArg = responsesCreateMock.mock.calls[0][0];
    expect(callArg.model).toBe("gpt-5-nano");
    expect(callArg.text.format.type).toBe("json_object");
    expect(callArg.input.length).toBeLessThan(longContent.length);
  });

  it("returns error when AI returns no usable tags", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", isPro: true } });
    responsesCreateMock.mockResolvedValue({ output_text: "{}" });
    const result = await generateAutoTags({ title: "Test", content: "x" });
    expect(result.success).toBe(false);
  });

  it("handles AI service errors gracefully", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", isPro: true } });
    responsesCreateMock.mockRejectedValue(new Error("network down"));
    const result = await generateAutoTags({ title: "Test", content: "x" });
    expect(result).toEqual({
      success: false,
      error: "AI feature temporarily unavailable.",
    });
  });
});

describe("generateSummary", () => {
  it("returns Unauthorized when no session", async () => {
    authMock.mockResolvedValue(null);
    const result = await generateSummary({ title: "Test" });
    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("requires Pro subscription", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", isPro: false } });
    const result = await generateSummary({ title: "Test" });
    expect(result).toEqual({ success: false, error: "Pro subscription required" });
  });

  it("validates title", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", isPro: true } });
    const result = await generateSummary({ title: "  " });
    expect(result.success).toBe(false);
  });

  it("returns rate limit error when limit hit", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", isPro: true } });
    checkUserRateLimitMock.mockResolvedValue({ success: false, remaining: 0, reset: 0 });
    const result = await generateSummary({ title: "Test", content: "x" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/rate limit/i);
  });

  it("returns parsed summary on success and truncates content", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", isPro: true } });
    responsesCreateMock.mockResolvedValue({
      output_text: '{"summary":"A concise description."}',
    });

    const longContent = "x".repeat(5000);
    const result = await generateSummary({
      title: "useDebounce",
      content: longContent,
      typeName: "snippet",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("A concise description.");

    const callArg = responsesCreateMock.mock.calls[0][0];
    expect(callArg.model).toBe("gpt-5-nano");
    expect(callArg.text.format.type).toBe("json_object");
    expect(callArg.input.length).toBeLessThan(longContent.length);
    expect(callArg.input).toContain("Title: useDebounce");
    expect(callArg.input).toContain("Type: snippet");
  });

  it("includes url and file name in prompt when provided", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", isPro: true } });
    responsesCreateMock.mockResolvedValue({ output_text: '{"summary":"ok"}' });

    await generateSummary({
      title: "Docs",
      url: "https://example.com",
      fileName: "readme.md",
    });

    const callArg = responsesCreateMock.mock.calls[0][0];
    expect(callArg.input).toContain("URL: https://example.com");
    expect(callArg.input).toContain("File name: readme.md");
  });

  it("returns error when AI returns an empty summary", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", isPro: true } });
    responsesCreateMock.mockResolvedValue({ output_text: "{}" });
    const result = await generateSummary({ title: "Test", content: "x" });
    expect(result.success).toBe(false);
  });

  it("handles AI service errors gracefully", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", isPro: true } });
    responsesCreateMock.mockRejectedValue(new Error("network down"));
    const result = await generateSummary({ title: "Test", content: "x" });
    expect(result).toEqual({
      success: false,
      error: "AI feature temporarily unavailable.",
    });
  });
});
