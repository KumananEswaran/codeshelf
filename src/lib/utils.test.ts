import { describe, it, expect } from "vitest";
import { cn, formatDate } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("handles conditional classes", () => {
    expect(cn("px-2", false && "py-1")).toBe("px-2");
  });

  it("deduplicates conflicting tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

describe("formatDate", () => {
  it("formats date as short month and day", () => {
    const date = new Date("2026-03-15");
    const result = formatDate(date);
    expect(result).toContain("Mar");
    expect(result).toContain("15");
  });
});
