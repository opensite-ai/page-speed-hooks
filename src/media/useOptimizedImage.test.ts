import { describe, it, expect } from "vitest";
import { useOptimizedImage } from "./useOptimizedImage";

describe("useOptimizedImage", () => {
  it("is a function", () => {
    expect(typeof useOptimizedImage).toBe("function");
  });
});
