---
name: performance-optimizer
description: Profiling and optimizing React re-renders, repetitive database queries, inefficient loops, heavy components, lazy loading, bundle size, and caching strategies.
---

# Performance Optimizer Skill

This skill provides optimization techniques for web application speed, rendering performance, bundle size, and memory usage.

## Key Focus Areas

### 1. React Render Optimization
- **Prevent Unnecessary Re-renders**: Wrap expensive components in `React.memo` and stable callbacks in `useCallback`.
- **Memoize Computation**: Cache heavy calculations using `useMemo`.

### 2. Code Splitting & Lazy Loading
- Dynamic imports (`React.lazy(() => import(...))`) for route-level code splitting.
- Tree-shaking unused modules and heavy libraries.

### 3. Data & Query Efficiency
- Batching requests and using stale-while-revalidate client caching.
- Optimizing array iteration algorithms (`O(n)` maps/lookups instead of nested `O(n^2)` loops).
