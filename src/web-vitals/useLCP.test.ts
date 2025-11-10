import { describe, it, expect } from "vitest";
import { useLCP } from "./useLCP";

describe("useLCP", () => {
  it("is a function", () => {
    expect(typeof useLCP).toBe("function");
  });
});
