/**
 * Web Vitals metric types and interfaces
 * Based on web.dev Core Web Vitals standards
 */

export interface Metric {
  /** Metric name (e.g., 'LCP', 'CLS', 'INP') */
  name: "LCP" | "CLS" | "INP" | "FCP" | "TTFB";

  /** Current metric value */
  value: number;

  /** Rating: 'good', 'needs-improvement', or 'poor' */
  rating: "good" | "needs-improvement" | "poor";

  /** Navigation type */
  navigationType:
    | "navigate"
    | "reload"
    | "back-forward"
    | "back-forward-cache"
    | "prerender"
    | "restore";

  /** Unique ID for this metric instance */
  id: string;

  /** Metric entries (PerformanceEntry objects) */
  entries: PerformanceEntry[];
}

export interface WebVitalsOptions {
  /** Callback when LCP is measured */
  onLCP?: (metric: Metric) => void;

  /** Callback when CLS is measured */
  onCLS?: (metric: Metric) => void;

  /** Callback when INP is measured */
  onINP?: (metric: Metric) => void;

  /** Callback when FCP is measured */
  onFCP?: (metric: Metric) => void;

  /** Callback when TTFB is measured */
  onTTFB?: (metric: Metric) => void;

  /** Report all changes (not just final values) */
  reportAllChanges?: boolean;
}

export interface WebVitalsState {
  /** Largest Contentful Paint */
  lcp: number | null;

  /** Cumulative Layout Shift */
  cls: number | null;

  /** Interaction to Next Paint */
  inp: number | null;

  /** First Contentful Paint */
  fcp: number | null;

  /** Time to First Byte */
  ttfb: number | null;

  /** Whether vitals are loading */
  isLoading: boolean;
}

export interface LCPOptions {
  /** Target LCP threshold in milliseconds */
  threshold?: number;

  /** Callback when LCP is measured */
  onMeasure?: (
    value: number,
    rating: "good" | "needs-improvement" | "poor"
  ) => void;

  /** Report all changes */
  reportAllChanges?: boolean;
}

export interface LCPState {
  /** Current LCP value in milliseconds */
  lcp: number | null;

  /** LCP rating based on web.dev thresholds */
  rating: "good" | "needs-improvement" | "poor" | null;

  /** Whether this element is likely the LCP */
  isLCP: boolean;

  /** Whether measurement is in progress */
  isLoading: boolean;
}
