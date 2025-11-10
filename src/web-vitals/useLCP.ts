"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { onLCP } from "web-vitals";
import type { LCPOptions, LCPState } from "./types";

/**
 * useLCP
 *
 * Optimizes for Largest Contentful Paint (LCP) by tracking and improving the
 * LCP element's loading performance. Automatically sets `fetchpriority="high"`
 * for likely LCP elements.
 *
 * LCP Thresholds (web.dev):
 * - Good: < 2.5s
 * - Needs Improvement: 2.5s - 4.0s
 * - Poor: > 4.0s
 *
 * @see https://web.dev/lcp/
 *
 * @example
 * ```tsx
 * function Hero() {
 *   const { ref, fetchPriority, lcp, rating } = useLCP({
 *     threshold: 2500,
 *     onMeasure: (value, rating) => {
 *       console.log(`LCP: ${value}ms (${rating})`)
 *     }
 *   })
 *
 *   return (
 *     <img
 *       ref={ref}
 *       fetchPriority={fetchPriority}
 *       src="/hero.jpg"
 *       alt="Hero"
 *     />
 *   )
 * }
 * ```
 */
export function useLCP(options: LCPOptions = {}) {
  const { threshold = 2500, reportAllChanges = false } = options;
  const hasWarnedRef = useRef(false);

  const [state, setState] = useState<LCPState>({
    lcp: null,
    rating: null,
    isLCP: false,
    isLoading: true,
  });

  const elementRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Calculate rating based on web.dev thresholds
  const getRating = useCallback(
    (value: number): "good" | "needs-improvement" | "poor" => {
      if (value <= 2500) return "good";
      if (value <= 4000) return "needs-improvement";
      return "poor";
    },
    []
  );

  useEffect(() => {
    // Skip if not in browser
    if (typeof window === "undefined") {
      return;
    }

    // Track LCP metric
    onLCP(
      (metric) => {
        const lcpValue = metric.value;
        const rating = getRating(lcpValue);

        setState((prev) => ({
          ...prev,
          lcp: lcpValue,
          rating,
          isLoading: false,
        }));

        // ✅ ADD THIS: Warn in dev if LCP exceeds threshold
        if (
          process.env.NODE_ENV === "development" &&
          lcpValue > threshold &&
          !hasWarnedRef.current
        ) {
          console.warn(
            `[@page-speed/hooks] LCP (${lcpValue.toFixed(
              0
            )}ms) exceeds threshold (${threshold}ms). ` +
              `Consider optimizing your LCP element. See: https://web.dev/lcp/`
          );
          hasWarnedRef.current = true;
        }

        options.onMeasure?.(lcpValue, rating);
      },
      { reportAllChanges }
    );

    // Observe if the referenced element is in viewport (likely to be LCP)
    if (elementRef.current) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setState((prev) => ({ ...prev, isLCP: true }));
          }
        },
        { threshold: 0.1 }
      );

      observerRef.current.observe(elementRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [options, reportAllChanges, getRating, threshold]);

  // Ref callback to attach to the element
  const ref = useCallback((node: HTMLElement | null) => {
    if (elementRef.current) {
      observerRef.current?.unobserve(elementRef.current);
    }

    elementRef.current = node;

    if (node && observerRef.current) {
      observerRef.current.observe(node);
    }
  }, []);

  // Determine fetch priority
  // If element is above fold and likely LCP, use high priority
  const fetchPriority = state.isLCP ? "high" : undefined;

  return {
    ref,
    fetchPriority,
    lcp: state.lcp,
    rating: state.rating,
    isLCP: state.isLCP,
    isLoading: state.isLoading,
  } as const;
}
