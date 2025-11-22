<img width="1200" height="330" alt="page-speed-hooks-library" src="https://github.com/user-attachments/assets/1a0cdef2-06bc-47fb-a405-75de0e589c6f" />

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

### 🖼️ Media Optimization

#### `useOptimizedImage(options)`

Lazy loads images below the fold with IntersectionObserver, automatically deferring loading until the element is visible.

```tsx
import { useOptimizedImage } from "@page-speed/hooks/media";

function ProductImage() {
  const { ref, src, isLoaded, loading } = useOptimizedImage({
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
      width={800}
      height={600}
    />
  );
}
```

**Options:**

- `src: string` - Image source URL (required)
- `eager?: boolean` - Load immediately (default: false)
- `threshold?: number` - IntersectionObserver threshold (default: 0.1)
- `rootMargin?: string` - IntersectionObserver root margin (default: '50px')

**Returns:**

```typescript
{
  ref: (node) => void           // Attach to img element
  src: string                   // Image source (empty until loaded)
  isLoaded: boolean             // Image has loaded
  isInView: boolean             // Element is in viewport
  loading: 'lazy' | 'eager'     // Loading strategy used
}
```

**Best Practices:**

- Use `eager={true}` for above-fold images (hero, header)
- Use `eager={false}` (default) for below-fold images
- Increase `rootMargin` to preload before user reaches image
- Set `threshold` lower for early loading (0.01) or higher for exact visibility (0.5)

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
  useOptimizedImage,
  useDeferredMount,
} from "@page-speed/hooks";

// Web Vitals only
import { useWebVitals, useLCP } from "@page-speed/hooks/web-vitals";

// Media only
import { useOptimizedImage } from "@page-speed/hooks/media";

// Resources only
import { useDeferredMount } from "@page-speed/hooks/resources";
```

### Type Definitions

```tsx
import type {
  Metric,
  WebVitalsOptions,
  WebVitalsState,
  LCPOptions,
  LCPState,
  UseOptimizedImageOptions,
  UseOptimizedImageState,
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
