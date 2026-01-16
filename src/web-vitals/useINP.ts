"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { onINP } from "web-vitals";
import type {
  INPOptions,
  INPState,
  INPInteraction,
  INPPhaseBreakdown,
  INPIssue,
  INPIssueType,
  INPInteractionType,
} from "./types";

/**
 * useINP
 *
 * Comprehensive hook for tracking, analyzing, and optimizing Interaction to Next Paint (INP).
 * Provides real-time INP measurement, interaction attribution, issue detection, and optimization utilities.
 *
 * INP Thresholds (web.dev):
 * - Good: ≤ 200ms
 * - Needs Improvement: 200ms - 500ms
 * - Poor: > 500ms
 *
 * @see https://web.dev/articles/inp
 * @see https://web.dev/articles/optimize-inp
 *
 * @example
 * ```tsx
 * function App() {
 *   const {
 *     inp,
 *     rating,
 *     interactions,
 *     issues,
 *     slowestInteraction,
 *     utils
 *   } = useINP({
 *     threshold: 200,
 *     onMeasure: (value, rating) => {
 *       analytics.track('INP', { value, rating });
 *     },
 *     onIssue: (issue) => {
 *       console.warn('INP Issue:', issue.type, issue.suggestion);
 *     }
 *   });
 *
 *   return (
 *     <div>
 *       <p>INP: {inp ? `${inp.toFixed(0)}ms` : 'Measuring...'}</p>
 *       <p>Rating: {rating}</p>
 *       <p>Interactions: {interactions.length}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useINP(options: INPOptions = {}): INPState {
  // Use refs to avoid stale closure issues
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const hasWarnedRef = useRef(false);
  const interactionsRef = useRef<INPInteraction[]>([]);
  const issuesRef = useRef<INPIssue[]>([]);
  const scriptStatsRef = useRef<Map<string, { totalDuration: number; occurrences: number; isThirdParty: boolean }>>(new Map());

  const [state, setState] = useState<Omit<INPState, "utils">>({
    inp: null,
    rating: null,
    isLoading: true,
    interactions: [],
    slowestInteraction: null,
    slowestPhases: null,
    issues: [],
    interactionCount: 0,
    slowInteractionCount: 0,
    averageLatency: null,
    goodInteractionPercentage: 100,
    interactionsByType: { click: 0, keypress: 0, tap: 0 },
    topSlowScripts: [],
  });

  // Calculate rating based on web.dev thresholds
  const getRating = useCallback(
    (value: number): "good" | "needs-improvement" | "poor" => {
      if (value <= 200) return "good";
      if (value <= 500) return "needs-improvement";
      return "poor";
    },
    []
  );

  // Get CSS selector for an element
  const getElementSelector = useCallback(
    (element: Element | null): string | null => {
      if (!element) return null;

      try {
        if (element.id) {
          return `#${element.id}`;
        }

        const classes = Array.from(element.classList).slice(0, 3).join(".");
        const tagName = element.tagName.toLowerCase();

        if (classes) {
          return `${tagName}.${classes}`;
        }

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

  // Check if a script URL is third-party
  const isThirdPartyScript = useCallback((url: string): boolean => {
    if (!url || typeof window === "undefined") return false;
    try {
      const scriptOrigin = new URL(url).origin;
      return scriptOrigin !== window.location.origin;
    } catch {
      return false;
    }
  }, []);

  // Detect issue type based on interaction data
  const detectIssueType = useCallback(
    (interaction: INPInteraction): INPIssueType | null => {
      const { threshold = 200, longTaskThreshold = 50 } = optionsRef.current;
      const { phases, scripts } = interaction;

      // Check for high input delay (main thread was busy)
      if (phases.inputDelay > longTaskThreshold) {
        return "high-input-delay";
      }

      // Check for high processing duration (expensive event handlers)
      if (phases.processingDuration > threshold * 0.6) {
        if (scripts.some(s => s.isThirdParty && s.duration > 50)) {
          return "third-party-script";
        }
        return "heavy-event-handler";
      }

      // Check for high presentation delay (rendering issues)
      if (phases.presentationDelay > threshold * 0.4) {
        return "high-presentation-delay";
      }

      return null;
    },
    []
  );

  // Get suggestion for issue type
  const getSuggestionForIssue = useCallback(
    (type: INPIssueType, element: string | null, scriptURL?: string): string => {
      const suggestions: Record<INPIssueType, string> = {
        "long-task": `Break up long tasks using setTimeout, requestIdleCallback, or scheduler.yield() to allow the browser to respond to interactions.`,
        "excessive-dom-size": `Reduce DOM size by lazy loading off-screen content, using content-visibility: auto, or virtualizing long lists.`,
        "heavy-event-handler": `Optimize event handler for ${element || "interaction target"}. Use requestAnimationFrame for visual updates and defer non-critical work.`,
        "render-blocking-resource": `Defer or async load render-blocking resources. Consider code splitting and lazy loading.`,
        "third-party-script": `Third-party script ${scriptURL || ""} is impacting INP. Consider lazy loading, using a web worker, or facade pattern.`,
        "layout-thrashing": `Avoid reading layout properties (offsetHeight, getBoundingClientRect) followed by style changes. Batch DOM reads/writes.`,
        "forced-synchronous-layout": `Avoid forcing synchronous layout by reading computed styles after modifying DOM. Use requestAnimationFrame.`,
        "high-input-delay": `Main thread was busy when interaction occurred. Reduce JavaScript execution during page load and idle times.`,
        "high-processing-duration": `Event handlers are taking too long. Simplify handler logic, debounce rapid interactions, or move work to web workers.`,
        "high-presentation-delay": `Rendering is slow after handler completion. Reduce DOM size, simplify CSS selectors, or use CSS containment.`,
        "unoptimized-animation": `Use transform and opacity for animations instead of layout-affecting properties like width, height, top, left.`,
      };

      return suggestions[type];
    },
    []
  );

  // Get suggestions for improving an interaction
  const getSuggestions = useCallback(
    (interaction: INPInteraction): string[] => {
      const suggestions: string[] = [];
      const { phases, scripts } = interaction;

      if (phases.inputDelay > 50) {
        suggestions.push(
          "Reduce input delay by minimizing main thread work during page load and idle times. " +
          "Use requestIdleCallback for non-critical work."
        );
      }

      if (phases.processingDuration > 100) {
        suggestions.push(
          "Optimize event handlers: yield to the main thread using scheduler.yield() or " +
          "setTimeout, debounce rapid interactions, move heavy computation to web workers."
        );
      }

      if (phases.presentationDelay > 50) {
        suggestions.push(
          "Reduce presentation delay: minimize DOM size, use content-visibility for off-screen content, " +
          "simplify CSS selectors, and avoid layout thrashing."
        );
      }

      const thirdPartyScripts = scripts.filter(s => s.isThirdParty);
      if (thirdPartyScripts.length > 0) {
        suggestions.push(
          `Third-party scripts are impacting this interaction. Consider lazy loading or using ` +
          `web workers for: ${thirdPartyScripts.map(s => s.sourceURL).filter(Boolean).join(", ")}`
        );
      }

      if (suggestions.length === 0 && interaction.latency > 200) {
        suggestions.push(
          "General optimization: Use Chrome DevTools Performance panel to profile this interaction " +
          "and identify the specific bottleneck."
        );
      }

      return suggestions;
    },
    []
  );

  // Reset function
  const reset = useCallback(() => {
    interactionsRef.current = [];
    issuesRef.current = [];
    scriptStatsRef.current = new Map();
    hasWarnedRef.current = false;

    setState({
      inp: null,
      rating: null,
      isLoading: true,
      interactions: [],
      slowestInteraction: null,
      slowestPhases: null,
      issues: [],
      interactionCount: 0,
      slowInteractionCount: 0,
      averageLatency: null,
      goodInteractionPercentage: 100,
      interactionsByType: { click: 0, keypress: 0, tap: 0 },
      topSlowScripts: [],
    });
  }, []);

  // Manually record an interaction
  const recordInteraction = useCallback(
    (latency: number, target?: string, type: INPInteractionType = "click") => {
      const rating = getRating(latency);
      const interaction: INPInteraction = {
        id: `manual-${Date.now()}`,
        type,
        latency,
        rating,
        target: target || null,
        startTime: performance.now(),
        phases: {
          inputDelay: 0,
          processingDuration: latency,
          presentationDelay: 0,
        },
        scripts: [],
        longestEventType: null,
      };

      interactionsRef.current = [...interactionsRef.current, interaction];
      optionsRef.current.onInteraction?.(interaction);
    },
    [getRating]
  );

  // Calculate top slow scripts
  const calculateTopSlowScripts = useCallback(() => {
    const entries = Array.from(scriptStatsRef.current.entries());
    return entries
      .map(([url, stats]) => ({ url, ...stats }))
      .sort((a, b) => b.totalDuration - a.totalDuration)
      .slice(0, 5);
  }, []);

  // Main effect for INP tracking
  useEffect(() => {
    // Skip if not in browser
    if (typeof window === "undefined") {
      return;
    }

    let isMounted = true;
    const { reportAllChanges = false } = optionsRef.current;

    // Use web-vitals library for accurate INP measurement
    onINP(
      (metric) => {
        if (!isMounted) return;
        const inpValue = metric.value;
        const rating = getRating(inpValue);
        const {
          threshold = 200,
          debug = process.env.NODE_ENV === "development",
          detectIssues = true,
          minInteractionLatency = 40,
        } = optionsRef.current;

        // Process entries from the metric
        const metricEntries = metric.entries || [];

        // Find the entry with the longest duration (the INP entry)
        const inpEntry = metricEntries.reduce<PerformanceEventTiming | null>(
          (longest, entry) => {
            const eventEntry = entry as PerformanceEventTiming;
            if (!longest || eventEntry.duration > longest.duration) {
              return eventEntry;
            }
            return longest;
          },
          null
        );

        if (inpEntry) {
          // Calculate phase breakdown
          const phases: INPPhaseBreakdown = {
            inputDelay: inpEntry.processingStart - inpEntry.startTime,
            processingDuration: inpEntry.processingEnd - inpEntry.processingStart,
            presentationDelay: inpEntry.duration - (inpEntry.processingEnd - inpEntry.startTime),
          };

          // Get target element selector
          let targetSelector: string | null = null;
          if (inpEntry.target && inpEntry.target instanceof Element) {
            targetSelector = getElementSelector(inpEntry.target);
          }

          // Determine interaction type
          let interactionType: INPInteractionType = "click";
          const eventName = inpEntry.name?.toLowerCase() || "";
          if (eventName.includes("key")) {
            interactionType = "keypress";
          } else if (eventName.includes("pointer") || eventName.includes("touch")) {
            interactionType = "tap";
          }

          // Create interaction record
          const interaction: INPInteraction = {
            id: `${inpEntry.startTime}-${Date.now()}`,
            type: interactionType,
            latency: inpEntry.duration,
            rating: getRating(inpEntry.duration),
            target: targetSelector,
            startTime: inpEntry.startTime,
            phases,
            scripts: [], // Will be populated by LoAF if available
            longestEventType: inpEntry.name,
          };

          // Track interaction if above minimum threshold
          if (interaction.latency >= minInteractionLatency) {
            interactionsRef.current = [...interactionsRef.current, interaction];
            optionsRef.current.onInteraction?.(interaction);
          }

          // Detect issues if enabled
        if (detectIssues && interaction.latency > threshold) {
          const issueType = detectIssueType(interaction);
            if (issueType) {
              const newIssue: INPIssue = {
                type: issueType,
                element: targetSelector,
                contribution: interaction.latency,
                phase: phases.inputDelay > phases.processingDuration
                  ? "input-delay"
                  : phases.processingDuration > phases.presentationDelay
                    ? "processing"
                    : "presentation",
                suggestion: getSuggestionForIssue(issueType, targetSelector),
                timestamp: interaction.startTime,
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
          }
        }

        // Calculate statistics
        const allInteractions = interactionsRef.current;
        const interactionCount = allInteractions.length;
        const slowInteractionCount = allInteractions.filter(
          (i) => i.latency > threshold
        ).length;
        const totalLatency = allInteractions.reduce(
          (sum, i) => sum + i.latency,
          0
        );
        const averageLatency = interactionCount > 0
          ? totalLatency / interactionCount
          : null;
        const goodCount = allInteractions.filter(
          (i) => i.latency <= 200
        ).length;
        const goodInteractionPercentage = interactionCount > 0
          ? (goodCount / interactionCount) * 100
          : 100;

        // Count by type
        const interactionsByType = {
          click: allInteractions.filter((i) => i.type === "click").length,
          keypress: allInteractions.filter((i) => i.type === "keypress").length,
          tap: allInteractions.filter((i) => i.type === "tap").length,
        };

        // Find slowest interaction
        const slowestInteraction = allInteractions.reduce<INPInteraction | null>(
          (slowest, interaction) =>
            !slowest || interaction.latency > slowest.latency ? interaction : slowest,
          null
        );

        // Warn in development if INP exceeds threshold
        if (debug && inpValue > threshold && !hasWarnedRef.current) {
          console.warn(
            `[@page-speed/hooks] INP (${inpValue.toFixed(0)}ms) exceeds threshold (${threshold}ms). ` +
              `See: https://web.dev/inp/`
          );

          if (slowestInteraction) {
            console.warn(
              `[@page-speed/hooks] Slowest interaction target:`,
              slowestInteraction.target
            );
            console.warn(
              `[@page-speed/hooks] Phase breakdown: ` +
                `Input Delay: ${slowestInteraction.phases.inputDelay.toFixed(0)}ms, ` +
                `Processing: ${slowestInteraction.phases.processingDuration.toFixed(0)}ms, ` +
                `Presentation: ${slowestInteraction.phases.presentationDelay.toFixed(0)}ms`
            );
          }

          hasWarnedRef.current = true;
        }

        // Update state
        if (isMounted) {
          setState({
            inp: inpValue,
            rating,
            isLoading: false,
            interactions: allInteractions,
            slowestInteraction,
            slowestPhases: slowestInteraction?.phases || null,
            issues: issuesRef.current,
            interactionCount,
            slowInteractionCount,
            averageLatency,
            goodInteractionPercentage,
            interactionsByType,
            topSlowScripts: calculateTopSlowScripts(),
          });
          optionsRef.current.onMeasure?.(inpValue, rating);
        }
      },
      { reportAllChanges }
    );

    // No cleanup needed for onINP (web-vitals handles it)
    return () => {
      isMounted = false;
    };
  }, [
    getRating,
    getElementSelector,
    detectIssueType,
    getSuggestionForIssue,
    calculateTopSlowScripts,
  ]);

  // Memoize utils to prevent unnecessary re-renders
  const utils = useMemo(
    () => ({
      getElementSelector,
      isThirdPartyScript,
      getSuggestions,
      reset,
      recordInteraction,
    }),
    [getElementSelector, isThirdPartyScript, getSuggestions, reset, recordInteraction]
  );

  return {
    ...state,
    utils,
  };
}
