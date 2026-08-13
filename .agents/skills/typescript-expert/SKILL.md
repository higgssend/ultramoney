---
name: typescript-expert
description: Advanced TypeScript type-safety rules, removing unnecessary any types, interfaces vs types, generics, type inference, and strict mode compliance.
---

# TypeScript Expert Skill

This skill provides advanced TypeScript typing patterns, type inference rules, and strict-mode practices.

## Guidelines

### 1. Eliminate `any`
- Replace `any` with precise interface definitions, `unknown`, union types, or generics.
- Use type narrowing (`typeof`, `instanceof`, `in`, or custom type guards).

### 2. Interfaces & Generics
- Use `interface` for object models and public API contracts.
- Use `type` for unions, primitives, tuples, and utility types.
- Leverage generics `<T>` for reusable data mappers, contexts, and API wrappers.

### 3. Strict Mode Compliance
- Enforce `strictNullChecks`, `noImplicitAny`, and `exactOptionalPropertyTypes`.
