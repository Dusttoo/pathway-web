import { describe, expect, it } from "vitest";
import { normalizeSearchQuery } from "../service";

describe("normalizeSearchQuery", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeSearchQuery("  electric   arc  ")).toBe("electric arc");
  });

  it("caps excessive query length", () => {
    expect(normalizeSearchQuery("a".repeat(120))).toHaveLength(80);
  });
});
