import { describe, it, expect } from "vitest";
import { useDeferredMount } from "./useDeferredMount";

describe("useDeferredMount", () => {
  it("is a function", () => {
    expect(typeof useDeferredMount).toBe("function");
  });
});
