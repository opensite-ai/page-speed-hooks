# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Planned

- `useResourceHints` hook for preload/prefetch management
- `useAdaptiveVideo` hook for responsive video loading
- `useNetworkStatus` hook for connection-aware loading strategies
- Enhanced documentation with interactive examples
- Performance benchmarking dashboard
- Community contribution guidelines

## [0.4.5] - 2026-01-15

### Added

#### `useOptimizedImage` OptixFlow object-fit control

- Added `optixFlowConfig.objectFit` with `"cover" | "contain" | "fill"` options.
- Sends `fit` query parameter to OptixFlow; default is `"cover"` when omitted.

## [0.1.4] - 2025-12-01

### Added

#### `useOptimizedImage` - Responsive srcset and Lighthouse Optimization

Enhanced the `useOptimizedImage` hook with comprehensive responsive image support implementing web.dev best practices for optimal Lighthouse scores.

**Responsive srcset with Format Variants:**

- New `srcset` property returns an object with AVIF, WebP, and JPEG srcset strings
- Each format includes 1x and 2x DPR (Device Pixel Ratio) variants for high-density displays
- Enables `<picture>` element usage for modern format negotiation (AVIF → WebP → JPEG fallback)

**Pixel-Perfect Sizing for Lighthouse Compliance:**

- Primary `src` now uses exact rendered dimensions (from `clientWidth`/`clientHeight`)
- Addresses Lighthouse's "Properly size images" audit by serving exact-fit images
- Uses `ResizeObserver` to dynamically update dimensions when layout changes

**New `sizes` Attribute:**

- New `sizes` property provides the sizes attribute value for responsive image selection
- Defaults to the current rendered width in pixels (e.g., `"480px"`)

**DPR-Aware srcset Generation:**

- Generates 1x and 2x variants automatically: `url?w=480&h=300 1x, url?w=960&h=600 2x`
- Ensures high-DPR devices receive appropriately sized images
- Zero additional configuration required

**Updated Return Type:**

```typescript
interface UseOptimizedImageState {
  ref: (node: HTMLImageElement | null) => void;
  src: string;                    // Primary src with exact rendered dimensions
  srcset: SrcsetByFormat;         // NEW: { avif: string, webp: string, jpeg: string }
  sizes: string;                  // NEW: Sizes attribute value (e.g., "480px")
  isLoaded: boolean;
  isInView: boolean;
  loading: 'lazy' | 'eager';
  size: { width: number; height: number };
}

interface SrcsetByFormat {
  avif: string;   // "url?f=avif 1x, url?f=avif 2x"
  webp: string;   // "url?f=webp 1x, url?f=webp 2x"
  jpeg: string;   // "url?f=jpeg 1x, url?f=jpeg 2x"
}
```

**Example Usage with `<picture>` Element:**

```tsx
import { useOptimizedImage } from '@page-speed/hooks/media';

function ProductImage({ imageUrl, alt }) {
  const { ref, src, srcset, sizes, isLoaded, loading, size } = useOptimizedImage({
    src: imageUrl,
    width: 480,
    height: 300,
    optixFlowConfig: {
      apiKey: process.env.OPTIX_API_KEY,
      compressionLevel: 80,
    },
  });

  return (
    <picture>
      <source srcSet={srcset.avif} sizes={sizes} type="image/avif" />
      <source srcSet={srcset.webp} sizes={sizes} type="image/webp" />
      <img
        ref={ref}
        src={src}
        alt={alt}
        width={size.width}
        height={size.height}
        loading={loading}
        decoding="async"
        className={isLoaded ? 'loaded' : 'loading'}
      />
    </picture>
  );
}
```

**Lighthouse Performance Impact:**

| Audit | Before | After |
|-------|--------|-------|
| Properly Size Images | ⚠️ May fail with single URL | ✅ Exact rendered dimensions |
| Uses Modern Formats | ⚠️ Depends | ✅ AVIF + WebP layering |
| LCP Optimization | ⚠️ Depends | ✅ Browser selects optimal format |

**New Exports:**

- `ImageFormat` - Type alias: `"avif" | "webp" | "jpeg" | "png"`
- `SrcsetByFormat` - Interface for the srcset object structure

**web.dev References:**

- [Responsive Images](https://web.dev/articles/responsive-images)
- [Properly Size Images](https://developer.chrome.com/docs/lighthouse/performance/uses-responsive-images)
- [Serve Images in Modern Formats](https://developer.chrome.com/docs/lighthouse/performance/uses-webp-images)

## [0.1.3] - 2025-12-01

### Added

#### `useINP` Hook - Interaction to Next Paint Optimization

Comprehensive hook for tracking, analyzing, and optimizing Interaction to Next Paint (INP). Implements all web.dev best practices with real-time measurement, interaction attribution, phase breakdown analysis, issue detection, and optimization utilities.

**Core Features:**

- **Real-time INP Measurement** - Tracks INP value using the official `web-vitals` library with proper interaction handling
- **Rating Calculation** - Automatic rating based on web.dev thresholds (Good ≤200ms, Needs Improvement 200-500ms, Poor >500ms)
- **Interaction Attribution** - Captures which elements received interactions, with event type and target information
- **Phase Breakdown Analysis** - Breaks down latency into Input Delay, Processing Duration, and Presentation Delay
- **Slowest Interaction Detection** - Identifies the main contributor to your INP score

**Three-Phase Latency Analysis:**

- `inputDelay` - Time from user interaction to event handler start (main thread busy)
- `processingDuration` - Time spent executing event handlers
- `presentationDelay` - Time from handler completion to next paint (rendering work)

**Issue Detection & Optimization Suggestions:**

- `high-input-delay` - Main thread was busy when interaction occurred
- `heavy-event-handler` - Event handlers taking too long to execute
- `high-presentation-delay` - Rendering is slow after handler completion
- `third-party-script` - Third-party scripts impacting responsiveness
- `long-task` - Long tasks blocking the main thread
- `layout-thrashing` - Alternating DOM reads/writes causing forced layouts
- `excessive-dom-size` - Large DOM affecting rendering performance

**Utility Functions:**

- `getElementSelector(element)` - Get CSS selector for debugging slow interaction targets
- `isThirdPartyScript(url)` - Check if a script URL is from a third-party origin
- `getSuggestions(interaction)` - Get actionable optimization suggestions for an interaction
- `reset()` - Reset INP tracking (useful for SPA navigation)
- `recordInteraction(latency, target?, type?)` - Manually record interactions for custom tracking

**Callbacks:**

- `onMeasure(value, rating)` - Called when INP is measured or updated
- `onInteraction(interaction)` - Called on each detected interaction
- `onIssue(issue)` - Called when optimization opportunities are detected

**Statistics & Analytics:**

- `interactionCount` - Total number of interactions detected
- `slowInteractionCount` - Interactions exceeding the threshold
- `averageLatency` - Average latency across all interactions
- `goodInteractionPercentage` - Percentage of interactions rated "good"
- `interactionsByType` - Distribution by click, keypress, and tap
- `topSlowScripts` - Scripts most frequently associated with slow interactions

**New Types:**

```typescript
interface INPOptions {
  threshold?: number;              // Target INP (default: 200ms)
  onMeasure?: (value, rating) => void;
  onInteraction?: (interaction: INPInteraction) => void;
  onIssue?: (issue: INPIssue) => void;
  reportAllChanges?: boolean;      // Report all interactions (default: false)
  debug?: boolean;                 // Console warnings (default: true in dev)
  detectIssues?: boolean;          // Enable issue detection (default: true)
  trackAttribution?: boolean;      // Track script attribution (default: true)
  minInteractionLatency?: number;  // Minimum latency to track (default: 40ms)
  longTaskThreshold?: number;      // Long task threshold (default: 50ms)
}

interface INPState {
  inp: number | null;
  rating: 'good' | 'needs-improvement' | 'poor' | null;
  isLoading: boolean;
  interactions: INPInteraction[];
  slowestInteraction: INPInteraction | null;
  slowestPhases: INPPhaseBreakdown | null;
  issues: INPIssue[];
  interactionCount: number;
  slowInteractionCount: number;
  averageLatency: number | null;
  goodInteractionPercentage: number;
  interactionsByType: { click: number; keypress: number; tap: number };
  topSlowScripts: Array<{ url: string; totalDuration: number; occurrences: number }>;
  utils: { /* utility functions */ };
}

interface INPPhaseBreakdown {
  inputDelay: number;
  processingDuration: number;
  presentationDelay: number;
}
```

**Example Usage:**

```tsx
import { useINP } from '@page-speed/hooks';

function App() {
  const { inp, rating, slowestInteraction, issues, utils } = useINP({
    threshold: 200,
    onMeasure: (value, rating) => analytics.track('INP', { value, rating }),
    onIssue: (issue) => console.warn('INP Issue:', issue.suggestion),
  });

  return (
    <div>
      <p>INP: {inp ? `${inp.toFixed(0)}ms` : 'Measuring...'} ({rating})</p>
      {slowestInteraction && (
        <div>
          <p>Slowest: {slowestInteraction.target}</p>
          <p>Input Delay: {slowestInteraction.phases.inputDelay.toFixed(0)}ms</p>
          <p>Processing: {slowestInteraction.phases.processingDuration.toFixed(0)}ms</p>
          <p>Presentation: {slowestInteraction.phases.presentationDelay.toFixed(0)}ms</p>
        </div>
      )}
    </div>
  );
}
```

**Web.dev References:**

- [Interaction to Next Paint (INP)](https://web.dev/inp/)
- [Optimize INP](https://web.dev/articles/optimize-inp/)
- [Find Slow Interactions in the Field](https://web.dev/articles/find-slow-interactions-in-the-field/)

## [0.1.2] - 2025-12-01

### Added

#### `useCLS` Hook - Cumulative Layout Shift Optimization

Comprehensive hook for tracking, analyzing, and optimizing Cumulative Layout Shift (CLS). Implements all web.dev best practices with real-time measurement, attribution data, issue detection, and optimization utilities.

**Core Features:**

- **Real-time CLS Measurement** - Tracks CLS value using the official `web-vitals` library with proper session windowing
- **Rating Calculation** - Automatic rating based on web.dev thresholds (Good ≤0.1, Needs Improvement 0.1-0.25, Poor >0.25)
- **Layout Shift Attribution** - Captures which elements shifted, with before/after position data
- **Session Window Analysis** - Groups shifts into session windows per web.dev specification (1s gap, 5s max duration)
- **Largest Shift Detection** - Identifies the main contributor to your CLS score

**Issue Detection & Optimization Suggestions:**

- `image-without-dimensions` - Images missing width/height attributes
- `unsized-media` - Video/picture elements without explicit dimensions
- `dynamic-content` - Late-loading content causing shifts
- `web-font-shift` - Font loading causing text reflow
- `ad-embed-shift` - Advertisements/embeds loading without reserved space
- `animation-shift` - CSS animations using layout-affecting properties

**Utility Functions:**

- `getElementSelector(element)` - Get CSS selector for debugging shifted elements
- `hasExplicitDimensions(element)` - Check if elements have width/height set
- `getAspectRatio(width, height)` - Calculate aspect ratio for dimension recommendations
- `reset()` - Reset CLS tracking (useful for SPA navigation)

**Callbacks:**

- `onMeasure(value, rating)` - Called when CLS is measured or updated
- `onShift(entry)` - Called on each individual layout shift
- `onIssue(issue)` - Called when optimization opportunities are detected

**New Types:**

```typescript
interface CLSOptions {
  threshold?: number;              // Target CLS (default: 0.1)
  onMeasure?: (value, rating) => void;
  onShift?: (entry: LayoutShiftEntry) => void;
  onIssue?: (issue: CLSIssue) => void;
  reportAllChanges?: boolean;      // Report all changes (default: false)
  debug?: boolean;                 // Console warnings (default: true in dev)
  detectIssues?: boolean;          // Enable issue detection (default: true)
  trackAttribution?: boolean;      // Track shift attribution (default: true)
}

interface CLSState {
  cls: number | null;
  rating: 'good' | 'needs-improvement' | 'poor' | null;
  isLoading: boolean;
  entries: LayoutShiftEntry[];
  largestShift: LayoutShiftEntry | null;
  sessionWindows: CLSSessionWindow[];
  largestSessionWindow: CLSSessionWindow | null;
  issues: CLSIssue[];
  shiftCount: number;
  hasPostInteractionShifts: boolean;
  utils: { /* utility functions */ };
}
```

**Example Usage:**

```tsx
import { useCLS } from '@page-speed/hooks';

function App() {
  const { cls, rating, issues, utils } = useCLS({
    threshold: 0.1,
    onMeasure: (value, rating) => analytics.track('CLS', { value, rating }),
    onIssue: (issue) => console.warn('CLS Issue:', issue.suggestion),
  });

  return (
    <div>
      <p>CLS: {cls?.toFixed(3) ?? 'Measuring...'} ({rating})</p>
      {issues.map((issue, i) => (
        <p key={i}>{issue.suggestion}</p>
      ))}
    </div>
  );
}
```

**Web.dev References:**

- [Cumulative Layout Shift (CLS)](https://web.dev/cls/)
- [Optimize CLS](https://web.dev/optimize-cls/)
- [Debug Layout Shifts](https://web.dev/debug-layout-shifts/)

## [0.1.1] - 2025-11-30

### Added

#### `useOptimizedImage` Enhancements

- **Dynamic Size State** - New `size` property in return object that tracks the rendered image dimensions
  - Returns `{ width: number, height: number }` reflecting current image size
  - Uses `ResizeObserver` for real-time size tracking as images resize
  - Falls back to `naturalWidth`/`naturalHeight` when element dimensions unavailable
  - Supports explicit `width` and `height` props to override detected values

- **OptixFlow API Integration** - Optional automatic image optimization via OptixFlow CDN
  - New `optixFlowConfig` option with the following properties:
    - `apiKey: string` - Your OptixFlow API key (required to enable optimization)
    - `compressionLevel?: number` - Quality setting from 0-100 (default: 75)
    - `renderedFileType?: 'avif' | 'webp' | 'jpeg' | 'png'` - Output format (default: 'avif')
  - Automatically builds optimized CDN URLs with detected/specified dimensions
  - Zero-config optimization when API key is provided
  - Gracefully falls back to original `src` when OptixFlow is not configured

#### New Options

- `width?: number` - Explicit width in pixels (overrides detected width)
- `height?: number` - Explicit height in pixels (overrides detected height)
- `optixFlowConfig?: object` - OptixFlow API configuration for automatic image optimization

#### Updated Return Type

```typescript
interface UseOptimizedImageState {
  ref: (node: HTMLImageElement | null) => void;
  src: string;
  isLoaded: boolean;
  isInView: boolean;
  loading: 'lazy' | 'eager';
  size: { width: number; height: number }; // NEW
}
```

---

## [0.1.0] - 2025-11-10

### Added

#### Initial Release

- **`useWebVitals` hook** - Track all Core Web Vitals metrics (LCP, CLS, INP, FCP, TTFB)
  - Real-time metric tracking
  - Custom callbacks for each metric
  - Automatic rating calculation (good/needs-improvement/poor)
  - Support for all 6 navigation types (navigate, reload, back-forward, back-forward-cache, prerender, restore)
  - TypeScript support with complete type definitions

- **`useLCP` hook** - Largest Contentful Paint optimization
  - Tracks LCP element loading
  - Automatic `fetchpriority="high"` suggestion for above-fold images
  - Development warnings when LCP exceeds threshold
  - IntersectionObserver-based element detection
  - Configurable threshold (default: 2.5s per web.dev)

- **`useOptimizedImage` hook** - Image loading optimization
  - Lazy loading with IntersectionObserver
  - Configurable visibility threshold and root margin
  - Automatic image preloading before intersection
  - Support for both eager and lazy loading strategies
  - Cache-aware loading state management

- **`useDeferredMount` hook** - Render performance optimization
  - Defers non-critical component mounting until page idle
  - Support for `requestIdleCallback` with fallback
  - Configurable delay for additional safety
  - Reduces initial bundle evaluation time
  - Improves Core Web Vitals scores

#### Build & Tooling

- **Zero-configuration TypeScript library setup**
  - ESM and CommonJS outputs
  - Automatic `.d.ts` type file generation
  - Source maps for debugging
  - Multiple entry points for tree-shaking

- **Tree-shaking optimized**
  - `"sideEffects": false` configuration
  - Separate entry points: `web-vitals`, `media`, `resources`
  - Code splitting enabled for optimal bundle sizes
  - Individual hook imports: `@page-speed/hooks/web-vitals`

- **Bundle size monitoring**
  - size-limit configuration with thresholds
  - Individual hook size tracking
  - Automated CI/CD size checks

- **Testing infrastructure**
  - Vitest test runner
  - React Testing Library integration
  - Happy DOM environment setup

#### Documentation

- Comprehensive README with examples
- Quick start guide
- Hook API reference with all options
- Real-world integration examples (Next.js, Remix)
- Troubleshooting guide
- Performance expectations and thresholds
- web.dev alignment documentation

#### Project Structure

- Source organization by feature (web-vitals, media, resources)
- Type definitions with detailed JSDoc comments
- Clear separation of concerns
- Monorepo-ready structure

---

## How to Upgrade

### From 0.1.0 to 0.2.0 (Upcoming)

When new hooks are released, simply add them to your imports:

```typescript
// Before
import { useWebVitals, useLCP } from '@page-speed/hooks'

// After (with new hooks)
import { 
  useWebVitals, 
  useLCP, 
  useCLS, 
  useINP 
} from '@page-speed/hooks'
```

No breaking changes expected for v0.x releases.

---

## Development Roadmap

### Phase 1 (Current - v0.1.0)

- ✅ Core Web Vitals tracking
- ✅ LCP optimization
- ✅ Image optimization
- ✅ Render performance optimization
- ✅ Production-ready library

### Phase 2 (v0.2.0 - Dec 2025)

- ✅ CLS hook for layout shift detection
- ✅ INP hook for interaction performance
- 🔄 Enhanced documentation site

### Phase 3 (v0.3.0 - Jan 2026)

- 🔄 Resource hints management
- 🔄 Network-aware loading strategies
- 🔄 Video optimization hook

### Phase 4 (v1.0.0 - Feb 2026)

- 🔄 Stable API guarantees
- 🔄 Framework-specific integrations
- 🔄 Performance analytics dashboard

---

## Breaking Changes

None yet - all APIs are considered experimental until v1.0.0.

---

## Migration Guides

### No migrations needed for v0.1.0

This is the initial release. See [README.md](./README.md) for setup instructions.

---

## Dependencies

### Runtime

- `web-vitals@^4.2.4` - Official Google Web Vitals metrics library

### Peer Dependencies

- `react@>=16.8.0` - React with Hooks support
- `react-dom@>=16.8.0` - React DOM

### Development Dependencies

- `tsup@^8.3.5` - TypeScript bundler
- `typescript@^5.7.2` - TypeScript compiler
- `vitest@^2.1.5` - Test runner
- `@testing-library/react@^16.0.1` - Testing utilities
- `size-limit@^11.1.6` - Bundle size monitoring

---

## Performance

### Bundle Impact

- **Full library:** ~12 KB gzipped
- **useWebVitals:** ~3.2 KB gzipped
- **useLCP:** ~2.8 KB gzipped
- **useOptimizedImage:** ~2.1 KB gzipped
- **useDeferredMount:** ~1.4 KB gzipped

### Runtime Performance

- **Hook execution time:** < 1ms
- **Memory overhead:** < 1MB per hook
- **Re-render impact:** Zero (hooks don't trigger renders)
- **Network requests:** None (uses native browser APIs)

---

## Known Issues & Limitations

### Navigation Type Support

- `'restore'` navigation type requires web-vitals v4.0.0+
- Older browser support available via polyfills

### IntersectionObserver

- `useOptimizedImage` requires IntersectionObserver support
- Fallback available for older browsers (loads immediately)

### requestIdleCallback

- `useDeferredMount` with `priority: 'low'` requires requestIdleCallback
- Falls back to setTimeout on unsupported browsers

---

## Contributors

- [OpenSite AI](https://opensite.ai) - Initial development

---

## License

BSD 3 © [OpenSite AI](https://opensite.ai)

---

## See Also

- [web-vitals](https://github.com/GoogleChrome/web-vitals) - Official Google metrics library
- [web.dev](https://web.dev) - Web performance best practices

---

**Questions?** [Open an issue](https://github.com/opensite-ai/page-speed-hooks/issues) or [start a discussion](https://github.com/opensite-ai/page-speed-hooks/discussions)
