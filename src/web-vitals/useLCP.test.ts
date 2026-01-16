import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLCP } from "./useLCP";
import type { LCPOptions } from "./types";

vi.mock("web-vitals", () => ({
  onLCP: vi.fn(),
}));

import { onLCP } from "web-vitals";

const mockOnLCP = onLCP as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockOnLCP.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useLCP", () => {
  it("is a function", () => {
    expect(typeof useLCP).toBe("function");
  });

  it("registers the LCP observer once per hook instance", () => {
    const { rerender } = renderHook<
      ReturnType<typeof useLCP>,
      { onMeasure: LCPOptions["onMeasure"] }
    >(
      ({ onMeasure }) => useLCP({ onMeasure }),
      { initialProps: { onMeasure: vi.fn() } }
    );

    rerender({ onMeasure: vi.fn() });

    expect(mockOnLCP).toHaveBeenCalledTimes(1);
  });

  it("uses the latest onMeasure callback without re-registering", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook<
      ReturnType<typeof useLCP>,
      { onMeasure: LCPOptions["onMeasure"] }
    >(
      ({ onMeasure }) => useLCP({ onMeasure }),
      { initialProps: { onMeasure: first } }
    );

    const handler = mockOnLCP.mock.calls[0][0];
    rerender({ onMeasure: second });

    act(() => {
      handler({ value: 1200 } as any);
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(1200, "good");
    expect(mockOnLCP).toHaveBeenCalledTimes(1);
  });
});
