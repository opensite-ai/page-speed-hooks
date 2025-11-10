# Development Guide

## Overview

This document provides detailed information for developers working with @page-speed/hooks.

---

## Architecture

### Directory Structure

```
page-speed-hooks/
├── src/
│   ├── web-vitals/           # Core Web Vitals tracking
│   │   ├── index.ts          # Exports
│   │   ├── types.ts          # Interfaces and types
│   │   ├── useWebVitals.ts   # Full metrics tracking
│   │   └── useLCP.ts         # LCP optimization
│   ├── media/                # Media optimization
│   │   ├── index.ts
│   │   └── useOptimizedImage.ts
│   ├── resources/            # Resource management
│   │   ├── index.ts
│   │   └── useDeferredMount.ts
│   └── index.ts              # Main entry point
├── dist/                     # Build output (gitignored)
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── .size-limit.json
├── vitest.config.ts
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
└── LICENSE
```

### Design Principles

1. **Zero Dependencies** (except web-vitals)
   - Minimal surface area
   - Maximum tree-shaking
   - Fast installs

2. **Performance First**
   - No unnecessary re-renders
   - Minimal memory usage
   - Efficient browser API usage

3. **web.dev Aligned**
   - Implement official recommendations
   - Use standard metric names
   - Follow threshold guidelines

4. **Developer Experience**
   - TypeScript first
   - Clear error messages
   - Comprehensive documentation

---

## Development Workflow

### Initial Setup

```bash
git clone https://github.com/opensite-ai/page-speed-hooks.git
cd page-speed-hooks
pnpm install
```

### Development Commands

```bash
# Watch mode (auto-rebuild on changes)
pnpm dev

# Type checking
pnpm type-check

# Run tests
pnpm test
pnpm test:ci  # Single run for CI

# Build production bundle
pnpm build

# Check bundle sizes
pnpm size

# Lint (if configured)
pnpm lint

# Format code
pnpm format
```

### Typical Workflow

```bash
# 1. Create feature branch
git checkout -b feature/new-hook

# 2. Start watching
pnpm dev

# 3. Edit files (TypeScript auto-compiles)
# src/feature/hook.ts
# src/feature/types.ts

# 4. Run tests in another terminal
pnpm test

# 5. Type check before commit
pnpm type-check

# 6. Build and check size
pnpm build
pnpm size

# 7. Commit
git commit -m "feat: add new hook"
```

---

## Adding a New Hook

### Step 1: Create Files

```bash
mkdir src/feature
touch src/feature/index.ts
touch src/feature/hook.ts
touch src/feature/types.ts
touch src/feature/hook.test.ts
```

### Step 2: Define Types

```typescript
// src/feature/types.ts

export interface FeatureHookOptions {
  /** Description of option 1 */
  option1?: string
  
  /** Callback when something happens */
  onEvent?: (data: any) => void
}

export interface FeatureHookState {
  /** Current state */
  data: any | null
  
  /** Loading status */
  isLoading: boolean
}
```

### Step 3: Implement Hook

```typescript
// src/feature/hook.ts
'use client'

import { useEffect, useState, useCallback } from 'react'
import type { FeatureHookOptions, FeatureHookState } from './types'

/**
 * useFeature
 * 
 * Description of what the hook does.
 * 
 * @example
 * ```tsx
 * const state = useFeature({
 *   option1: 'value',
 *   onEvent: (data) => console.log(data)
 * })
 * ```
 */
export function useFeature(options: FeatureHookOptions = {}): FeatureHookState {
  const [state, setState] = useState<FeatureHookState>({
    data: null,
    isLoading: true
  })

  useEffect(() => {
    // Implementation here
  }, [])

  return state
}
```

### Step 4: Create Exports

```typescript
// src/feature/index.ts

export { useFeature } from './hook'
export type {
  FeatureHookOptions,
  FeatureHookState
} from './types'
```

### Step 5: Update Main Entry Point

```typescript
// src/index.ts

// Add to imports
export { useFeature } from './feature'
export type { FeatureHookOptions, FeatureHookState } from './feature'
```

### Step 6: Update Build Config

```typescript
// tsup.config.ts

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'web-vitals': 'src/web-vitals/index.ts',
    feature: 'src/feature/index.ts',  // Add this
    // ...
  },
  // ...
})
```

### Step 7: Update Size Limits

```json
// .size-limit.json

[
  {
    "name": "useFeature",
    "path": "dist/feature.mjs",
    "import": "{ useFeature }",
    "limit": "X KB"
  }
]
```

### Step 8: Write Tests

```typescript
// src/feature/hook.test.ts

import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFeature } from './hook'

describe('useFeature', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useFeature())
    
    expect(result.current.data).toBeNull()
    expect(result.current.isLoading).toBe(true)
  })

  it('handles options', () => {
    const onEvent = vi.fn()
    const { result } = renderHook(() => 
      useFeature({ option1: 'test', onEvent })
    )
    
    expect(result.current.data).toBe('test')
  })
})
```

### Step 9: Update Documentation

Add to README.md:

```markdown
#### `useFeature(options?)`

Description and usage...

**Options:**
- ...

**Returns:**
```

Add to CHANGELOG.md:

```markdown
- **`useFeature` hook** - Description
  - Feature 1
  - Feature 2
```

### Step 10: Verify Everything

```bash
pnpm type-check
pnpm test
pnpm build
pnpm size
```

---

## Testing Guidelines

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

describe('hookName', () => {
  beforeEach(() => {
    // Setup
  })

  afterEach(() => {
    // Cleanup
  })

  it('describes behavior', () => {
    // Test
  })
})
```

### Common Patterns

```typescript
// Test hook creation
it('initializes with default state', () => {
  const { result } = renderHook(() => useHook())
  expect(result.current.value).toBe(expectedDefault)
})

// Test option handling
it('respects options', () => {
  const { result } = renderHook(() => useHook({ option: true }))
  expect(result.current.option).toBe(true)
})

// Test callbacks
it('calls callback on event', () => {
  const callback = vi.fn()
  renderHook(() => useHook({ onEvent: callback }))
  // Simulate event
  expect(callback).toHaveBeenCalled()
})

// Test state changes
it('updates state over time', async () => {
  const { result } = renderHook(() => useHook())
  
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false)
  })
})
```

---

## Bundle Size Management

### Current Limits

Defined in `.size-limit.json`:

```
Full library: 15 KB
useWebVitals: 4 KB
useLCP: 3 KB
useOptimizedImage: 3 KB
useDeferredMount: 2 KB
```

### Checking Size

```bash
# View all sizes
pnpm size

# Detailed view
pnpm size -- --details

# Watch for regressions
pnpm size -- --watch
```

### Reducing Size

1. **Remove unused code**
   ```bash
   # Check for dead code
   pnpm build -- --analyze
   ```

2. **Use tree-shaking**
   - Mark side effects: `"sideEffects": false`
   - Use ES6 exports
   - Avoid circular dependencies

3. **Optimize dependencies**
   - Avoid large dependencies
   - Use native browser APIs when possible
   - Consider dynamic imports

---

## Performance Profiling

### Runtime Performance

```typescript
// Measure hook execution time
const start = performance.now()
const { result } = renderHook(() => useHook())
const end = performance.now()
console.log(`Hook initialization: ${end - start}ms`)
```

### Memory Usage

```typescript
// Monitor memory growth
if (process.memory) {
  const initial = process.memory().heapUsed
  renderHook(() => useHook())
  const final = process.memory().heapUsed
  console.log(`Memory increase: ${final - initial} bytes`)
}
```

### Browser APIs

```typescript
// Performance Observer for metrics
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(entry.name, entry.duration)
  }
})
observer.observe({ entryTypes: ['measure', 'navigation'] })
```

---

## Debugging

### Development Mode

```bash
# Watch mode with debugging
NODE_DEBUG=* pnpm dev
```

### TypeScript

```bash
# Check types
pnpm type-check

# Show type information
tsc --noEmit --listFiles
```

### Tests

```bash
# Verbose test output
pnpm test -- --reporter=verbose

# Single test file
pnpm test -- src/feature/hook.test.ts

# Watch specific file
pnpm test -- --watch src/feature/hook.test.ts

# Debug in browser
pnpm test -- --inspect-brk
```

### Browser DevTools

```typescript
// Add debugging output
console.log('Hook state:', state)
debugger  // Will pause in DevTools
```

---

## Git Workflow

### Branch Naming

```
feature/description    # New feature
fix/description        # Bug fix
docs/description       # Documentation
chore/description      # Maintenance
perf/description       # Performance
```

### Commit Messages

```
feat: add new hook
fix: correct metric calculation
docs: update README with examples
perf: reduce bundle size by 5%
```

### Push and PR

```bash
# Push branch
git push origin feature/name

# Open PR on GitHub
# Link issues: Closes #123
# Provide description
# Request review
```

---

## Release Process

### Version Bumping

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0) - Breaking changes
- **MINOR** (0.1.0) - New features
- **PATCH** (0.0.1) - Bug fixes

### Publishing

```bash
# Update version in package.json
npm version minor

# Build and publish
pnpm publish --access public

# Verify on npm
npm info @page-speed/hooks
```

---

## Troubleshooting

### Build Issues

```bash
# Clear cache
rm -rf dist node_modules
pnpm install
pnpm build
```

### Type Errors

```bash
# Regenerate types
pnpm type-check
tsc --noEmit --listFilesOnly
```

### Test Failures

```bash
# Run with verbose output
pnpm test -- --reporter=verbose

# Check environment
node --version
pnpm --version
```

### Size Regressions

```bash
# Check what changed
pnpm build -- --analyze
ls -lh dist/

# Compare with main
git diff main -- dist/
```

---

## Performance Targets

### Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Initial build time | < 5s | 2.1s |
| Watch rebuild | < 1s | 0.3s |
| Test suite | < 10s | 2.4s |
| Type check | < 5s | 1.8s |

### Bundle Sizes

| Package | Target | Current |
|---------|--------|---------|
| Full library | 15 KB | 12.4 KB |
| useWebVitals | 4 KB | 3.2 KB |
| useLCP | 3 KB | 2.8 KB |

---

## Resources

- [web.dev Performance](https://web.dev/performance/)
- [web-vitals Library](https://github.com/GoogleChrome/web-vitals)
- [React Hooks Documentation](https://react.dev/reference/react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)

---

## Questions?

Open an issue or start a discussion on GitHub!
