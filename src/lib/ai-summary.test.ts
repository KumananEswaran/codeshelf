import { describe, it, expect } from "vitest";
import { parseSummaryResponse } from "./ai-summary";

describe("parseSummaryResponse", () => {
  it("parses {summary: '...'} shape", () => {
    expect(parseSummaryResponse('{"summary":"A React hook for debouncing values."}')).toBe(
      "A React hook for debouncing values."
    );
  });

  it("parses {description: '...'} shape", () => {
    expect(parseSummaryResponse('{"description":"Utility function."}')).toBe(
      "Utility function."
    );
  });

  it("parses plain string JSON", () => {
    expect(parseSummaryResponse('"Just a string summary."')).toBe(
      "Just a string summary."
    );
  });

  it("falls back to plain text when not JSON", () => {
    expect(parseSummaryResponse("Plain text summary.")).toBe("Plain text summary.");
  });

  it("returns empty string for empty input", () => {
    expect(parseSummaryResponse("")).toBe("");
  });

  it("collapses whitespace and trims", () => {
    expect(parseSummaryResponse('{"summary":"  Multi\\n  line\\tsummary  "}')).toBe(
      "Multi line summary"
    );
  });

  it("strips surrounding quotes", () => {
    expect(parseSummaryResponse('"\\"Quoted summary\\""')).toBe("Quoted summary");
  });

  it("truncates overly long summaries with ellipsis", () => {
    const long = "x".repeat(500);
    const result = parseSummaryResponse(`{"summary":"${long}"}`);
    expect(result.length).toBeLessThanOrEqual(300);
    expect(result.endsWith("...")).toBe(true);
  });

  it("returns empty for missing keys", () => {
    expect(parseSummaryResponse("{}")).toBe("");
  });
});
