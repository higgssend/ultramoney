---
name: react-expert
description: Best practices for React Hooks, useEffect dependency arrays, state management, Context API, Server/Client components, Suspense, and hydration error debugging.
---

# React Expert Skill

This skill provides idiomatic patterns, architectural guidelines, and debugging rules for modern React applications.

## Best Practices

### 1. Hooks Lifecycle & State
- **`useEffect` Rules**: Use `useEffect` only for external side-effects (fetching, subscriptions), not for deriving state from props.
- **State Normalization**: Avoid redundant or deeply nested state. Keep state minimal and compute derived values.

### 2. Context & Component Design
- Split Context providers by domain (Auth, Settings, Loans, Accounting) to prevent global re-render cascades.
- Maintain a clear boundary between UI presentation components and container/context logic.
