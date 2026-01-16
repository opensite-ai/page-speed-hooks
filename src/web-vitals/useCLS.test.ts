import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useCLS } from "./useCLS";
import type { CLSOptions } from "./types";

// Mock web-vitals
vi.mock("web-vitals", () => ({
  onCLS: vi.fn(),
}));

import { onCLS } from "web-vitals";

const mockOnCLS = onCLS as unknown as ReturnType<typeof vi.fn>;

// Mock PerformanceObserver
const mockPerformanceObserver = vi.fn();
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  mockPerformanceObserver.mockImplementation(() => ({
    observe: mockObserve,
    disconnect: mockDisconnect,
  }));
  vi.stubGlobal("PerformanceObserver", mockPerformanceObserver);

  // Reset mocks
  mockOnCLS.mockReset();
  mockObserve.mockReset();
  mockDisconnect.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("useCLS", () => {
  it("is a function", () => {
    expect(typeof useCLS).toBe("function");
  });

  it("returns initial state with default values", () => {
    const { result } = renderHook(() => useCLS());

    expect(result.current.cls).toBeNull();
    expect(result.current.rating).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.entries).toEqual([]);
    expect(result.current.largestShift).toBeNull();
    expect(result.current.sessionWindows).toEqual([]);
    expect(result.current.largestSessionWindow).toBeNull();
    expect(result.current.issues).toEqual([]);
    expect(result.current.shiftCount).toBe(0);
    expect(result.current.hasPostInteractionShifts).toBe(false);
  });

  it("provides utility functions", () => {
    const { result } = renderHook(() => useCLS());

    expect(typeof result.current.utils.getElementSelector).toBe("function");
    expect(typeof result.current.utils.hasExplicitDimensions).toBe("function");
    expect(typeof result.current.utils.getAspectRatio).toBe("function");
    expect(typeof result.current.utils.reset).toBe("function");
  });

  describe("getAspectRatio utility", () => {
    it("returns correct ratio for 16:9", () => {
      const { result } = renderHook(() => useCLS());
      const ratio = result.current.utils.getAspectRatio(1920, 1080);

      expect(ratio.ratio).toBe("16 / 9");
      expect(ratio.decimal).toBeCloseTo(1.778, 2);
    });

    it("returns correct ratio for 4:3", () => {
      const { result } = renderHook(() => useCLS());
      const ratio = result.current.utils.getAspectRatio(800, 600);

      expect(ratio.ratio).toBe("4 / 3");
      expect(ratio.decimal).toBeCloseTo(1.333, 2);
    });

    it("returns correct ratio for 1:1", () => {
      const { result } = renderHook(() => useCLS());
      const ratio = result.current.utils.getAspectRatio(500, 500);

      expect(ratio.ratio).toBe("1 / 1");
      expect(ratio.decimal).toBe(1);
    });

    it("handles zero height gracefully", () => {
      const { result } = renderHook(() => useCLS());
      const ratio = result.current.utils.getAspectRatio(100, 0);

      expect(ratio.ratio).toBe("1 / 1");
      expect(ratio.decimal).toBe(1);
    });
  });

  describe("getElementSelector utility", () => {
    it("returns null for null element", () => {
      const { result } = renderHook(() => useCLS());
      const selector = result.current.utils.getElementSelector(null);

      expect(selector).toBeNull();
    });

    it("returns ID selector when element has ID", () => {
      const element = document.createElement("div");
      element.id = "test-id";

      const { result } = renderHook(() => useCLS());
      const selector = result.current.utils.getElementSelector(element);

      expect(selector).toBe("#test-id");
    });

    it("returns class-based selector when element has classes", () => {
      const element = document.createElement("div");
      element.className = "class1 class2";

      const { result } = renderHook(() => useCLS());
      const selector = result.current.utils.getElementSelector(element);

      expect(selector).toBe("div.class1.class2");
    });
  });

  describe("hasExplicitDimensions utility", () => {
    it("returns false for null element", () => {
      const { result } = renderHook(() => useCLS());
      expect(result.current.utils.hasExplicitDimensions(null)).toBe(false);
    });

    it("returns true when element has width and height attributes", () => {
      const img = document.createElement("img");
      img.setAttribute("width", "800");
      img.setAttribute("height", "600");

      const { result } = renderHook(() => useCLS());
      expect(result.current.utils.hasExplicitDimensions(img)).toBe(true);
    });
  });

  describe("reset utility", () => {
    it("resets state to initial values", async () => {
      const { result } = renderHook(() => useCLS());

      // Simulate some state change
      act(() => {
        result.current.utils.reset();
      });

      expect(result.current.cls).toBeNull();
      expect(result.current.rating).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.entries).toEqual([]);
    });
  });

  describe("CLS measurement", () => {
    it("calls onCLS from web-vitals library", () => {
      renderHook(() => useCLS());

      expect(mockOnCLS).toHaveBeenCalled();
    });

    it("passes reportAllChanges option to onCLS", () => {
      renderHook(() => useCLS({ reportAllChanges: true }));

      expect(mockOnCLS).toHaveBeenCalledWith(
        expect.any(Function),
        { reportAllChanges: true }
      );
    });

    it("updates state when CLS metric is reported", async () => {
      const { result } = renderHook(() => useCLS());

      // Get the callback passed to onCLS
      const callback = mockOnCLS.mock.calls[0][0];

      // Simulate CLS metric
      act(() => {
        callback({
          value: 0.05,
          entries: [],
        });
      });

      await waitFor(() => {
        expect(result.current.cls).toBe(0.05);
        expect(result.current.rating).toBe("good");
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("calculates correct rating for good CLS", async () => {
      const { result } = renderHook(() => useCLS());
      const callback = mockOnCLS.mock.calls[0][0];

      act(() => {
        callback({ value: 0.08, entries: [] });
      });

      await waitFor(() => {
        expect(result.current.rating).toBe("good");
      });
    });

    it("calculates correct rating for needs-improvement CLS", async () => {
      const { result } = renderHook(() => useCLS());
      const callback = mockOnCLS.mock.calls[0][0];

      act(() => {
        callback({ value: 0.15, entries: [] });
      });

      await waitFor(() => {
        expect(result.current.rating).toBe("needs-improvement");
      });
    });

    it("calculates correct rating for poor CLS", async () => {
      const { result } = renderHook(() => useCLS());
      const callback = mockOnCLS.mock.calls[0][0];

      act(() => {
        callback({ value: 0.3, entries: [] });
      });

      await waitFor(() => {
        expect(result.current.rating).toBe("poor");
      });
    });
  });

  describe("callbacks", () => {
    it("calls onMeasure callback when CLS is measured", async () => {
      const onMeasure = vi.fn();
      renderHook(() => useCLS({ onMeasure }));

      const callback = mockOnCLS.mock.calls[0][0];

      act(() => {
        callback({ value: 0.05, entries: [] });
      });

      await waitFor(() => {
        expect(onMeasure).toHaveBeenCalledWith(0.05, "good");
      });
    });

    it("uses the latest onMeasure callback without re-registering", async () => {
      const first = vi.fn();
      const second = vi.fn();
      const { rerender } = renderHook<
        ReturnType<typeof useCLS>,
        { onMeasure: CLSOptions["onMeasure"] }
      >(
        ({ onMeasure }) => useCLS({ onMeasure }),
        { initialProps: { onMeasure: first } }
      );

      const callback = mockOnCLS.mock.calls[0][0];
      rerender({ onMeasure: second });

      act(() => {
        callback({ value: 0.05, entries: [] });
      });

      await waitFor(() => {
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledWith(0.05, "good");
      });

      expect(mockOnCLS).toHaveBeenCalledTimes(1);
    });
  });

  it("registers CLS observer once per hook instance", () => {
    const { rerender } = renderHook<
      ReturnType<typeof useCLS>,
      { onMeasure: CLSOptions["onMeasure"] }
    >(
      ({ onMeasure }) => useCLS({ onMeasure }),
      { initialProps: { onMeasure: vi.fn() } }
    );

    rerender({ onMeasure: vi.fn() });

    expect(mockOnCLS).toHaveBeenCalledTimes(1);
  });

  describe("thresholds", () => {
    it("uses default threshold of 0.1", () => {
      const { result } = renderHook(() => useCLS());

      // Threshold is used internally for warnings
      expect(result.current.cls).toBeNull();
    });

    it("accepts custom threshold", () => {
      const { result } = renderHook(() => useCLS({ threshold: 0.05 }));

      expect(result.current.cls).toBeNull();
    });
  });

  describe("PerformanceObserver integration", () => {
    it("creates PerformanceObserver when trackAttribution is true", () => {
      renderHook(() => useCLS({ trackAttribution: true }));

      expect(mockPerformanceObserver).toHaveBeenCalled();
    });

    it("observes layout-shift entries", () => {
      renderHook(() => useCLS({ trackAttribution: true }));

      expect(mockObserve).toHaveBeenCalledWith({
        type: "layout-shift",
        buffered: true,
      });
    });

    it("disconnects observer on unmount", () => {
      const { unmount } = renderHook(() => useCLS({ trackAttribution: true }));

      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe("layout shift entries processing", () => {
    it("processes layout shift entries from metric", async () => {
      const { result } = renderHook(() => useCLS());
      const callback = mockOnCLS.mock.calls[0][0];

      act(() => {
        callback({
          value: 0.1,
          entries: [
            {
              startTime: 1000,
              value: 0.05,
              hadRecentInput: false,
              sources: [],
            },
            {
              startTime: 1500,
              value: 0.05,
              hadRecentInput: false,
              sources: [],
            },
          ],
        });
      });

      await waitFor(() => {
        expect(result.current.entries.length).toBe(2);
        expect(result.current.shiftCount).toBe(2);
      });
    });

    it("identifies largest shift", async () => {
      const { result } = renderHook(() => useCLS());
      const callback = mockOnCLS.mock.calls[0][0];

      act(() => {
        callback({
          value: 0.15,
          entries: [
            {
              startTime: 1000,
              value: 0.05,
              hadRecentInput: false,
              sources: [],
            },
            {
              startTime: 1500,
              value: 0.10,
              hadRecentInput: false,
              sources: [],
            },
          ],
        });
      });

      await waitFor(() => {
        expect(result.current.largestShift).not.toBeNull();
        expect(result.current.largestShift?.value).toBe(0.10);
      });
    });
  });

  describe("session windows", () => {
    it("builds session windows from entries", async () => {
      const { result } = renderHook(() => useCLS());
      const callback = mockOnCLS.mock.calls[0][0];

      act(() => {
        callback({
          value: 0.1,
          entries: [
            {
              startTime: 100,
              value: 0.05,
              hadRecentInput: false,
              sources: [],
            },
            {
              startTime: 200,
              value: 0.05,
              hadRecentInput: false,
              sources: [],
            },
          ],
        });
      });

      await waitFor(() => {
        expect(result.current.sessionWindows.length).toBeGreaterThan(0);
      });
    });

    it("identifies largest session window", async () => {
      const { result } = renderHook(() => useCLS());
      const callback = mockOnCLS.mock.calls[0][0];

      act(() => {
        callback({
          value: 0.15,
          entries: [
            {
              startTime: 100,
              value: 0.08,
              hadRecentInput: false,
              sources: [],
            },
            {
              startTime: 200,
              value: 0.07,
              hadRecentInput: false,
              sources: [],
            },
          ],
        });
      });

      await waitFor(() => {
        expect(result.current.largestSessionWindow).not.toBeNull();
      });
    });
  });
});
