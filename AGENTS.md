# AGENTS.md - Instructions for coding agents working on @page-speed/hooks

This repo is a small, performance-critical React hook library. Changes here affect Core Web Vitals and Lighthouse scores across the DashTrack/OpenSite ecosystem. Favor correctness, measurable performance gains, and tree-shaking over convenience.

## 1) Quick mental model
- Library (not an app) that ships tiny, tree-shakable hooks for web performance.
- Three feature areas:
  - `web-vitals` hooks for LCP/CLS/INP + supporting analytics.
  - `media` hooks for image optimization and lazy loading.
  - `resources` hooks for deferring heavy mounts.
- Runtime dependency surface is intentionally tiny (only `web-vitals`).

## 2) Non-negotiable rules
1. Preserve tree-shaking and per-entry imports.
   - Keep `src/index.ts`, `src/web-vitals/index.ts`, `src/media/index.ts`, `src/resources/index.ts` aligned with `package.json` `exports` and `tsup.config.ts` entries.
   - Avoid new barrel exports that pull in unrelated hooks.
2. Keep runtime deps minimal.
   - Do not add new runtime dependencies without a strong, documented reason.
3. Maintain SSR safety.
   - All hooks must guard `window`/`document` access and avoid side effects at import time.
4. Respect size budgets.
   - `pnpm size` is a publish gate; update `.size-limit.json` when adding new public entrypoints.
5. Keep hook signatures and return shapes stable.
   - Changing types in `src/web-vitals/types.ts` is a breaking change.
6. Do not edit `dist/` or `node_modules/` by hand.

## 3) Architecture map
- `src/index.ts`: main public API (re-exports of all hooks and types).
- `src/web-vitals/*`: Core Web Vitals tracking and issue detection.
- `src/media/*`: image optimization via IntersectionObserver/ResizeObserver + OptixFlow.
- `src/resources/*`: deferred mounting utilities.
- `tsup.config.ts`: build entries, ESM/CJS outputs, `"use client"` banner.
- `package.json`: exports map for tree-shaking and subpath imports.
- `.size-limit.json`: bundle size checks.

## 4) Public hooks and invariants
- `useWebVitals` (`src/web-vitals/useWebVitals.ts`)
  - Registers `web-vitals` listeners once per hook instance.
  - Uses `optionsRef` to avoid re-registering on rerender.
  - Guards browser-only APIs with `typeof window === "undefined"`.
- `useLCP` (`src/web-vitals/useLCP.ts`)
  - Uses IntersectionObserver to flag likely LCP elements and suggests `fetchpriority="high"`.
  - Emits a dev-only warning when LCP exceeds the threshold.
- `useCLS` (`src/web-vitals/useCLS.ts`)
  - Computes session windows (1s gap, 5s max window).
  - Detects and deduplicates CLS issues with heuristics and suggestions.
  - Uses PerformanceObserver when available for attribution; must disconnect on cleanup.
- `useINP` (`src/web-vitals/useINP.ts`)
  - Parses `PerformanceEventTiming` entries to compute phase breakdowns.
  - Tracks interactions above `minInteractionLatency` and reports issue types.
- `useOptimizedImage` (`src/media/useOptimizedImage.ts`)
  - Uses rendered `clientWidth`/`clientHeight` for Lighthouse "Properly size images" compliance.
  - Uses IntersectionObserver for lazy loading and ResizeObserver for responsive sizing.
  - Optional OptixFlow support via `https://octane.cdn.ing/api/v1/images/transform`.
- `useDeferredMount` (`src/resources/useDeferredMount.ts`)
  - Defers rendering using `requestIdleCallback` (low priority) or `setTimeout`.
  - Must return `false` on the server to avoid SSR mismatch.

## 5) Patterns to preserve
- Use `useRef` to store options/callbacks and avoid re-subscribing in effects.
- Always clean up observers and event listeners to avoid memory leaks.
- Keep logic side-effect free at module load; all effects inside hooks.
- Avoid heavy DOM work and avoid new polyfills.

## 6) Tests and quality
- Tests are Vitest + happy-dom.
- Mock browser APIs (IntersectionObserver, ResizeObserver, PerformanceObserver) in tests.
- Keep `web-vitals` mocked for unit tests of hooks.

Recommended checks before shipping changes:
- `pnpm test`
- `pnpm type-check`
- `pnpm build`
- `pnpm size`

## 7) Adding a new hook (summary)
1. Create a new folder under `src/<feature>/` with `hook.ts`, `types.ts`, and `index.ts`.
2. Export from `src/index.ts` and the feature index.
3. Add a tsup entry + package `exports` if it's a new subpath.
4. Add tests in `src/<feature>/*.test.ts`.
5. Update `README.md`, `CHANGELOG.md`, and `.size-limit.json`.

## 8) Ecosystem alignment
- These hooks implement web.dev guidance and are used in performance-critical DashTrack/OpenSite surfaces.
- Prefer minimal JS and clear, actionable diagnostic output; do not introduce app-specific logic.

