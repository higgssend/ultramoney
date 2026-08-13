---
description: Project-scoped rules for UltraMoney
globs: *
alwaysApply: true
---

# TypeScript Strict Typing — Zero `any`

## Rule: Never use `any` in application code

Every variable, parameter, return type, and generic must have an explicit, accurate TypeScript type.
Violations break the type-safety contract and hide real bugs from the compiler.

### Forbidden patterns

```ts
// Explicit any
const data: any = response.data;
forEach((c: any) => ...);
as any
(x as any).foo
```

### Required alternatives

| Instead of              | Use                                                 |
|-------------------------|-----------------------------------------------------|
| `any`                   | The real type, a union, or a type guard             |
| `as any`                | Proper casting with a comment explaining why        |
| `(x: any) =>`          | The typed parameter from types.db.ts or an import  |
| `.catch(() => {})` on a non-Promise | `void (async () => { await ... })()` |

### Insforge / PostgREST specifics

`insforge.database.from(...)` returns `PostgrestFilterBuilder`, NOT a `Promise`.
To fire-and-forget use the void + async IIFE pattern:

```ts
void (async () => {
  await insforge.database.from('table').update({ ... }).eq('id', id);
})();
```

When mapping DB rows (LoanDB, ClientDB, etc.) always use the types in types.db.ts.
Never annotate rows with `any` — extend/update types.db.ts if a column is missing.

### ESLint enforcement

This project has `@typescript-eslint/no-explicit-any` set to "error".
If a build or lint run suppresses this rule, reject it and fix the types instead.
