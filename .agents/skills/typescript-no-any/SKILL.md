---
name: typescript-no-any
description: >
  Enforce strict TypeScript typing in UltraMoney — no `any` types allowed.
  Activate when writing or editing any .ts/.tsx file, especially when dealing
  with Insforge DB rows, PostgREST builder chains, or fire-and-forget async ops.
---

# Skill: TypeScript Strict Typing (No `any`)

## When this skill activates

- You are about to write `any`, `: any`, `as any`, or `(x: any) =>` in a .ts/.tsx file
- You need to map DB rows from Insforge (loans, clients, payments, etc.)
- You need a fire-and-forget database write that must not block rendering
- The IDE shows an error about a missing method on a PostgREST builder type

---

## Core Rule

**Never use `any`.** TypeScript exists to catch bugs at compile time.
Every `any` you write is a bug you are hiding from yourself.

---

## Pattern 1: Typing Insforge DB rows

Always use (or extend) the types defined in `types.db.ts`:

```ts
// types.db.ts already has:
interface LoanDB { id: string; clientid: string; clientname: string; ... }
interface ClientDB { id: string; name: string; lastname: string; ... }

// CORRECT — use the type
import type { LoanDB, ClientDB } from '../../types.db';
const loan = row as LoanDB;

// WRONG — hides column shape from compiler
const loan = row as any;
```

If a column is missing from the interface, **add it to `types.db.ts`** — do NOT fall back to `any`.

---

## Pattern 2: Mapping client rows from Insforge

When fetching only a subset of columns, declare a local inline type:

```ts
// CORRECT
type ClientRow = { id: string; name: string; lastname: string | null };
const map = new Map<string, string>();
(clientsRes.data as ClientRow[]).forEach((c) => {
  map.set(c.id, `${c.name} ${c.lastname ?? ''}`.trim());
});

// WRONG
clientsRes.data.forEach((c: any) => { ... });
```

---

## Pattern 3: Fire-and-forget Insforge DB writes

`insforge.database.from(...)` returns `PostgrestFilterBuilder`, which is **NOT** a Promise.
It has no `.catch()` method. Use the `void` + async IIFE pattern instead:

```ts
// CORRECT — TypeScript-safe fire-and-forget
void (async () => {
  await insforge.database
    .from('loans')
    .update({ clientname: name })
    .eq('id', loanId);
})();

// WRONG — .catch() does not exist on PostgrestFilterBuilder
insforge.database.from('loans').update({ ... }).eq('id', id).catch(() => {});
```

---

## Pattern 4: Type assertions with justification

If you genuinely need an assertion (rare), document WHY in a comment:

```ts
// InsForge SDK returns `unknown` here; runtime shape is validated above
const settings = raw as CompanySettings;
```

Never use `as any` — always cast to the narrowest type you can justify.

---

## Pattern 5: ESLint rule

The project enforces:
```json
"@typescript-eslint/no-explicit-any": "error"
```

If lint fails because of `any`, fix the types — do not disable the rule.

---

## Quick Reference Table

| Situation                           | Correct pattern                          |
|-------------------------------------|------------------------------------------|
| DB row from Insforge                | `row as LoanDB` (from types.db.ts)       |
| Partial select columns              | Inline `type RowShape = { ... }`         |
| forEach on DB result                | `(row: RowType) =>`                      |
| Fire-and-forget Insforge write      | `void (async () => { await ... })()`     |
| Unknown union                       | `unknown`, then type guard               |
| Third-party lib with no types       | `// eslint-disable-next-line` + comment  |
