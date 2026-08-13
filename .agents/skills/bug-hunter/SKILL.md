---
name: bug-hunter
description: Pre-execution static defect analysis for null/undefined dereferences, unhandled promises, race conditions, memory leaks, broken imports, and type mismatches.
---

# Bug Hunter Skill

This skill analyzes code before execution to catch logic bugs, runtime exceptions, and edge-case failures.

## Defect Patterns

### 1. Null / Undefined Dereferencing
- **Optional Chaining**: Ensure property access on potentially null objects uses `?.` or explicit non-null checks.
- **Array Destructuring**: Guard against destructuring empty or undefined array results.

### 2. Async & Promise Handling
- **Missing `await`**: Flag floating promises or un-awaited async calls that bypass try/catch blocks.
- **Race Conditions**: Identify shared state mutations in parallel async requests without lock/mutex guards.

### 3. Memory & Resource Leaks
- **Event Listener Cleanup**: Ensure `addEventListener`, `setInterval`, or WebSocket subscriptions are cleaned up on component unmount.
- **Stale Closures**: Check for missing dependencies in React `useEffect` or `useCallback`.
