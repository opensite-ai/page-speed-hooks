![Page Speed React Hooks](https://github.com/user-attachments/assets/dadfdfb0-fe28-4e9c-9576-5c5213616d82)

---

# ⚡ @page-speed/hooks
  
**Performance-optimized React hooks for Core Web Vitals, responsive images, lazy loading, and resource management.**

Drop-in implementations of [web.dev](https://web.dev) best practices with zero configuration.

[![npm version](https://img.shields.io/npm/v/@page-speed/hooks?style=flat-square)](https://www.npmjs.com/package/@page-speed/hooks)
[![npm downloads](https://img.shields.io/npm/dm/@page-speed/hooks?style=flat-square)](https://www.npmjs.com/package/@page-speed/hooks)
[![License](https://img.shields.io/npm/l/@page-speed/hooks?style=flat-square)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square)](./tsconfig.json)
[![Tree-Shakeable](https://img.shields.io/badge/Tree%20Shakeable-Yes-brightgreen?style=flat-square)](#tree-shaking)

[Documentation](#documentation) · [Quick Start](#quick-start) · [Hooks](#hooks) · [Examples](#examples) · [Contributing](./CONTRIBUTING.md)

---

## Why @page-speed/hooks?

Web.dev provides excellent guidance on optimizing Core Web Vitals, but implementing those recommendations requires boilerplate code and careful attention to performance details. **@page-speed/hooks eliminates that gap.**

Our hooks are:

- ✅ **Zero Configuration** - Works out of the box with sensible defaults
- ✅ **Tree-Shakeable** - Only bundle what you use (~2-3 KB per hook)
- ✅ **TypeScript-First** - Complete type definitions and JSDoc
- ✅ **web.dev Aligned** - Implements official best practices exactly
- ✅ **Production Ready** - Used internally at OpenSite for performance-critical applications
- ✅ **Framework Agnostic** - Core logic works in any React environment (Next.js, Remix, etc.)
- ✅ **SSR Compatible** - Works seamlessly with server-side rendering

---

## Quick Start

### Installation

```bash
npm install @page-speed/hooks
# or
pnpm add @page-speed/hooks
# or
yarn add @page-speed/hooks
```

### Basic Usage

```tsx
import { useWebVitals } from "@page-speed/hooks";

function App() {
  const vitals = useWebVitals({
    onLCP: (metric) => analytics.track("LCP", metric.value),
    onCLS: (metric) => analytics.track("CLS", metric.value),
    reportAllChanges: true,
  });

  return (
    <div>
      <p>LCP: {vitals.lcp ? `${vitals.lcp.toFixed(0)}ms` : "Measuring..."}</p>
      <p>CLS: {vitals.cls ? vitals.cls.toFixed(3) : "Measuring..."}</p>
      <p>INP: {vitals.inp ? `${vitals.inp.toFixed(0)}ms` : "Measuring..."}</p>
    </div>
  );
}
```

---

## Hooks

### 📊 Web Vitals Tracking

#### `useWebVitals(options?)`

Tracks all Core Web Vitals metrics (LCP, CLS, INP) plus additional metrics (FCP, TTFB).

```tsx
import { useWebVitals } from "@page-speed/hooks";

function App() {
  const vitals = useWebVitals({
    onLCP: (metric) => console.log("LCP:", metric.value),
    onCLS: (metric) => console.log("CLS:", metric.value),
    onINP: (metric) => console.log("INP:", metric.value),
    reportAllChanges: true,
  });

  return (
    <div>
      <h1>Core Web Vitals</h1>
      <ul>
        <li>LCP: {vitals.lcp ? `${vitals.lcp.toFixed(0)}ms` : "—"}</li>
        <li>CLS: {vitals.cls ? vitals.cls.toFixed(3) : "—"}</li>
        <li>INP: {vitals.inp ? `${vitals.inp.toFixed(0)}ms` : "—"}</li>
      </ul>
    </div>
  );
}
```

**Options:**

- `onLCP?: (metric) => void` - Called when LCP is measured
- `onCLS?: (metric) => void` - Called when CLS is measured
- `onINP?: (metric) => void` - Called when INP is measured
- `onFCP?: (metric) => void` - Called when FCP is measured
- `onTTFB?: (metric) => void` - Called when TTFB is measured
- `reportAllChanges?: boolean` - Report all changes, not just final values

**Returns:**

```typescript
{
  lcp: number | null; // Largest Contentful Paint (ms)
  cls: number | null; // Cumulative Layout Shift (unitless)
  inp: number | null; // Interaction to Next Paint (ms)
  fcp: number | null; // First Contentful Paint (ms)
  ttfb: number | null; // Time to First Byte (ms)
  isLoading: boolean; // Measurements in progress
}
```

**Web.dev References:**

- [LCP - Largest Contentful Paint](https://web.dev/lcp/)
- [CLS - Cumulative Layout Shift](https://web.dev/cls/)
- [INP - Interaction to Next Paint](https://web.dev/inp/)

---

#### `useLCP(options?)`

Optimizes Largest Contentful Paint by tracking the LCP element and automatically setting `fetchpriority="high"` for likely LCP images.

```tsx
import { useLCP } from "@page-speed/hooks";

function Hero() {
  const { ref, fetchPriority, lcp, rating } = useLCP({
    threshold: 2500,
    onMeasure: (value, rating) => {
      console.log(`LCP: ${value}ms (${rating})`);
    },
  });

  return (
    <img
      ref={ref}
      fetchPriority={fetchPriority}
      src="/hero.jpg"
      alt="Hero"
      width={1200}
      height={600}
    />
  );
}
```

**Options:**

- `threshold?: number` - Target LCP in milliseconds (default: 2500)
- `onMeasure?: (value, rating) => void` - Called when LCP is measured
- `reportAllChanges?: boolean` - Report all changes

**Returns:**

```typescript
{
  ref: (node) => void                      // Attach to element
  fetchPriority: 'high' | undefined        // Suggested fetch priority
  lcp: number | null                       // Current LCP (ms)
  rating: 'good' | 'needs-improvement' | 'poor' | null
  isLCP: boolean                           // Element is likely LCP
  isLoading: boolean                       // Measurement in progress
}
```

**LCP Thresholds (web.dev):**

- **Good:** ≤ 2.5s
- **Needs Improvement:** 2.5s - 4.0s
- **Poor:** > 4.0s

**Web.dev Reference:** [Optimize LCP](https://web.dev/lcp/)

---

#### `useCLS(options?)`

Comprehensive hook for tracking, analyzing, and optimizing Cumulative Layout Shift (CLS). Provides real-time measurement, layout shift attribution, automatic issue detection, and optimization utilities.

```tsx
import { useCLS } from "@page-speed/hooks";

function App() {
  const { cls, rating, entries, issues, largestShift, utils } = useCLS({
    threshold: 0.1,
    onMeasure: (value, rating) => {
      console.log(`CLS: ${value.toFixed(3)} (${rating})`);
    },
    onIssue: (issue) => {
      console.warn("CLS Issue:", issue.type, issue.suggestion);
    },
  });

  return (
    <div>
      <p>CLS: {cls?.toFixed(3) ?? "Measuring..."}</p>
      <p>Rating: {rating}</p>
      <p>Layout Shifts: {entries.length}</p>
    </div>
  );
}
```

**Options:**

- `threshold?: number` - Target CLS threshold (default: 0.1)
- `onMeasure?: (value, rating) => void` - Called when CLS is measured
- `onShift?: (entry) => void` - Called on each layout shift
- `onIssue?: (issue) => void` - Called when optimization opportunity detected
- `reportAllChanges?: boolean` - Report all changes (default: false)
- `debug?: boolean` - Enable console warnings (default: true in development)
- `detectIssues?: boolean` - Enable automatic issue detection (default: true)
- `trackAttribution?: boolean` - Track which elements shifted (default: true)

**Returns:**

```typescript
{
  cls: number | null;                    // Current CLS value
  rating: 'good' | 'needs-improvement' | 'poor' | null;
  isLoading: boolean;                    // Measurement in progress
  entries: LayoutShiftEntry[];           // Individual shift entries
  largestShift: LayoutShiftEntry | null; // Biggest contributor
  sessionWindows: CLSSessionWindow[];    // Grouped shift windows
  largestSessionWindow: CLSSessionWindow | null;
  issues: CLSIssue[];                    // Detected optimization opportunities
  shiftCount: number;                    // Total shifts detected
  hasPostInteractionShifts: boolean;     // Shifts after user interaction
  utils: {
    getElementSelector: (element) => string | null;
    hasExplicitDimensions: (element) => boolean;
    getAspectRatio: (width, height) => { ratio: string; decimal: number };
    reset: () => void;
  };
}
```

**CLS Thresholds (web.dev):**

- **Good:** ≤ 0.1
- **Needs Improvement:** 0.1 - 0.25
- **Poor:** > 0.25

**Web.dev Reference:** [Optimize CLS](https://web.dev/cls/)

---

##### CLS Use Cases

###### Basic CLS Monitoring

Track CLS and send to analytics:

```tsx
import { useCLS } from "@page-speed/hooks";

function PerformanceMonitor() {
  useCLS({
    onMeasure: (value, rating) => {
      // Send to your analytics service
      analytics.track("CLS", {
        value,
        rating,
        page: window.location.pathname,
      });
    },
  });

  return null; // Invisible monitoring component
}
```

###### Real-time CLS Dashboard

Display live CLS metrics in development:

```tsx
import { useCLS } from "@page-speed/hooks";

function CLSDashboard() {
  const { cls, rating, shiftCount, largestShift, issues } = useCLS({
    reportAllChanges: true,
  });

  return (
    <div className="cls-dashboard">
      <h3>CLS Monitor</h3>
      <div className={`metric ${rating}`}>
        <span>CLS Score:</span>
        <strong>{cls?.toFixed(4) ?? "—"}</strong>
      </div>
      <p>Total Shifts: {shiftCount}</p>

      {largestShift && (
        <div>
          <h4>Largest Shift</h4>
          <p>Value: {largestShift.value.toFixed(4)}</p>
          <p>Elements: {largestShift.sources.map((s) => s.node).join(", ")}</p>
        </div>
      )}

      {issues.length > 0 && (
        <div>
          <h4>Optimization Opportunities</h4>
          <ul>
            {issues.map((issue, i) => (
              <li key={i}>
                <strong>{issue.type}</strong>: {issue.suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

###### Detecting Images Without Dimensions

Automatically find images causing CLS:

```tsx
import { useCLS } from "@page-speed/hooks";

function ImageAudit() {
  const { issues, utils } = useCLS({
    detectIssues: true,
    onIssue: (issue) => {
      if (issue.type === "image-without-dimensions") {
        console.error(
          `🖼️ Image missing dimensions: ${issue.element}\n` +
            `Suggestion: ${issue.suggestion}`
        );
      }
    },
  });

  // Find all images and check dimensions
  const auditImages = () => {
    document.querySelectorAll("img").forEach((img) => {
      if (!utils.hasExplicitDimensions(img)) {
        const { ratio } = utils.getAspectRatio(
          img.naturalWidth,
          img.naturalHeight
        );
        console.warn(
          `Image needs dimensions: ${utils.getElementSelector(img)}\n` +
            `Add: width="${img.naturalWidth}" height="${img.naturalHeight}"\n` +
            `Or CSS: aspect-ratio: ${ratio};`
        );
      }
    });
  };

  return <button onClick={auditImages}>Audit Images</button>;
}
```

###### Font Loading CLS Prevention

Monitor and optimize web font shifts:

```tsx
import { useCLS } from "@page-speed/hooks";

function FontLoadingMonitor() {
  const { issues } = useCLS({
    onIssue: (issue) => {
      if (issue.type === "web-font-shift") {
        console.warn(
          "Font-related layout shift detected!\n" +
            "Consider:\n" +
            "1. Preload critical fonts: <link rel='preload' href='font.woff2' as='font'>\n" +
            "2. Use font-display: optional\n" +
            "3. Match fallback font metrics with size-adjust"
        );
      }
    },
  });

  const fontIssues = issues.filter((i) => i.type === "web-font-shift");

  return fontIssues.length > 0 ? (
    <div className="warning">
      ⚠️ {fontIssues.length} font-related layout shifts detected
    </div>
  ) : null;
}
```

###### Ad Container Space Reservation

Prevent ad-related CLS:

```tsx
import { useCLS } from "@page-speed/hooks";

function AdContainer({ slotId, minHeight = 250 }) {
  const { issues } = useCLS({
    onIssue: (issue) => {
      if (
        issue.type === "ad-embed-shift" &&
        issue.element?.includes(slotId)
      ) {
        console.warn(`Ad slot ${slotId} caused layout shift of ${issue.contribution}`);
      }
    },
  });

  return (
    <div
      id={slotId}
      style={{
        minHeight: `${minHeight}px`,
        width: "100%",
        backgroundColor: "#f0f0f0",
      }}
    >
      {/* Ad loads here */}
    </div>
  );
}
```

###### SPA Navigation CLS Reset

Reset CLS tracking on route changes:

```tsx
import { useCLS } from "@page-speed/hooks";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function SPACLSTracker() {
  const location = useLocation();
  const { cls, rating, utils } = useCLS({
    onMeasure: (value, rating) => {
      analytics.track("CLS", {
        value,
        rating,
        route: location.pathname,
      });
    },
  });

  // Reset CLS tracking on route change
  useEffect(() => {
    utils.reset();
  }, [location.pathname, utils]);

  return null;
}
```

###### Conditional Rendering with Skeleton

Prevent CLS with skeleton screens:

```tsx
import { useCLS } from "@page-speed/hooks";
import { useState, useEffect } from "react";

function ProductCard({ productId }) {
  const [product, setProduct] = useState(null);
  const { utils } = useCLS();

  useEffect(() => {
    fetchProduct(productId).then(setProduct);
  }, [productId]);

  // Skeleton maintains layout while loading
  if (!product) {
    return (
      <div style={{ aspectRatio: "4 / 3", minHeight: "200px" }}>
        <div className="skeleton-image" style={{ height: "150px" }} />
        <div className="skeleton-text" style={{ height: "20px", marginTop: "10px" }} />
        <div className="skeleton-text" style={{ height: "16px", marginTop: "8px" }} />
      </div>
    );
  }

  // Calculate recommended aspect ratio
  const { ratio } = utils.getAspectRatio(product.imageWidth, product.imageHeight);

  return (
    <div>
      <img
        src={product.image}
        alt={product.name}
        width={product.imageWidth}
        height={product.imageHeight}
        style={{ aspectRatio: ratio }}
      />
      <h3>{product.name}</h3>
      <p>{product.description}</p>
    </div>
  );
}
```

###### Animation Shift Detection

Detect animations causing CLS:

```tsx
import { useCLS } from "@page-speed/hooks";

function AnimationMonitor() {
  const { issues } = useCLS({
    onIssue: (issue) => {
      if (issue.type === "animation-shift") {
        console.warn(
          `Animation causing layout shift on ${issue.element}\n` +
            "Fix: Use transform-based animations instead of top/left/width/height\n" +
            "Bad:  animation: slide { from { left: 0 } to { left: 100px } }\n" +
            "Good: animation: slide { from { transform: translateX(0) } to { transform: translateX(100px) } }"
        );
      }
    },
  });

  return null;
}
```

###### Complete CLS Optimization Component

Full-featured CLS monitoring and reporting:

```tsx
import { useCLS } from "@page-speed/hooks";
import { useCallback } from "react";

function CLSOptimizer({ onReport }) {
  const {
    cls,
    rating,
    entries,
    issues,
    largestShift,
    sessionWindows,
    shiftCount,
    utils,
  } = useCLS({
    threshold: 0.1,
    reportAllChanges: true,
    onMeasure: (value, rating) => {
      if (rating === "poor") {
        console.error(`Poor CLS detected: ${value.toFixed(3)}`);
      }
    },
    onShift: (entry) => {
      if (entry.value > 0.05) {
        console.warn("Significant layout shift:", entry.sources);
      }
    },
    onIssue: (issue) => {
      console.info(`CLS Issue [${issue.type}]:`, issue.suggestion);
    },
  });

  const generateReport = useCallback(() => {
    const report = {
      score: cls,
      rating,
      totalShifts: shiftCount,
      largestShiftValue: largestShift?.value,
      largestShiftElements: largestShift?.sources.map((s) => s.node),
      sessionWindowCount: sessionWindows.length,
      issues: issues.map((i) => ({
        type: i.type,
        element: i.element,
        contribution: i.contribution,
        suggestion: i.suggestion,
      })),
      recommendations: issues.map((i) => i.suggestion),
    };

    onReport?.(report);
    return report;
  }, [cls, rating, shiftCount, largestShift, sessionWindows, issues, onReport]);

  return (
    <div className="cls-optimizer">
      <div className={`cls-score cls-${rating}`}>
        <span>CLS</span>
        <strong>{cls?.toFixed(3) ?? "..."}</strong>
        <span className="rating">{rating}</span>
      </div>

      <button onClick={generateReport}>Generate Report</button>

      {issues.length > 0 && (
        <details>
          <summary>
            {issues.length} Optimization{issues.length > 1 ? "s" : ""} Available
          </summary>
          <ul>
            {issues.map((issue, i) => (
              <li key={i}>
                <code>{issue.type}</code>
                <p>{issue.suggestion}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
```

---

#### `useINP(options?)`

Comprehensive hook for tracking, analyzing, and optimizing Interaction to Next Paint (INP). Provides real-time measurement, phase breakdown analysis, issue detection, and optimization utilities.

```tsx
import { useINP } from "@page-speed/hooks";

function App() {
  const { inp, rating, slowestInteraction, issues, utils } = useINP({
    threshold: 200,
    onMeasure: (value, rating) => {
      console.log(`INP: ${value}ms (${rating})`);
    },
    onIssue: (issue) => {
      console.warn("INP Issue:", issue.type, issue.suggestion);
    },
  });

  return (
    <div>
      <p>INP: {inp ? `${inp.toFixed(0)}ms` : "Measuring..."}</p>
      <p>Rating: {rating}</p>
      {slowestInteraction && (
        <div>
          <p>Slowest interaction: {slowestInteraction.target}</p>
          <p>Input Delay: {slowestInteraction.phases.inputDelay.toFixed(0)}ms</p>
          <p>Processing: {slowestInteraction.phases.processingDuration.toFixed(0)}ms</p>
          <p>Presentation: {slowestInteraction.phases.presentationDelay.toFixed(0)}ms</p>
        </div>
      )}
    </div>
  );
}
```

**Options:**

- `threshold?: number` - Target INP in milliseconds (default: 200)
- `onMeasure?: (value, rating) => void` - Called when INP is measured
- `onInteraction?: (interaction) => void` - Called on each interaction
- `onIssue?: (issue) => void` - Called when optimization opportunity detected
- `reportAllChanges?: boolean` - Report all interactions (default: false)
- `debug?: boolean` - Enable console warnings (default: true in development)
- `detectIssues?: boolean` - Enable automatic issue detection (default: true)
- `trackAttribution?: boolean` - Track interaction attribution (default: true)

**Returns:**

```typescript
{
  inp: number | null;                           // Current INP (ms)
  rating: 'good' | 'needs-improvement' | 'poor' | null;
  isLoading: boolean;                           // Measurement in progress
  interactions: INPInteraction[];               // All tracked interactions
  slowestInteraction: INPInteraction | null;    // Worst interaction
  slowestPhases: INPPhaseBreakdown | null;      // Phase breakdown of slowest
  issues: INPIssue[];                           // Detected optimization opportunities
  interactionCount: number;                     // Total interactions
  slowInteractionCount: number;                 // Interactions exceeding threshold
  averageLatency: number | null;                // Average across all interactions
  goodInteractionPercentage: number;            // % rated "good"
  interactionsByType: { click, keypress, tap }; // Distribution by type
  utils: {
    getElementSelector: (element) => string | null;
    isThirdPartyScript: (url) => boolean;
    getSuggestions: (interaction) => string[];
    reset: () => void;
    recordInteraction: (latency, target?, type?) => void;
  };
}
```

**INP Thresholds (web.dev):**

- **Good:** ≤ 200ms
- **Needs Improvement:** 200ms - 500ms
- **Poor:** > 500ms

**Web.dev Reference:** [Optimize INP](https://web.dev/inp/)

---

##### INP Use Cases

###### Basic INP Monitoring

Track INP and send to analytics:

```tsx
import { useINP } from "@page-speed/hooks";

function PerformanceMonitor() {
  useINP({
    onMeasure: (value, rating) => {
      // Send to your analytics service
      analytics.track("INP", {
        value,
        rating,
        page: window.location.pathname,
      });
    },
  });

  return null; // Invisible monitoring component
}
```

###### Real-time INP Dashboard

Display live INP metrics in development:

```tsx
import { useINP } from "@page-speed/hooks";

function INPDashboard() {
  const {
    inp,
    rating,
    interactionCount,
    slowestInteraction,
    slowestPhases,
    issues,
  } = useINP({
    reportAllChanges: true,
  });

  return (
    <div className="inp-dashboard">
      <h3>INP Monitor</h3>
      <div className={`metric ${rating}`}>
        <span>INP Score:</span>
        <strong>{inp ? `${inp.toFixed(0)}ms` : "—"}</strong>
      </div>
      <p>Total Interactions: {interactionCount}</p>

      {slowestInteraction && slowestPhases && (
        <div>
          <h4>Slowest Interaction</h4>
          <p>Target: {slowestInteraction.target}</p>
          <p>Type: {slowestInteraction.type}</p>
          <ul>
            <li>Input Delay: {slowestPhases.inputDelay.toFixed(0)}ms</li>
            <li>Processing: {slowestPhases.processingDuration.toFixed(0)}ms</li>
            <li>Presentation: {slowestPhases.presentationDelay.toFixed(0)}ms</li>
          </ul>
        </div>
      )}

      {issues.length > 0 && (
        <div>
          <h4>Optimization Opportunities</h4>
          <ul>
            {issues.map((issue, i) => (
              <li key={i}>
                <strong>{issue.type}</strong>: {issue.suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

###### Phase Breakdown Analysis

Identify which phase of interaction is causing slowness:

```tsx
import { useINP } from "@page-speed/hooks";

function INPPhaseAnalyzer() {
  const { slowestInteraction, slowestPhases, utils } = useINP({
    onInteraction: (interaction) => {
      const { phases } = interaction;

      // Determine the bottleneck phase
      if (phases.inputDelay > 50) {
        console.warn(
          `High input delay (${phases.inputDelay.toFixed(0)}ms) on ${interaction.target}.\n` +
          "The main thread was busy. Consider:\n" +
          "- Breaking up long tasks with scheduler.yield()\n" +
          "- Using requestIdleCallback for non-critical work\n" +
          "- Code splitting to reduce JavaScript on page load"
        );
      }

      if (phases.processingDuration > 100) {
        console.warn(
          `Slow event handler (${phases.processingDuration.toFixed(0)}ms) on ${interaction.target}.\n` +
          "Consider:\n" +
          "- Debouncing/throttling event handlers\n" +
          "- Moving heavy computation to web workers\n" +
          "- Deferring non-visual work with setTimeout"
        );
      }

      if (phases.presentationDelay > 50) {
        console.warn(
          `High presentation delay (${phases.presentationDelay.toFixed(0)}ms) on ${interaction.target}.\n` +
          "Consider:\n" +
          "- Reducing DOM size\n" +
          "- Using content-visibility: auto for off-screen content\n" +
          "- Simplifying CSS selectors"
        );
      }
    },
  });

  return null;
}
```

###### Third-Party Script Impact Detection

Identify third-party scripts affecting INP:

```tsx
import { useINP } from "@page-speed/hooks";

function ThirdPartyMonitor() {
  const { topSlowScripts, utils } = useINP({
    trackAttribution: true,
    onIssue: (issue) => {
      if (issue.type === "third-party-script") {
        console.warn(
          `Third-party script impacting INP:\n` +
          `Script: ${issue.scriptURL}\n` +
          `Impact: ${issue.contribution.toFixed(0)}ms\n` +
          `Suggestion: ${issue.suggestion}`
        );
      }
    },
  });

  // Display scripts causing slow interactions
  return topSlowScripts.length > 0 ? (
    <div className="warning">
      <h4>Scripts Impacting Responsiveness</h4>
      <ul>
        {topSlowScripts.map((script, i) => (
          <li key={i}>
            <code>{script.url}</code>
            <span>Total: {script.totalDuration.toFixed(0)}ms</span>
            <span>({script.occurrences} occurrences)</span>
            {script.isThirdParty && <span className="badge">3rd Party</span>}
          </li>
        ))}
      </ul>
    </div>
  ) : null;
}
```

###### SPA Navigation INP Reset

Reset INP tracking on route changes:

```tsx
import { useINP } from "@page-speed/hooks";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function SPAINPTracker() {
  const location = useLocation();
  const { inp, rating, utils } = useINP({
    onMeasure: (value, rating) => {
      analytics.track("INP", {
        value,
        rating,
        route: location.pathname,
      });
    },
  });

  // Reset INP tracking on route change
  useEffect(() => {
    utils.reset();
  }, [location.pathname, utils]);

  return null;
}
```

###### Complete INP Optimization Component

Full-featured INP monitoring and reporting:

```tsx
import { useINP } from "@page-speed/hooks";
import { useCallback } from "react";

function INPOptimizer({ onReport }) {
  const {
    inp,
    rating,
    interactions,
    issues,
    slowestInteraction,
    slowestPhases,
    interactionCount,
    slowInteractionCount,
    averageLatency,
    goodInteractionPercentage,
    interactionsByType,
    utils,
  } = useINP({
    threshold: 200,
    reportAllChanges: true,
    onMeasure: (value, rating) => {
      if (rating === "poor") {
        console.error(`Poor INP detected: ${value.toFixed(0)}ms`);
      }
    },
    onInteraction: (interaction) => {
      if (interaction.latency > 500) {
        console.warn("Very slow interaction:", interaction.target);
        console.warn("Suggestions:", utils.getSuggestions(interaction));
      }
    },
    onIssue: (issue) => {
      console.info(`INP Issue [${issue.type}]:`, issue.suggestion);
    },
  });

  const generateReport = useCallback(() => {
    const report = {
      score: inp,
      rating,
      totalInteractions: interactionCount,
      slowInteractions: slowInteractionCount,
      averageLatency,
      goodPercentage: goodInteractionPercentage,
      distribution: interactionsByType,
      slowestTarget: slowestInteraction?.target,
      slowestLatency: slowestInteraction?.latency,
      phases: slowestPhases,
      issues: issues.map((i) => ({
        type: i.type,
        element: i.element,
        contribution: i.contribution,
        suggestion: i.suggestion,
      })),
      recommendations: issues.map((i) => i.suggestion),
    };

    onReport?.(report);
    return report;
  }, [
    inp, rating, interactionCount, slowInteractionCount,
    averageLatency, goodInteractionPercentage, interactionsByType,
    slowestInteraction, slowestPhases, issues, onReport
  ]);

  return (
    <div className="inp-optimizer">
      <div className={`inp-score inp-${rating}`}>
        <span>INP</span>
        <strong>{inp ? `${inp.toFixed(0)}ms` : "..."}</strong>
        <span className="rating">{rating}</span>
      </div>

      <div className="stats">
        <p>Interactions: {interactionCount} ({goodInteractionPercentage.toFixed(0)}% good)</p>
        <p>Average: {averageLatency ? `${averageLatency.toFixed(0)}ms` : "—"}</p>
      </div>

      <button onClick={generateReport}>Generate Report</button>

      {issues.length > 0 && (
        <details>
          <summary>
            {issues.length} Optimization{issues.length > 1 ? "s" : ""} Available
          </summary>
          <ul>
            {issues.map((issue, i) => (
              <li key={i}>
                <code>{issue.type}</code>
                <p>{issue.suggestion}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
```

---

### 🖼️ Media Optimization

#### `useOptimizedImage(options)`

Lazy loads images below the fold with IntersectionObserver, automatically deferring loading until the element is visible. Optionally integrates with **OptixFlow** for automatic image optimization including compression, format conversion, responsive srcset generation, and DPR-aware sizing.

Implements web.dev best practices for:
- **Pixel-perfect sizing** for Lighthouse "Properly size images" audit
- **DPR-aware srcset** with 1x and 2x variants
- **Format negotiation** with AVIF, WebP, and JPEG fallback via `<picture>` element
- **CLS prevention** through explicit dimensions

```tsx
import { useOptimizedImage } from "@page-speed/hooks/media";

function ProductImage() {
  const { ref, src, isLoaded, loading, size } = useOptimizedImage({
    src: "/product.jpg",
    eager: false,
    threshold: 0.1,
    rootMargin: "50px",
  });

  return (
    <img
      ref={ref}
      src={src}
      loading={loading}
      className={isLoaded ? "loaded" : "loading"}
      alt="Product"
      width={size.width}
      height={size.height}
    />
  );
}
```

**With OptixFlow Integration (Recommended):**

Use the `<picture>` element with responsive srcset for optimal Lighthouse scores:

```tsx
import { useOptimizedImage } from "@page-speed/hooks/media";

function OptimizedProductImage() {
  const { ref, src, srcset, sizes, isLoaded, loading, size } = useOptimizedImage({
    src: "https://example.com/product.jpg",
    width: 480,
    height: 300,
    optixFlowConfig: {
      apiKey: "your-optixflow-api-key",
      compressionLevel: 80,
    },
  });

  return (
    <picture>
      {/* Modern formats with responsive srcset */}
      <source srcSet={srcset.avif} sizes={sizes} type="image/avif" />
      <source srcSet={srcset.webp} sizes={sizes} type="image/webp" />
      {/* Fallback with pixel-perfect sizing for Lighthouse */}
      <img
        ref={ref}
        src={src}
        loading={loading}
        className={isLoaded ? "loaded" : "loading"}
        alt="Product"
        width={size.width}
        height={size.height}
        decoding="async"
      />
    </picture>
  );
}
```

**Options:**

- `src: string` - Image source URL (required)
- `eager?: boolean` - Load immediately (default: false)
- `threshold?: number` - IntersectionObserver threshold (default: 0.1)
- `rootMargin?: string` - IntersectionObserver root margin (default: '50px')
- `width?: number` - Explicit width in pixels (overrides detected width)
- `height?: number` - Explicit height in pixels (overrides detected height)
- `optixFlowConfig?: object` - OptixFlow API configuration:
  - `apiKey: string` - Your OptixFlow API key (required to enable)
  - `compressionLevel?: number` - Quality 0-100 (default: 75)
  - `renderedFileType?: 'avif' | 'webp' | 'jpeg' | 'png'` - Primary src format (default: 'jpeg')

**Returns:**

```typescript
{
  ref: (node) => void              // Attach to img element
  src: string                      // Primary src with exact rendered dimensions (Lighthouse-optimized)
  srcset: {                        // Responsive srcset for each format
    avif: string;                  // AVIF srcset with 1x and 2x DPR variants
    webp: string;                  // WebP srcset with 1x and 2x DPR variants
    jpeg: string;                  // JPEG srcset with 1x and 2x DPR variants
  }
  sizes: string                    // Sizes attribute value (e.g., "480px")
  isLoaded: boolean                // Image has loaded
  isInView: boolean                // Element is in viewport
  loading: 'lazy' | 'eager'        // Loading strategy used
  size: { width, height }          // Current rendered dimensions (dynamic)
}
```

**Srcset Format:**

Each format's srcset includes 1x and 2x DPR variants:

```
url?w=480&h=300&f=avif 1x, url?w=960&h=600&f=avif 2x
```

**Best Practices:**

- Use `eager={true}` for above-fold images (hero, header)
- Use `eager={false}` (default) for below-fold images
- Use the `<picture>` element with `srcset` for optimal format negotiation
- Always include `width` and `height` to prevent CLS
- Increase `rootMargin` to preload before user reaches image
- Set `threshold` lower for early loading (0.01) or higher for exact visibility (0.5)
- The `size` property updates dynamically via ResizeObserver as images resize
- Use `decoding="async"` on the `<img>` for better performance

---

### ⚙️ Resource Management

#### `useDeferredMount(options?)`

Defers mounting expensive components until after the page is idle, improving Core Web Vitals and initial load performance.

```tsx
import { useDeferredMount } from "@page-speed/hooks/resources";

function HeavyComponent() {
  const shouldRender = useDeferredMount({
    delay: 100,
    priority: "low",
  });

  if (!shouldRender) {
    return <Skeleton />;
  }

  return <ExpensiveAnalyticsWidget />;
}

export default function Page() {
  return (
    <div>
      <FastAboveTheFold />
      <HeavyComponent /> {/* Won't render until page is idle */}
    </div>
  );
}
```

**Options:**

- `delay?: number` - Additional delay after idle (ms, default: 0)
- `priority?: 'low' | 'high'` - Use requestIdleCallback (default: 'low')

**Returns:** `boolean` - Whether the component should render

**How It Works:**

1. `priority: 'low'` uses `requestIdleCallback` (waits for browser idle time)
2. Adds optional `delay` for extra safety
3. Falls back to `setTimeout` on older browsers
4. Perfect for non-critical features: analytics, chat widgets, ads

**Web.dev Reference:** [Optimize Interaction to Next Paint (INP)](https://web.dev/inp/)

---

## Examples

### Next.js App Router

```tsx
// app/layout.tsx
"use client";

import { useWebVitals } from "@page-speed/hooks";
import { useEffect } from "react";

export default function RootLayout({ children }) {
  useWebVitals({
    onLCP: (metric) => {
      // Send to analytics
      fetch("/api/analytics", {
        method: "POST",
        body: JSON.stringify({ metric: "LCP", value: metric.value }),
      });
    },
    reportAllChanges: true,
  });

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### Remix Loader

```tsx
// app/routes/products.tsx
import { useWebVitals, useOptimizedImage } from "@page-speed/hooks";

export default function Products() {
  const vitals = useWebVitals();
  const { ref, src, isLoaded } = useOptimizedImage({
    src: "/product-image.jpg",
    eager: false,
  });

  return (
    <div>
      <h1>Products</h1>
      <img
        ref={ref}
        src={src}
        alt="Product"
        className={isLoaded ? "visible" : "loading"}
      />
      <p>LCP: {vitals.lcp}ms</p>
    </div>
  );
}
```

### Analytics Integration

```tsx
// hooks/useAnalytics.ts
import { useWebVitals } from "@page-speed/hooks";
import { useCallback } from "react";

export function useAnalytics() {
  const trackVital = useCallback(
    (metricName: string, value: number, rating: string) => {
      // Send to Google Analytics
      if (window.gtag) {
        window.gtag("event", metricName, {
          value: value,
          rating: rating,
          event_category: "web_vitals",
        });
      }

      // Send to custom analytics
      fetch("/api/vitals", {
        method: "POST",
        body: JSON.stringify({ metric: metricName, value, rating }),
      });
    },
    []
  );

  useWebVitals({
    onLCP: (metric) => trackVital("LCP", metric.value, metric.rating),
    onCLS: (metric) => trackVital("CLS", metric.value, metric.rating),
    onINP: (metric) => trackVital("INP", metric.value, metric.rating),
    reportAllChanges: true,
  });
}

// app/layout.tsx
("use client");

import { useAnalytics } from "@/hooks/useAnalytics";

export default function RootLayout({ children }) {
  useAnalytics();
  return children;
}
```

---

## Tree-Shaking

@page-speed/hooks is built for maximum tree-shaking. Import only what you need:

```tsx
// ✅ Good: Import specific hooks
import { useLCP } from "@page-speed/hooks/web-vitals"; // ~2.8 KB
import { useOptimizedImage } from "@page-speed/hooks/media"; // ~2.1 KB

// ✅ Also good: Import from main entry
import { useLCP, useOptimizedImage } from "@page-speed/hooks";

// ❌ Avoid: This imports everything
import * as hooks from "@page-speed/hooks";
```

**Bundle Impact:**

- Full library: ~12 KB gzipped
- `useWebVitals` only: ~3.2 KB gzipped
- `useLCP` only: ~2.8 KB gzipped
- `useOptimizedImage` only: ~2.1 KB gzipped
- `useDeferredMount` only: ~1.4 KB gzipped

---

## Metrics & Thresholds

All metrics follow [web.dev](https://web.dev) standards:

### Core Web Vitals

| Metric                              | Good    | Needs Improvement | Poor    |
| ----------------------------------- | ------- | ----------------- | ------- |
| **LCP** (Largest Contentful Paint)  | ≤ 2.5s  | 2.5s - 4.0s       | > 4.0s  |
| **CLS** (Cumulative Layout Shift)   | ≤ 0.1   | 0.1 - 0.25        | > 0.25  |
| **INP** (Interaction to Next Paint) | ≤ 200ms | 200ms - 500ms     | > 500ms |

### Additional Metrics

| Metric                           | Good    | Needs Improvement | Poor     |
| -------------------------------- | ------- | ----------------- | -------- |
| **FCP** (First Contentful Paint) | ≤ 1.8s  | 1.8s - 3.0s       | > 3.0s   |
| **TTFB** (Time to First Byte)    | ≤ 800ms | 800ms - 1800ms    | > 1800ms |

---

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers with Web Vitals support

**Note:** Gracefully degrades on older browsers with polyfills available.

---

## Performance Impact

Adding @page-speed/hooks to your project:

- **Bundle Size Impact:** +2-12 KB (depending on hooks used)
- **Runtime Overhead:** Negligible (uses native APIs)
- **Rendering Impact:** Zero (hooks don't trigger renders)
- **Network Impact:** Zero (no external requests)

---

## API Reference

### Import Patterns

```tsx
// Full library
import {
  useWebVitals,
  useLCP,
  useCLS,
  useINP,
  useOptimizedImage,
  useDeferredMount,
} from "@page-speed/hooks";

// Web Vitals only
import { useWebVitals, useLCP, useCLS, useINP } from "@page-speed/hooks/web-vitals";

// Media only
import { useOptimizedImage } from "@page-speed/hooks/media";

// Resources only
import { useDeferredMount } from "@page-speed/hooks/resources";
```

### Type Definitions

```tsx
import type {
  // Core metric types
  Metric,
  WebVitalsOptions,
  WebVitalsState,
  // LCP types
  LCPOptions,
  LCPState,
  // CLS types
  CLSOptions,
  CLSState,
  LayoutShiftEntry,
  LayoutShiftAttribution,
  CLSSessionWindow,
  CLSIssue,
  // INP types
  INPOptions,
  INPState,
  INPInteraction,
  INPPhaseBreakdown,
  INPScriptAttribution,
  INPIssue,
  INPIssueType,
  INPInteractionType,
  // Media types
  UseOptimizedImageOptions,
  UseOptimizedImageState,
  SrcsetByFormat,    // NEW: { avif: string, webp: string, jpeg: string }
  ImageFormat,       // NEW: "avif" | "webp" | "jpeg" | "png"
  // Resource types
  UseDeferredMountOptions,
} from "@page-speed/hooks";
```

---

## Troubleshooting

### Metrics not updating

**Problem:** useWebVitals shows all metrics as null

**Solution:** Metrics take time to measure. Make sure you:

1. Wait a few seconds after page load
2. Use `reportAllChanges: true` for development
3. Check browser console for errors

```tsx
useWebVitals({
  reportAllChanges: true, // Report every update (for dev)
});
```

### Images not loading in lazy mode

**Problem:** useOptimizedImage shows empty src

**Solution:** Make sure IntersectionObserver is supported:

```tsx
const { ref, src, isInView } = useOptimizedImage({ src: "/image.jpg" });

// Add fallback src for visibility while loading
return <img ref={ref} src={src || "/placeholder.jpg"} alt="..." />;
```

### useDeferredMount never renders

**Problem:** Component never appears

**Solution:** Check browser console for errors. useDeferredMount might need a longer delay:

```tsx
const shouldRender = useDeferredMount({
  delay: 500, // Increase delay
  priority: "high", // Try high priority
});
```

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

**Development:**

```bash
git clone https://github.com/opensite-ai/page-speed-hooks
cd page-speed-hooks
pnpm install
pnpm dev      # Watch mode
pnpm test     # Run tests
pnpm build    # Production build
```

---

## License

BSD 3-Clause License © [OpenSite AI](https://opensite.ai)

---

## Resources

- **[web.dev](https://web.dev)** - Official web performance guidance
- **[web-vitals](https://github.com/GoogleChrome/web-vitals)** - Official metrics library
- **[Core Web Vitals Guide](https://web.dev/vitals/)** - What are Core Web Vitals?
- **[CrUX Report](https://developer.chrome.com/docs/crux/)** - Real-world performance data
- **[Lighthouse](https://developers.google.com/web/tools/lighthouse)** - Performance testing tool

---

## Credits

Built with ❤️ by [OpenSite AI](https://opensite.ai)

Part of the **@page-speed** ecosystem for performance-first React development.

---

**Have questions?** [Open an issue](https://github.com/opensite-ai/page-speed-hooks/issues) or check [discussions](https://github.com/opensite-ai/page-speed-hooks/discussions)
