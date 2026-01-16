# AGENTS.md - Web Vitals hooks

This folder contains the Core Web Vitals hooks. These are performance-sensitive and are expected to align with web.dev definitions and thresholds.

## Scope and intent
- `useWebVitals` aggregates LCP/CLS/INP/FCP/TTFB and forwards callbacks.
- `useLCP` tracks the likely LCP element and provides `fetchPriority` guidance.
- `useCLS` and `useINP` provide attribution, issue detection, and helper utilities.
- Types in `types.ts` are public API and should be treated as stable.

## Non-negotiable behavior
- Do not re-register `web-vitals` listeners on rerender. Use `optionsRef`.
- Guard all browser APIs with `typeof window === "undefined"` checks.
- Dev warnings should stay dev-only and be triggered once per hook instance.
- Keep default thresholds aligned to web.dev:
  - LCP: 2500ms / 4000ms
  - CLS: 0.1 / 0.25
  - INP: 200ms / 500ms

## `useCLS` specifics
- Session windows are built with a 1s gap and a 5s max window.
- Issue detection uses heuristics; if you change issue types or suggestions, update:
  - `CLSIssue` types in `types.ts`
  - README examples and troubleshooting
  - Unit tests in `useCLS.test.ts`
- Attribution relies on PerformanceObserver `layout-shift`. Disconnect on cleanup.
- `getElementSelector` should stay simple (ID, class, nth-child) to avoid heavy selectors.

## `useINP` specifics
- Phase breakdown uses `processingStart`, `processingEnd`, and `duration` from PerformanceEventTiming.
- `minInteractionLatency` filters noisy interactions; keep default at 40ms unless you also update docs/tests.
- `recordInteraction` is intentionally lightweight; avoid adding async work there.
- Script attribution (`trackAttribution`) is currently a placeholder. If you implement LoAF integration:
  - Populate `interaction.scripts`, `scriptStatsRef`, and `topSlowScripts`.
  - Extend tests to cover attribution data.

## Testing guidelines
- Mock `web-vitals` callbacks and browser APIs in tests.
- Keep tests focused on state transitions and callback behavior, not real timing.

