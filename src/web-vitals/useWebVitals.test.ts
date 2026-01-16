import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWebVitals } from "./useWebVitals";
import type { WebVitalsOptions } from "./types";

vi.mock("web-vitals", () => ({
  onCLS: vi.fn(),
  onINP: vi.fn(),
  onLCP: vi.fn(),
  onFCP: vi.fn(),
  onTTFB: vi.fn(),
}));

import { onCLS, onINP, onLCP, onFCP, onTTFB } from "web-vitals";

const mockOnCLS = onCLS as unknown as ReturnType<typeof vi.fn>;
const mockOnINP = onINP as unknown as ReturnType<typeof vi.fn>;
const mockOnLCP = onLCP as unknown as ReturnType<typeof vi.fn>;
const mockOnFCP = onFCP as unknown as ReturnType<typeof vi.fn>;
const mockOnTTFB = onTTFB as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockOnCLS.mockReset();
  mockOnINP.mockReset();
  mockOnLCP.mockReset();
  mockOnFCP.mockReset();
  mockOnTTFB.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useWebVitals", () => {
  it("is a function", () => {
    expect(typeof useWebVitals).toBe("function");
  });

  it("registers web-vitals listeners once per hook instance", () => {
    const { rerender } = renderHook<
      ReturnType<typeof useWebVitals>,
      { onLCP: WebVitalsOptions["onLCP"] }
    >(
      ({ onLCP: onLCPCallback }) => useWebVitals({ onLCP: onLCPCallback }),
      { initialProps: { onLCP: vi.fn() } }
    );

    rerender({ onLCP: vi.fn() });

    expect(mockOnLCP).toHaveBeenCalledTimes(1);
    expect(mockOnCLS).toHaveBeenCalledTimes(1);
    expect(mockOnINP).toHaveBeenCalledTimes(1);
    expect(mockOnFCP).toHaveBeenCalledTimes(1);
    expect(mockOnTTFB).toHaveBeenCalledTimes(1);
  });

  it("uses the latest callbacks without re-registering", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook<
      ReturnType<typeof useWebVitals>,
      { onLCP: WebVitalsOptions["onLCP"] }
    >(
      ({ onLCP: onLCPCallback }) => useWebVitals({ onLCP: onLCPCallback }),
      { initialProps: { onLCP: first } }
    );

    const handler = mockOnLCP.mock.calls[0][0];
    rerender({ onLCP: second });

    act(() => {
      handler({ value: 123 } as any);
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith({ value: 123 });
    expect(mockOnLCP).toHaveBeenCalledTimes(1);
  });
});
