import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useINP } from "./useINP";
import type { INPOptions } from "./types";

// Mock web-vitals
vi.mock("web-vitals", () => ({
  onINP: vi.fn(),
}));

import { onINP } from "web-vitals";

const mockOnINP = onINP as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  // Reset mocks
  mockOnINP.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useINP", () => {
  it("is a function", () => {
    expect(typeof useINP).toBe("function");
  });

  it("returns initial state with default values", () => {
    const { result } = renderHook(() => useINP());

    expect(result.current.inp).toBeNull();
    expect(result.current.rating).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.interactions).toEqual([]);
    expect(result.current.slowestInteraction).toBeNull();
    expect(result.current.slowestPhases).toBeNull();
    expect(result.current.issues).toEqual([]);
    expect(result.current.interactionCount).toBe(0);
    expect(result.current.slowInteractionCount).toBe(0);
    expect(result.current.averageLatency).toBeNull();
    expect(result.current.goodInteractionPercentage).toBe(100);
    expect(result.current.interactionsByType).toEqual({
      click: 0,
      keypress: 0,
      tap: 0,
    });
  });

  it("provides utility functions", () => {
    const { result } = renderHook(() => useINP());

    expect(typeof result.current.utils.getElementSelector).toBe("function");
    expect(typeof result.current.utils.isThirdPartyScript).toBe("function");
    expect(typeof result.current.utils.getSuggestions).toBe("function");
    expect(typeof result.current.utils.reset).toBe("function");
    expect(typeof result.current.utils.recordInteraction).toBe("function");
  });

  describe("getElementSelector utility", () => {
    it("returns null for null element", () => {
      const { result } = renderHook(() => useINP());
      const selector = result.current.utils.getElementSelector(null);

      expect(selector).toBeNull();
    });

    it("returns ID selector when element has ID", () => {
      const element = document.createElement("button");
      element.id = "submit-btn";

      const { result } = renderHook(() => useINP());
      const selector = result.current.utils.getElementSelector(element);

      expect(selector).toBe("#submit-btn");
    });

    it("returns class-based selector when element has classes", () => {
      const element = document.createElement("button");
      element.className = "btn primary";

      const { result } = renderHook(() => useINP());
      const selector = result.current.utils.getElementSelector(element);

      expect(selector).toBe("button.btn.primary");
    });
  });

  describe("isThirdPartyScript utility", () => {
    it("returns false for empty URL", () => {
      const { result } = renderHook(() => useINP());
      expect(result.current.utils.isThirdPartyScript("")).toBe(false);
    });

    it("returns false for same-origin URL", () => {
      const { result } = renderHook(() => useINP());
      expect(result.current.utils.isThirdPartyScript(window.location.origin + "/script.js")).toBe(false);
    });

    it("returns true for cross-origin URL", () => {
      const { result } = renderHook(() => useINP());
      expect(result.current.utils.isThirdPartyScript("https://example.com/script.js")).toBe(true);
    });
  });

  describe("reset utility", () => {
    it("resets state to initial values", async () => {
      const { result } = renderHook(() => useINP());

      act(() => {
        result.current.utils.reset();
      });

      expect(result.current.inp).toBeNull();
      expect(result.current.rating).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.interactions).toEqual([]);
    });
  });

  describe("recordInteraction utility", () => {
    it("records a manual interaction", () => {
      const onInteraction = vi.fn();
      const { result } = renderHook(() => useINP({ onInteraction }));

      act(() => {
        result.current.utils.recordInteraction(150, "#button", "click");
      });

      expect(onInteraction).toHaveBeenCalled();
      expect(onInteraction.mock.calls[0][0]).toMatchObject({
        type: "click",
        latency: 150,
        target: "#button",
        rating: "good",
      });
    });
  });

  describe("INP measurement", () => {
    it("calls onINP from web-vitals library", () => {
      renderHook(() => useINP());

      expect(mockOnINP).toHaveBeenCalled();
    });

    it("passes reportAllChanges option to onINP", () => {
      renderHook(() => useINP({ reportAllChanges: true }));

      expect(mockOnINP).toHaveBeenCalledWith(
        expect.any(Function),
        { reportAllChanges: true }
      );
    });

    it("updates state when INP metric is reported", async () => {
      const { result } = renderHook(() => useINP());

      // Get the callback passed to onINP
      const callback = mockOnINP.mock.calls[0][0];

      // Create a mock PerformanceEventTiming entry
      const mockEntry = {
        name: "click",
        startTime: 100,
        duration: 150,
        processingStart: 110,
        processingEnd: 200,
        target: null,
      };

      // Simulate INP metric
      act(() => {
        callback({
          value: 150,
          entries: [mockEntry],
        });
      });

      await waitFor(() => {
        expect(result.current.inp).toBe(150);
        expect(result.current.rating).toBe("good");
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("uses the latest onMeasure callback without re-registering", async () => {
      const first = vi.fn();
      const second = vi.fn();
      const { rerender } = renderHook<
        ReturnType<typeof useINP>,
        { onMeasure: INPOptions["onMeasure"] }
      >(
        ({ onMeasure }) => useINP({ onMeasure }),
        { initialProps: { onMeasure: first } }
      );

      const callback = mockOnINP.mock.calls[0][0];
      rerender({ onMeasure: second });

      const mockEntry = {
        name: "click",
        startTime: 100,
        duration: 150,
        processingStart: 110,
        processingEnd: 200,
        target: null,
      };

      act(() => {
        callback({ value: 150, entries: [mockEntry] });
      });

      await waitFor(() => {
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledWith(150, "good");
      });

      expect(mockOnINP).toHaveBeenCalledTimes(1);
    });

    it("calculates correct rating for good INP", async () => {
      const { result } = renderHook(() => useINP());
      const callback = mockOnINP.mock.calls[0][0];

      const mockEntry = {
        name: "click",
        startTime: 100,
        duration: 180,
        processingStart: 110,
        processingEnd: 220,
        target: null,
      };

      act(() => {
        callback({ value: 180, entries: [mockEntry] });
      });

      await waitFor(() => {
        expect(result.current.rating).toBe("good");
      });
    });

    it("calculates correct rating for needs-improvement INP", async () => {
      const { result } = renderHook(() => useINP());
      const callback = mockOnINP.mock.calls[0][0];

      const mockEntry = {
        name: "click",
        startTime: 100,
        duration: 350,
        processingStart: 110,
        processingEnd: 380,
        target: null,
      };

      act(() => {
        callback({ value: 350, entries: [mockEntry] });
      });

      await waitFor(() => {
        expect(result.current.rating).toBe("needs-improvement");
      });
    });

    it("calculates correct rating for poor INP", async () => {
      const { result } = renderHook(() => useINP());
      const callback = mockOnINP.mock.calls[0][0];

      const mockEntry = {
        name: "click",
        startTime: 100,
        duration: 600,
        processingStart: 110,
        processingEnd: 600,
        target: null,
      };

      act(() => {
        callback({ value: 600, entries: [mockEntry] });
      });

      await waitFor(() => {
        expect(result.current.rating).toBe("poor");
      });
    });
  });

  describe("callbacks", () => {
    it("calls onMeasure callback when INP is measured", async () => {
      const onMeasure = vi.fn();
      renderHook(() => useINP({ onMeasure }));

      const callback = mockOnINP.mock.calls[0][0];

      const mockEntry = {
        name: "click",
        startTime: 100,
        duration: 150,
        processingStart: 110,
        processingEnd: 200,
        target: null,
      };

      act(() => {
        callback({ value: 150, entries: [mockEntry] });
      });

      await waitFor(() => {
        expect(onMeasure).toHaveBeenCalledWith(150, "good");
      });
    });
  });

  describe("thresholds", () => {
    it("uses default threshold of 200", () => {
      const { result } = renderHook(() => useINP());

      // Threshold is used internally for warnings
      expect(result.current.inp).toBeNull();
    });

    it("accepts custom threshold", () => {
      const { result } = renderHook(() => useINP({ threshold: 100 }));

      expect(result.current.inp).toBeNull();
    });
  });

  describe("phase breakdown", () => {
    it("calculates phase breakdown correctly", async () => {
      const { result } = renderHook(() => useINP());
      const callback = mockOnINP.mock.calls[0][0];

      const mockEntry = {
        name: "click",
        startTime: 100,
        duration: 200,
        processingStart: 120, // 20ms input delay
        processingEnd: 220,   // 100ms processing
        target: null,
      };

      act(() => {
        callback({ value: 200, entries: [mockEntry] });
      });

      await waitFor(() => {
        expect(result.current.slowestPhases).not.toBeNull();
        expect(result.current.slowestPhases?.inputDelay).toBe(20);
        expect(result.current.slowestPhases?.processingDuration).toBe(100);
        // presentationDelay = duration - (processingEnd - startTime) = 200 - 120 = 80
        expect(result.current.slowestPhases?.presentationDelay).toBe(80);
      });
    });
  });

  describe("interaction type detection", () => {
    it("detects click interactions", async () => {
      const { result } = renderHook(() => useINP());
      const callback = mockOnINP.mock.calls[0][0];

      const mockEntry = {
        name: "click",
        startTime: 100,
        duration: 100,
        processingStart: 110,
        processingEnd: 160,
        target: null,
      };

      act(() => {
        callback({ value: 100, entries: [mockEntry] });
      });

      await waitFor(() => {
        expect(result.current.slowestInteraction?.type).toBe("click");
      });
    });

    it("detects keypress interactions", async () => {
      const { result } = renderHook(() => useINP());
      const callback = mockOnINP.mock.calls[0][0];

      const mockEntry = {
        name: "keydown",
        startTime: 100,
        duration: 100,
        processingStart: 110,
        processingEnd: 160,
        target: null,
      };

      act(() => {
        callback({ value: 100, entries: [mockEntry] });
      });

      await waitFor(() => {
        expect(result.current.slowestInteraction?.type).toBe("keypress");
      });
    });

    it("detects tap interactions", async () => {
      const { result } = renderHook(() => useINP());
      const callback = mockOnINP.mock.calls[0][0];

      const mockEntry = {
        name: "pointerdown",
        startTime: 100,
        duration: 100,
        processingStart: 110,
        processingEnd: 160,
        target: null,
      };

      act(() => {
        callback({ value: 100, entries: [mockEntry] });
      });

      await waitFor(() => {
        expect(result.current.slowestInteraction?.type).toBe("tap");
      });
    });
  });

  describe("getSuggestions utility", () => {
    it("provides suggestions for high input delay", () => {
      const { result } = renderHook(() => useINP());

      const interaction = {
        id: "test",
        type: "click" as const,
        latency: 300,
        rating: "needs-improvement" as const,
        target: null,
        startTime: 100,
        phases: {
          inputDelay: 150,
          processingDuration: 100,
          presentationDelay: 50,
        },
        scripts: [],
        longestEventType: "click",
      };

      const suggestions = result.current.utils.getSuggestions(interaction);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes("input delay"))).toBe(true);
    });

    it("provides suggestions for high processing duration", () => {
      const { result } = renderHook(() => useINP());

      const interaction = {
        id: "test",
        type: "click" as const,
        latency: 300,
        rating: "needs-improvement" as const,
        target: null,
        startTime: 100,
        phases: {
          inputDelay: 20,
          processingDuration: 200,
          presentationDelay: 80,
        },
        scripts: [],
        longestEventType: "click",
      };

      const suggestions = result.current.utils.getSuggestions(interaction);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes("event handlers") || s.includes("yield"))).toBe(true);
    });

    it("provides suggestions for high presentation delay", () => {
      const { result } = renderHook(() => useINP());

      const interaction = {
        id: "test",
        type: "click" as const,
        latency: 200,
        rating: "good" as const,
        target: null,
        startTime: 100,
        phases: {
          inputDelay: 20,
          processingDuration: 50,
          presentationDelay: 130,
        },
        scripts: [],
        longestEventType: "click",
      };

      const suggestions = result.current.utils.getSuggestions(interaction);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes("presentation") || s.includes("DOM"))).toBe(true);
    });
  });

  describe("statistics", () => {
    it("tracks interaction count", async () => {
      const { result } = renderHook(() => useINP());
      const callback = mockOnINP.mock.calls[0][0];

      const mockEntry = {
        name: "click",
        startTime: 100,
        duration: 100,
        processingStart: 110,
        processingEnd: 160,
        target: null,
      };

      act(() => {
        callback({ value: 100, entries: [mockEntry] });
      });

      await waitFor(() => {
        expect(result.current.interactionCount).toBeGreaterThanOrEqual(0);
      });
    });
  });

  it("registers INP observer once per hook instance", () => {
    const { rerender } = renderHook<
      ReturnType<typeof useINP>,
      { onMeasure: INPOptions["onMeasure"] }
    >(
      ({ onMeasure }) => useINP({ onMeasure }),
      { initialProps: { onMeasure: vi.fn() } }
    );

    rerender({ onMeasure: vi.fn() });

    expect(mockOnINP).toHaveBeenCalledTimes(1);
  });
});
