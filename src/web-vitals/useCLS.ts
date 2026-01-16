"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { onCLS } from "web-vitals";
import type {
  CLSOptions,
  CLSState,
  LayoutShiftEntry,
  LayoutShiftAttribution,
  CLSSessionWindow,
  CLSIssue,
} from "./types";

/**
 * useCLS
 *
 * Comprehensive hook for tracking, analyzing, and optimizing Cumulative Layout Shift (CLS).
 * Provides real-time CLS measurement, attribution data, issue detection, and optimization utilities.
 *
 * CLS Thresholds (web.dev):
 * - Good: ≤ 0.1
 * - Needs Improvement: 0.1 - 0.25
 * - Poor: > 0.25
 *
 * @see https://web.dev/cls/
 * @see https://web.dev/optimize-cls/
 *
 * @example
 * ```tsx
 * function App() {
 *   const {
 *     cls,
 *     rating,
 *     entries,
 *     issues,
 *     largestShift,
 *     utils
 *   } = useCLS({
 *     threshold: 0.1,
 *     onMeasure: (value, rating) => {
 *       analytics.track('CLS', { value, rating });
 *     },
 *     onIssue: (issue) => {
 *       console.warn('CLS Issue:', issue.type, issue.suggestion);
 *     }
 *   });
 *
 *   return (
 *     <div>
 *       <p>CLS: {cls?.toFixed(3) ?? 'Measuring...'}</p>
 *       <p>Rating: {rating}</p>
 *       <p>Layout Shifts: {entries.length}</p>
 *       {issues.length > 0 && (
 *         <div>
 *           <h3>Optimization Opportunities:</h3>
 *           {issues.map((issue, i) => (
 *             <p key={i}>{issue.suggestion}</p>
 *           ))}
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCLS(options: CLSOptions = {}): CLSState {
  const trackAttribution = options.trackAttribution ?? true;

  // Use refs to avoid stale closure issues
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const hasWarnedRef = useRef(false);
  const entriesRef = useRef<LayoutShiftEntry[]>([]);
  const sessionWindowsRef = useRef<CLSSessionWindow[]>([]);
  const issuesRef = useRef<CLSIssue[]>([]);
  const observerRef = useRef<PerformanceObserver | null>(null);

  const [state, setState] = useState<Omit<CLSState, "utils">>({
    cls: null,
    rating: null,
    isLoading: true,
    entries: [],
    largestShift: null,
    sessionWindows: [],
    largestSessionWindow: null,
    issues: [],
    shiftCount: 0,
    hasPostInteractionShifts: false,
  });

  // Calculate rating based on web.dev thresholds
  const getRating = useCallback(
    (value: number): "good" | "needs-improvement" | "poor" => {
      if (value <= 0.1) return "good";
      if (value <= 0.25) return "needs-improvement";
      return "poor";
    },
    []
  );

  // Get CSS selector for an element
  const getElementSelector = useCallback(
    (element: Element | null): string | null => {
      if (!element) return null;

      try {
        // Try to get a unique identifier
        if (element.id) {
          return `#${element.id}`;
        }

        // Build class-based selector
        const classes = Array.from(element.classList).slice(0, 3).join(".");
        const tagName = element.tagName.toLowerCase();

        if (classes) {
          return `${tagName}.${classes}`;
        }

        // Fallback to tag + nth-child
        const parent = element.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children);
          const index = siblings.indexOf(element) + 1;
          return `${tagName}:nth-child(${index})`;
        }

        return tagName;
      } catch {
        return null;
      }
    },
    []
  );

  // Check if element has explicit dimensions
  const hasExplicitDimensions = useCallback(
    (element: HTMLElement | null): boolean => {
      if (!element) return false;

      // Check HTML attributes
      const hasWidthAttr = element.hasAttribute("width");
      const hasHeightAttr = element.hasAttribute("height");

      if (hasWidthAttr && hasHeightAttr) return true;

      // Check CSS
      const style = window.getComputedStyle(element);
      const hasExplicitWidth =
        style.width !== "auto" && !style.width.includes("%");
      const hasExplicitHeight =
        style.height !== "auto" && !style.height.includes("%");

      // Check for aspect-ratio
      const hasAspectRatio =
        style.aspectRatio && style.aspectRatio !== "auto";

      return (hasExplicitWidth && hasExplicitHeight) || Boolean(hasAspectRatio);
    },
    []
  );

  // Calculate aspect ratio
  const getAspectRatio = useCallback(
    (width: number, height: number): { ratio: string; decimal: number } => {
      if (height === 0) return { ratio: "1 / 1", decimal: 1 };

      const decimal = width / height;

      // Find common aspect ratios
      const commonRatios = [
        { w: 16, h: 9, name: "16 / 9" },
        { w: 4, h: 3, name: "4 / 3" },
        { w: 1, h: 1, name: "1 / 1" },
        { w: 3, h: 2, name: "3 / 2" },
        { w: 21, h: 9, name: "21 / 9" },
      ];

      for (const ratio of commonRatios) {
        if (Math.abs(decimal - ratio.w / ratio.h) < 0.01) {
          return { ratio: ratio.name, decimal };
        }
      }

      // GCD for custom ratio
      const gcd = (a: number, b: number): number =>
        b === 0 ? a : gcd(b, a % b);
      const divisor = gcd(Math.round(width), Math.round(height));
      const w = Math.round(width / divisor);
      const h = Math.round(height / divisor);

      return { ratio: `${w} / ${h}`, decimal };
    },
    []
  );

  // Detect CLS issue type based on shifted element
  const detectIssueType = useCallback(
    (
      element: Element | null,
      source: LayoutShiftAttribution
    ): CLSIssue["type"] => {
      if (!element) return "dynamic-content";

      const tagName = element.tagName.toLowerCase();

      // Check for images/videos without dimensions
      if (tagName === "img" || tagName === "video" || tagName === "picture") {
        if (!hasExplicitDimensions(element as HTMLElement)) {
          return tagName === "img"
            ? "image-without-dimensions"
            : "unsized-media";
        }
      }

      // Check for iframes (often ads/embeds)
      if (tagName === "iframe" || element.closest("[data-ad]")) {
        return "ad-embed-shift";
      }

      // Check for font-related classes/attributes
      const classList = element.className || "";
      if (
        classList.includes("font") ||
        element.closest("[class*='font']") ||
        tagName === "span" ||
        tagName === "p"
      ) {
        // Heuristic: text elements with small shifts might be font-related
        const shiftDistance = Math.abs(
          source.currentRect.y - source.previousRect.y
        );
        if (shiftDistance < 20) {
          return "web-font-shift";
        }
      }

      // Check for animated elements
      const style = window.getComputedStyle(element);
      if (
        style.animation !== "none" ||
        style.transition !== "none" ||
        style.transform !== "none"
      ) {
        return "animation-shift";
      }

      return "dynamic-content";
    },
    [hasExplicitDimensions]
  );

  // Get suggestion for issue type
  const getSuggestion = useCallback(
    (type: CLSIssue["type"], element: string | null): string => {
      const suggestions: Record<CLSIssue["type"], string> = {
        "image-without-dimensions": `Add width and height attributes to ${element || "images"}. Example: <img width="800" height="600" /> or use CSS aspect-ratio.`,
        "unsized-media": `Specify dimensions for ${element || "media elements"} using width/height attributes or CSS aspect-ratio property.`,
        "dynamic-content": `Reserve space for dynamically loaded content using min-height, skeleton screens, or CSS aspect-ratio on ${element || "container"}.`,
        "web-font-shift": `Use font-display: optional or preload fonts. Consider using size-adjust, ascent-override, descent-override CSS descriptors for fallback fonts.`,
        "ad-embed-shift": `Reserve space for ads/embeds with fixed dimensions. Use min-height on ad containers: .ad-container { min-height: 250px; }`,
        "animation-shift": `Use transform-based animations instead of layout-affecting properties. Replace top/left/width/height with transform: translate() or scale().`,
      };

      return suggestions[type];
    },
    []
  );

  // Reset function
  const reset = useCallback(() => {
    entriesRef.current = [];
    sessionWindowsRef.current = [];
    issuesRef.current = [];
    hasWarnedRef.current = false;

    setState({
      cls: null,
      rating: null,
      isLoading: true,
      entries: [],
      largestShift: null,
      sessionWindows: [],
      largestSessionWindow: null,
      issues: [],
      shiftCount: 0,
      hasPostInteractionShifts: false,
    });
  }, []);

  // Build session windows from entries
  const buildSessionWindows = useCallback(
    (entries: LayoutShiftEntry[]): CLSSessionWindow[] => {
      if (entries.length === 0) return [];

      const windows: CLSSessionWindow[] = [];
      let currentWindow: CLSSessionWindow | null = null;

      for (const entry of entries) {
        if (entry.hadRecentInput) continue; // Exclude user-initiated shifts

        if (!currentWindow) {
          currentWindow = {
            value: entry.value,
            entries: [entry],
            startTime: entry.startTime,
            endTime: entry.startTime,
          };
        } else {
          const gap = entry.startTime - currentWindow.endTime;
          const duration = entry.startTime - currentWindow.startTime;

          // Close window if gap > 1s or duration > 5s
          if (gap > 1000 || duration > 5000) {
            windows.push(currentWindow);
            currentWindow = {
              value: entry.value,
              entries: [entry],
              startTime: entry.startTime,
              endTime: entry.startTime,
            };
          } else {
            currentWindow.value += entry.value;
            currentWindow.entries.push(entry);
            currentWindow.endTime = entry.startTime;
          }
        }
      }

      if (currentWindow) {
        windows.push(currentWindow);
      }

      return windows;
    },
    []
  );

  // Main effect for CLS tracking
  useEffect(() => {
    // Skip if not in browser
    if (typeof window === "undefined") {
      return;
    }

    let isMounted = true;
    const { reportAllChanges = false } = optionsRef.current;

    // Use web-vitals library for accurate CLS measurement
    onCLS(
      (metric) => {
        const clsValue = metric.value;
        const rating = getRating(clsValue);
        const {
          threshold = 0.1,
          debug = process.env.NODE_ENV === "development",
          detectIssues = true,
        } = optionsRef.current;

        // Process entries from the metric
        const metricEntries: LayoutShiftEntry[] = metric.entries.map(
          (entry) => {
            const layoutEntry = entry as PerformanceEntry & {
              value: number;
              hadRecentInput: boolean;
              sources?: ReadonlyArray<{
                node: Element | null;
                previousRect: DOMRectReadOnly;
                currentRect: DOMRectReadOnly;
              }>;
            };

            const sources: LayoutShiftAttribution[] = (
              layoutEntry.sources || []
            ).map((source) => ({
              node: getElementSelector(source.node),
              previousRect: {
                x: source.previousRect?.x ?? 0,
                y: source.previousRect?.y ?? 0,
                width: source.previousRect?.width ?? 0,
                height: source.previousRect?.height ?? 0,
              },
              currentRect: {
                x: source.currentRect?.x ?? 0,
                y: source.currentRect?.y ?? 0,
                width: source.currentRect?.width ?? 0,
                height: source.currentRect?.height ?? 0,
              },
            }));

            return {
              value: layoutEntry.value || 0,
              startTime: entry.startTime,
              hadRecentInput: layoutEntry.hadRecentInput || false,
              sources,
            };
          }
        );

        entriesRef.current = metricEntries;

        // Build session windows
        const windows = buildSessionWindows(metricEntries);
        sessionWindowsRef.current = windows;

        // Find largest session window
        const largestWindow = windows.reduce<CLSSessionWindow | null>(
          (largest, window) =>
            !largest || window.value > largest.value ? window : largest,
          null
        );

        // Find largest single shift
        const largestShift = metricEntries.reduce<LayoutShiftEntry | null>(
          (largest, entry) =>
            !largest || entry.value > largest.value ? entry : largest,
          null
        );

        // Detect issues if enabled
        if (detectIssues && largestShift && largestShift.sources.length > 0) {
          const source = largestShift.sources[0];

          // Try to find the actual element
          let element: Element | null = null;
          if (source.node && typeof document !== "undefined") {
            try {
              element = document.querySelector(source.node);
            } catch {
              // Invalid selector, ignore
            }
          }

          const issueType = detectIssueType(element, source);
          const newIssue: CLSIssue = {
            type: issueType,
            element: source.node,
            contribution: largestShift.value,
            suggestion: getSuggestion(issueType, source.node),
            timestamp: largestShift.startTime,
          };

          // Check if this issue is already tracked
          const existingIssue = issuesRef.current.find(
            (i) => i.element === newIssue.element && i.type === newIssue.type
          );

          if (!existingIssue) {
            issuesRef.current = [...issuesRef.current, newIssue];
            optionsRef.current.onIssue?.(newIssue);
          }
        }

        // Check for post-interaction shifts
        const hasPostInteractionShifts = metricEntries.some(
          (e) => !e.hadRecentInput && e.startTime > 500
        );

        // Warn in development if CLS exceeds threshold
        if (debug && clsValue > threshold && !hasWarnedRef.current) {
          console.warn(
            `[@page-speed/hooks] CLS (${clsValue.toFixed(3)}) exceeds threshold (${threshold}). ` +
              `See: https://web.dev/cls/`
          );

          if (largestShift) {
            console.warn(
              `[@page-speed/hooks] Largest shift:`,
              largestShift.sources.map((s) => s.node).filter(Boolean)
            );
          }

          if (issuesRef.current.length > 0) {
            console.warn(
              `[@page-speed/hooks] Optimization suggestions:`,
              issuesRef.current.map((i) => i.suggestion)
            );
          }

          hasWarnedRef.current = true;
        }

        // Update state
        if (isMounted) {
          setState({
            cls: clsValue,
            rating,
            isLoading: false,
            entries: metricEntries,
            largestShift,
            sessionWindows: windows,
            largestSessionWindow: largestWindow,
            issues: issuesRef.current,
            shiftCount: metricEntries.length,
            hasPostInteractionShifts,
          });
          optionsRef.current.onMeasure?.(clsValue, rating);
        }
      },
      { reportAllChanges }
    );
    return () => {
      isMounted = false;
    };
  }, [
    getRating,
    getElementSelector,
    detectIssueType,
    getSuggestion,
    buildSessionWindows,
  ]);

  useEffect(() => {
    if (typeof window === "undefined" || !trackAttribution) {
      return;
    }

    if (typeof PerformanceObserver !== "undefined") {
      try {
        observerRef.current = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutEntry = entry as PerformanceEntry & {
              value: number;
              hadRecentInput: boolean;
              sources?: ReadonlyArray<{
                node: Element | null;
                previousRect: DOMRectReadOnly;
                currentRect: DOMRectReadOnly;
              }>;
            };

            if (!layoutEntry.hadRecentInput && layoutEntry.value > 0) {
              const sources: LayoutShiftAttribution[] = (
                layoutEntry.sources || []
              ).map((source) => ({
                node: getElementSelector(source.node),
                previousRect: {
                  x: source.previousRect?.x ?? 0,
                  y: source.previousRect?.y ?? 0,
                  width: source.previousRect?.width ?? 0,
                  height: source.previousRect?.height ?? 0,
                },
                currentRect: {
                  x: source.currentRect?.x ?? 0,
                  y: source.currentRect?.y ?? 0,
                  width: source.currentRect?.width ?? 0,
                  height: source.currentRect?.height ?? 0,
                },
              }));

              const shiftEntry: LayoutShiftEntry = {
                value: layoutEntry.value,
                startTime: entry.startTime,
                hadRecentInput: false,
                sources,
              };

              optionsRef.current.onShift?.(shiftEntry);
            }
          }
        });

        observerRef.current.observe({
          type: "layout-shift",
          buffered: true,
        });
      } catch {
        // PerformanceObserver not supported for layout-shift
      }
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [trackAttribution, getElementSelector]);

  // Memoize utils to prevent unnecessary re-renders
  const utils = useMemo(
    () => ({
      getElementSelector,
      hasExplicitDimensions,
      getAspectRatio,
      reset,
    }),
    [getElementSelector, hasExplicitDimensions, getAspectRatio, reset]
  );

  return {
    ...state,
    utils,
  };
}
