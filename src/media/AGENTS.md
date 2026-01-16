# AGENTS.md - Media hooks

This folder contains media-related performance hooks. The primary hook is `useOptimizedImage`.

## Invariants
- Use rendered `clientWidth`/`clientHeight` when computing sizes. This is required for Lighthouse "Properly size images" compliance.
- `useOptimizedImage` must stay SSR-safe. Keep `useIsomorphicLayoutEffect` and guard `window` access.
- Lazy loading is driven by IntersectionObserver; disconnect observers on cleanup.
- `srcset` and `sizes` should be empty until the image is in view (or `eager` is true) to avoid eager network usage.

## OptixFlow integration
- Base URL: `https://octane.cdn.ing/api/v1/images/transform`.
- Required query params: `url`, `w`, `h`, `q`, `f`, `apiKey`.
- Do not log or expose `optixFlowConfig.apiKey`.
- If `optixFlowConfig` is absent, return the original `src` and empty `srcset`.

## Behavior to preserve
- `size` state prefers explicit `width`/`height` props over measured size.
- `ResizeObserver` is optional; do not add polyfills or heavy dependencies.
- `loading` must be `lazy` unless `eager` is set.

## Testing
- Tests should stub IntersectionObserver and ResizeObserver.
- Validate OptixFlow URL generation and default compression/rendered file type behavior.

