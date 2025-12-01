/**
 * @page-speed/hooks
 *
 * Performance-optimized React hooks for Core Web Vitals, responsive images,
 * lazy loading, and resource management. Drop-in implementations of web.dev
 * best practices with zero configuration.
 *
 * @see https://github.com/opensite-ai/page-speed-hooks
 */

// Web Vitals
export { useWebVitals, useLCP, useCLS, useINP } from "./web-vitals";
export type {
  Metric,
  WebVitalsOptions,
  WebVitalsState,
  LCPOptions,
  LCPState,
  CLSOptions,
  CLSState,
  LayoutShiftEntry,
  LayoutShiftAttribution,
  CLSSessionWindow,
  CLSIssue,
  INPOptions,
  INPState,
  INPInteraction,
  INPPhaseBreakdown,
  INPScriptAttribution,
  INPIssue,
  INPIssueType,
  INPInteractionType,
} from "./web-vitals";

// Media Optimization
export { useOptimizedImage } from "./media";
export type {
  UseOptimizedImageOptions,
  UseOptimizedImageState,
  SrcsetByFormat,
  ImageFormat,
} from "./media";

// Resource Management
export { useDeferredMount } from "./resources";
export type { UseDeferredMountOptions } from "./resources";
