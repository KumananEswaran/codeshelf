import { describe, it, expect } from "vitest";
import {
  FREE_LIMITS,
  requiresPro,
  canCreateItem,
  canCreateCollection,
} from "./subscription";

describe("FREE_LIMITS", () => {
  it("MAX_ITEMS equals 50", () => {
    expect(FREE_LIMITS.MAX_ITEMS).toBe(50);
  });

  it("MAX_COLLECTIONS equals 3", () => {
    expect(FREE_LIMITS.MAX_COLLECTIONS).toBe(3);
  });
});

describe("requiresPro", () => {
  it("returns true for file type", () => {
    expect(requiresPro("file")).toBe(true);
  });

  it("returns true for image type", () => {
    expect(requiresPro("image")).toBe(true);
  });

  it("returns false for snippet type", () => {
    expect(requiresPro("snippet")).toBe(false);
  });

  it("returns false for note type", () => {
    expect(requiresPro("note")).toBe(false);
  });
});

describe("canCreateItem", () => {
  it("allows free user under limit", () => {
    expect(canCreateItem(49, false)).toBe(true);
  });

  it("blocks free user at limit", () => {
    expect(canCreateItem(50, false)).toBe(false);
  });

  it("allows Pro user at limit", () => {
    expect(canCreateItem(50, true)).toBe(true);
  });

  it("allows Pro user with unlimited items", () => {
    expect(canCreateItem(999, true)).toBe(true);
  });
});

describe("canCreateCollection", () => {
  it("allows free user under limit", () => {
    expect(canCreateCollection(2, false)).toBe(true);
  });

  it("blocks free user at limit", () => {
    expect(canCreateCollection(3, false)).toBe(false);
  });

  it("allows Pro user at limit", () => {
    expect(canCreateCollection(3, true)).toBe(true);
  });
});
