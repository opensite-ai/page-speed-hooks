# Contributing to @page-speed/hooks

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to @page-speed/hooks.

## Code of Conduct

Be respectful, inclusive, and constructive. We're building a welcoming community for developers passionate about web performance.

---

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 9+
- Git

### Development Setup

```bash
# Clone the repository
git clone https://github.com/opensite-ai/page-speed-hooks.git
cd page-speed-hooks

# Install dependencies
pnpm install

# Start watching
pnpm dev

# Run tests
pnpm test

# Type check
pnpm type-check

# Build
pnpm build

# Check bundle sizes
pnpm size
```

---

## How to Contribute

### 1. Report Issues

Found a bug? Have a feature request? [Open an issue](https://github.com/opensite-ai/page-speed-hooks/issues/new).

**Please include:**
- Clear description of the issue
- Steps to reproduce (for bugs)
- Expected vs. actual behavior
- Environment (browser, Node.js version, etc.)
- Code examples if applicable

### 2. Suggest Enhancements

Ideas for new hooks or improvements? [Start a discussion](https://github.com/opensite-ai/page-speed-hooks/discussions).

Good enhancement candidates:
- New performance-related hooks
- Improved documentation
- Better error messages
- Performance optimizations
- Framework-specific integrations

### 3. Submit Pull Requests

**Before starting work:**

1. Check existing [issues](https://github.com/opensite-ai/page-speed-hooks/issues) and [discussions](https://github.com/opensite-ai/page-speed-hooks/discussions) to avoid duplicates
2. For new features, open an issue first to discuss the approach
3. Follow the coding standards below

**Creating a PR:**

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes
# Write/update tests
# Update documentation

# Verify everything works
pnpm type-check
pnpm test
pnpm build
pnpm size

# Commit with clear messages
git commit -m "feat: add useCLS hook for layout shift tracking"

# Push and create PR
git push origin feature/your-feature-name
```

---

## Coding Standards

### TypeScript

- Strict mode enabled
- No `any` types without justification
- Export interfaces for public APIs
- JSDoc comments for functions and interfaces

### Naming Conventions

```typescript
// Hooks: use{PascalCase}
export function useWebVitals(options?: WebVitalsOptions) { }
export function useLCP(options?: LCPOptions) { }

// Interfaces: {Name}{Descriptor}
export interface WebVitalsOptions { }
export interface WebVitalsState { }

// Types: {Name}{Type}
export type NavigationType = 'navigate' | 'reload' | ...

// Internal functions: camelCase with leading underscore
const _calculateRating = (value: number) => { }
```

### File Organization

```
src/
├── feature/
│   ├── index.ts          # Re-exports
│   ├── hook.ts           # Implementation
│   └── types.ts          # Types & interfaces
├── utils/
│   └── performance.ts    # Shared utilities
└── index.ts              # Main entry point
```

### Code Style

```typescript
// Comments
// 1. Document the "why", not the "what"
// ❌ Bad: Increment counter
i++

// ✅ Good: Reset measurement after LCP is finalized
hasWarnedRef.current = true

// Documentation
/**
 * useWebVitals
 * 
 * Tracks Core Web Vitals metrics.
 * 
 * @example
 * ```tsx
 * const vitals = useWebVitals({
 *   onLCP: (metric) => console.log(metric.value)
 * })
 * ```
 */

// Imports
import { useEffect, useState } from 'react'  // React first
import { onLCP } from 'web-vitals'           // Then dependencies
import type { LCPOptions } from './types'    // Then types

// Organization
// 1. Interfaces and types
// 2. Constants
// 3. Main function
// 4. Helper functions
// 5. Exports
```

---

## Testing

### Writing Tests

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWebVitals } from './useWebVitals'

describe('useWebVitals', () => {
  it('tracks LCP metric', () => {
    const onLCP = vi.fn()
    const { result } = renderHook(() => 
      useWebVitals({ onLCP })
    )
    
    expect(result.current.lcp).toBeNull()
    // Simulate metric
    expect(onLCP).toHaveBeenCalled()
  })

  it('formats metric value correctly', () => {
    const { result } = renderHook(() => useWebVitals())
    
    expect(result.current.lcp).toBeOfType('number')
  })
})
```

### Running Tests

```bash
# Watch mode
pnpm test

# Single run
pnpm test:ci

# With coverage
pnpm test -- --coverage
```

### Test Coverage

- Aim for >80% coverage
- Test happy paths and edge cases
- Mock browser APIs appropriately
- Test error handling

---

## Documentation

### README Sections

Update README.md if you:
- Add a new hook (add to Hooks section)
- Change API (update Examples section)
- Fix bugs (mention in Known Issues if relevant)

### JSDoc Comments

All public APIs must have JSDoc:

```typescript
/**
 * useWebVitals
 * 
 * Tracks all Core Web Vitals metrics in real-time.
 * Implements web.dev best practices exactly.
 * 
 * @param options - Hook configuration
 * @returns Current metrics state and loading status
 * 
 * @example
 * ```tsx
 * const vitals = useWebVitals({
 *   onLCP: (metric) => console.log('LCP:', metric.value),
 *   reportAllChanges: true
 * })
 * ```
 * 
 * @see https://web.dev/vitals/
 */
export function useWebVitals(options?: WebVitalsOptions): WebVitalsState
```

### Changelog

Update CHANGELOG.md with your changes under `[Unreleased]`:

```markdown
## [Unreleased]

### Added
- `useCLS` hook for Cumulative Layout Shift tracking

### Fixed
- LCP threshold warning logic

### Changed
- Improved error messages
```

---

## Performance Considerations

When adding features, consider:

1. **Bundle Size**
   - New code should be minimal
   - Use tree-shaking (`"sideEffects": false`)
   - Test with `pnpm size`

2. **Runtime Performance**
   - Hooks should have minimal overhead
   - Use refs to avoid unnecessary renders
   - Avoid expensive calculations in render

3. **Memory Usage**
   - Clean up observers and listeners
   - Use weak refs where possible
   - Test for memory leaks

---

## PR Review Process

1. **Automated Checks**
   - TypeScript compilation (`pnpm type-check`)
   - Tests pass (`pnpm test:ci`)
   - Bundle size within limits (`pnpm size`)

2. **Code Review**
   - Code follows standards
   - Changes are well-documented
   - No breaking changes (unless major version)

3. **Approval**
   - At least one maintainer approval
   - All conversations resolved
   - CI passing

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `test:` Tests
- `chore:` Build, deps, etc.
- `perf:` Performance improvement

**Examples:**
```
feat(web-vitals): add useCLS hook for layout shift tracking

fix(lcp): correct threshold comparison logic

docs(readme): add Next.js integration example

perf: reduce bundle size by 15%
```

---

## Common Contribution Scenarios

### Adding a New Hook

1. Create feature directory: `src/features/newFeature/`
2. Add files:
   - `types.ts` - Interfaces and types
   - `hook.ts` - Implementation
   - `index.ts` - Exports
3. Add tests in `hook.test.ts`
4. Update main `src/index.ts` to export
5. Update `tsup.config.ts` if new entry point needed
6. Update `.size-limit.json` with new hook size limits
7. Document in README.md
8. Add to CHANGELOG.md

### Fixing a Bug

1. Write a test that reproduces the bug
2. Fix the bug
3. Verify test passes
4. Update documentation if needed
5. Note in CHANGELOG.md

### Improving Performance

1. Measure current performance: `pnpm size`
2. Make changes
3. Verify improvement: `pnpm size`
4. Update CHANGELOG.md with results

### Updating Dependencies

1. Test with new version
2. Update package.json
3. Run `pnpm install`
4. Run full test suite: `pnpm test:ci`
5. Update CHANGELOG.md

---

## Getting Help

- **Questions?** [Start a discussion](https://github.com/opensite-ai/page-speed-hooks/discussions)
- **Bug reports?** [Open an issue](https://github.com/opensite-ai/page-speed-hooks/issues)
- **Need guidance?** Comment on existing PR/issue

---

## Recognition

Contributors are recognized in:
- `package.json` contributors field
- Release notes
- GitHub contributors list

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

Feel free to ask! We're here to help you contribute successfully.

**Thank you for contributing to @page-speed/hooks! 🚀**
