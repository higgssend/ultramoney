# TypeScript Strict Typing

## Purpose

Enforce strong, explicit, and predictable TypeScript typing across the entire codebase.

The primary objective is to eliminate unnecessary use of:

- `any`
- `unknown`
- `object`
- `{}`
- `Function`
- overly broad unions
- unsafe type assertions
- implicit types when the type should be explicit

Whenever the actual type is known or can reasonably be inferred from the application's domain, **always use the most specific appropriate type**.

---

# Core Rule

> If the type is known, use the known type. Never replace a known type with `any`, `unknown`, `object`, or another generic type.

Bad:

```ts
function getUser(user: any) {
  return user.name;
}
```

Good:

```ts
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(user: User) {
  return user.name;
}
```

---

# Type Priority

When choosing a type, follow this priority:

1. Existing domain type
2. Existing interface
3. Existing type alias
4. Specific primitive type
5. Specific object structure
6. Generic type
7. Union type
8. Runtime validation with `unknown`
9. `any` only as an exceptional last resort

Never jump directly to `any`.

---

# No `any` Policy

`any` MUST NOT be used when the type can be determined.

Do not write:

```ts
const user: any = ...
```

```ts
function process(data: any) {}
```

```ts
const response: any = await fetch(...)
```

```ts
const items: any[] = []
```

Instead, determine the actual structure.

```ts
interface User {
  id: string;
  name: string;
  email: string;
}

const user: User = ...
```

For arrays:

```ts
const users: User[] = [];
```

For functions:

```ts
function process(user: User): void {
  ...
}
```

---

# `unknown` Policy

`unknown` is allowed ONLY when the type is genuinely unknown at the boundary of the application.

Valid use cases include:

- external API responses before validation
- parsed JSON before schema validation
- user-controlled data
- `catch` variables
- third-party libraries that return unknown data
- generic infrastructure where the type cannot be known yet

Example:

```ts
function parseResponse(data: unknown): User {
  if (!isUser(data)) {
    throw new Error("Invalid user");
  }

  return data;
}
```

After validation, immediately narrow the type.

Do NOT propagate `unknown` throughout the application.

Bad:

```ts
function getUser(): unknown {
  ...
}

const user = getUser();

renderUser(user);
```

Better:

```ts
function getUser(): User {
  ...
}

const user = getUser();

renderUser(user);
```

---

# Never Use `unknown` as a Replacement for Proper Types

Do not use:

```ts
interface Props {
  data: unknown;
}
```

if the component knows what `data` represents.

Use:

```ts
interface Props {
  data: User;
}
```

Likewise, avoid:

```ts
const data: unknown = users;
```

when `users` is already typed.

---

# Object Types

Avoid:

```ts
object
```

when the object's structure is known.

Bad:

```ts
function updateUser(data: object) {}
```

Good:

```ts
interface UpdateUserInput {
  name?: string;
  email?: string;
}

function updateUser(data: UpdateUserInput) {}
```

If the object is dynamic, use a specific `Record`.

Bad:

```ts
const config: object = {};
```

Better:

```ts
const config: Record<string, string> = {};
```

Or, if values have different known types:

```ts
interface Config {
  apiUrl: string;
  timeout: number;
  enabled: boolean;
}

const config: Config = {
  apiUrl: "...",
  timeout: 5000,
  enabled: true,
};
```

---

# Never Use `{}` as a Generic Object Type

Avoid:

```ts
const data: {} = {};
```

The `{}` type does NOT mean "plain object".

Use a specific interface or:

```ts
Record<string, unknown>
```

only when the object genuinely has arbitrary keys and unknown values.

If the values have a known type:

```ts
Record<string, string>
```

---

# Never Use `Function`

Avoid:

```ts
const callback: Function = () => {};
```

Use a specific function signature:

```ts
const callback: () => void = () => {};
```

With parameters:

```ts
const callback: (id: string) => Promise<void> = async (id) => {
  ...
};
```

Prefer named types for reusable callbacks:

```ts
type UserHandler = (user: User) => void;
```

---

# Prefer Interfaces or Type Aliases for Domain Models

Create reusable domain types.

Example:

```ts
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}
```

For entities:

```ts
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}
```

For input models:

```ts
interface CreateProductInput {
  name: string;
  price: number;
  stock: number;
}
```

For update models:

```ts
interface UpdateProductInput {
  name?: string;
  price?: number;
  stock?: number;
}
```

Do not reuse an entity type when the API input has a different shape.

---

# Separate Domain Types

Avoid using one giant interface for everything.

Bad:

```ts
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}
```

for every operation.

Prefer:

```ts
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

interface UpdateUserInput {
  name?: string;
  email?: string;
}
```

---

# Use Generics Instead of `any`

When a function works with multiple types, use generics.

Bad:

```ts
function first(items: any[]) {
  return items[0];
}
```

Good:

```ts
function first<T>(items: T[]): T | undefined {
  return items[0];
}
```

Another example:

```ts
function identity<T>(value: T): T {
  return value;
}
```

---

# Generic API Responses

Do not create:

```ts
interface ApiResponse {
  data: any;
}
```

Use generics:

```ts
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}
```

Then:

```ts
type UserResponse = ApiResponse<User>;

type ProductResponse = ApiResponse<Product>;
```

For lists:

```ts
type UserListResponse = ApiResponse<User[]>;
```

---

# Arrays Must Be Typed

Avoid:

```ts
const users = [];
```

when the type cannot be inferred correctly.

Prefer:

```ts
const users: User[] = [];
```

For objects:

```ts
const usersById: Record<string, User> = {};
```

For nullable values:

```ts
const selectedUser: User | null = null;
```

---

# Use Union Types When the Domain Has Fixed Values

Bad:

```ts
const status: string = "pending";
```

if only specific statuses are valid.

Good:

```ts
type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

const status: OrderStatus = "pending";
```

For reusable domain values:

```ts
type UserRole = "admin" | "manager" | "employee" | "client";
```

---

# Avoid Broad Strings and Numbers

If a value has a restricted domain, encode that restriction in the type.

Bad:

```ts
type Payment = {
  status: string;
};
```

Good:

```ts
type PaymentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "refunded";

interface Payment {
  status: PaymentStatus;
}
```

---

# Nullable Values

Represent nullability explicitly.

Bad:

```ts
const user: User = null;
```

Good:

```ts
const user: User | null = null;
```

If undefined is possible:

```ts
const user: User | undefined;
```

Do not use `any` to avoid handling nullability.

---

# Optional Properties

Use optional properties when a property may legitimately not exist.

```ts
interface User {
  id: string;
  name: string;
  avatar?: string;
}
```

Do not use:

```ts
avatar: any;
```

to represent optional data.

---

# Type Narrowing

Prefer type guards and control-flow narrowing instead of assertions.

Bad:

```ts
const user = data as User;
```

Better:

```ts
function isUser(data: unknown): data is User {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    "name" in data
  );
}
```

Then:

```ts
if (isUser(data)) {
  console.log(data.name);
}
```

---

# Type Assertions

`as` should NOT be used simply to silence TypeScript.

Avoid:

```ts
const user = data as User;
```

when `data` has not actually been validated.

Assertions are acceptable when:

1. TypeScript genuinely cannot infer something that is guaranteed by the application.
2. The developer has verified the runtime shape.
3. There is no better typing strategy.

Even then, prefer improving the source type instead.

---

# API Responses

Never assume external data is correctly typed.

At the API boundary:

```ts
const data: unknown = await response.json();
```

Validate it.

Then convert it into a domain type:

```ts
const user: User = parseUser(data);
```

After that point, the application should work with `User`, not `unknown`.

Recommended flow:

```text
External Data
     ↓
unknown
     ↓
Validation
     ↓
Domain Type
     ↓
Application
```

Never allow unvalidated external data to spread through the application.

---

# Runtime Validation

For external or untrusted data, use runtime schemas when appropriate.

Example with Zod:

```ts
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

type User = z.infer<typeof UserSchema>;
```

Then:

```ts
const user = UserSchema.parse(data);
```

The result is strongly typed.

Prefer schema inference over duplicating the same structure manually.

---

# React Props

Never use:

```ts
interface Props {
  data: any;
}
```

Define the actual props.

```ts
interface UserCardProps {
  user: User;
  onSelect: (user: User) => void;
}
```

Component:

```tsx
function UserCard({
  user,
  onSelect,
}: UserCardProps) {
  ...
}
```

---

# React State

Avoid:

```ts
const [data, setData] = useState<any>(null);
```

Use:

```ts
const [user, setUser] = useState<User | null>(null);
```

For arrays:

```ts
const [users, setUsers] = useState<User[]>([]);
```

For loading states:

```ts
const [loading, setLoading] = useState<boolean>(false);
```

Type inference is acceptable when the initial value clearly establishes the type:

```ts
const [loading, setLoading] = useState(false);
```

Do not add unnecessary explicit types when TypeScript already infers them correctly.

---

# Event Types

Use React's appropriate event types.

Bad:

```ts
const handleChange = (event: any) => {};
```

Good:

```ts
const handleChange = (
  event: React.ChangeEvent<HTMLInputElement>
) => {};
```

Button:

```ts
const handleClick = (
  event: React.MouseEvent<HTMLButtonElement>
) => {};
```

Form:

```ts
const handleSubmit = (
  event: React.FormEvent<HTMLFormElement>
) => {};
```

---

# Error Handling

Do not automatically type errors as `any`.

Modern TypeScript treats catch variables as `unknown`.

Use:

```ts
try {
  ...
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  }
}
```

If the project has custom errors, use them explicitly.

```ts
class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}
```

---

# Database Types

Database records should have explicit domain types.

Bad:

```ts
const users: any[] = await db.users.findMany();
```

Good:

```ts
const users: User[] = await db.users.findMany();
```

If using an ORM that generates types automatically, use those generated types whenever possible.

Do not recreate database types unnecessarily if the ORM already provides authoritative types.

---

# Form Data

Define form schemas/types.

Bad:

```ts
const formData: any = getFormData();
```

Good:

```ts
interface LoginForm {
  email: string;
  password: string;
}
```

For complex forms, prefer a validation schema.

---

# API Request Types

Every API endpoint should have typed:

- request parameters
- query parameters
- request body
- response
- errors when practical

Example:

```ts
interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}

interface CreateUserResponse {
  user: User;
}
```

---

# Avoid Type Duplication

Before creating a new type, search the project for an existing equivalent.

Do NOT create:

```ts
interface UserData {
  id: string;
  name: string;
}
```

if the project already has:

```ts
interface User {
  id: string;
  name: string;
}
```

Reuse the existing canonical type.

---

# Utility Types

Use TypeScript utility types when appropriate.

Examples:

```ts
type UpdateUserInput = Partial<User>;
```

```ts
type UserPreview = Pick<User, "id" | "name">;
```

```ts
type UserWithoutId = Omit<User, "id">;
```

```ts
type RequiredUser = Required<User>;
```

Do not duplicate structures unnecessarily.

---

# Avoid Excessive Type Complexity

Strong typing does NOT mean creating unnecessarily complicated types.

Prefer:

```ts
type UserRole = "admin" | "user";
```

over an unnecessarily complex generic abstraction.

The goal is:

> Maximum type safety with minimum unnecessary complexity.

---

# Inference Rule

Do not explicitly type variables when TypeScript already infers the exact correct type.

Acceptable:

```ts
const name = "Manuel";
const age = 30;
const active = true;
```

Not necessary:

```ts
const name: string = "Manuel";
const age: number = 30;
const active: boolean = true;
```

However, explicit typing is recommended when:

- defining function parameters
- defining function return contracts
- defining domain models
- defining empty collections
- defining nullable state
- defining public APIs
- defining complex objects
- documenting important business rules

---

# Function Return Types

Public functions, services, utilities, hooks, and important business logic should have explicit return types.

Example:

```ts
function getUser(id: string): Promise<User> {
  ...
}
```

Instead of relying on complex inferred return types.

For simple local functions, inference is acceptable:

```ts
const double = (value: number) => value * 2;
```

---

# Type Naming

Use descriptive names.

Good:

```ts
User
CreateUserInput
UpdateUserInput
UserResponse
UserRole
UserStatus
PaginationParams
PaginationResponse
```

Avoid:

```ts
Data
Info
Object
ResponseData
Thing
Stuff
Item
```

unless the generic meaning is genuinely intended.

---

# Enforce Strict TypeScript

The project should preferably use:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true
  }
}
```

Do not weaken TypeScript configuration simply to make existing errors disappear.

Never solve typing errors by adding `any`.

---

# When `any` Is Truly Necessary

`any` is permitted only as a documented exception.

If absolutely unavoidable:

```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// External library exposes an untyped legacy API.
const legacyData: any = legacyLibrary.getData();
```

The exception must:

1. Be isolated.
2. Be documented.
3. Have a clear reason.
4. Not spread to the rest of the application.
5. Be removed if a proper type becomes available.

Never introduce `any` merely because typing is inconvenient.

---

# Forbidden Shortcuts

Never solve a TypeScript error by blindly using:

```ts
any
```

```ts
unknown
```

```ts
as any
```

```ts
as unknown as SomeType
```

```ts
object
```

```ts
{}
```

```ts
Function
```

These are not valid substitutes for understanding the data model.

Especially avoid:

```ts
data as unknown as User
```

This is considered a red flag and must be investigated before being used.

---

# Code Review Checklist

Before considering TypeScript code complete, verify:

- [ ] No unnecessary `any`.
- [ ] No unnecessary `unknown`.
- [ ] No `object` where a structure can be defined.
- [ ] No `{}` used as a generic object type.
- [ ] No `Function` types.
- [ ] API responses have explicit types.
- [ ] External data is validated before entering the domain layer.
- [ ] React props are explicitly typed.
- [ ] React state is correctly typed.
- [ ] Empty arrays have an appropriate type.
- [ ] Nullable values use `T | null`.
- [ ] Optional values use `T | undefined` or optional properties.
- [ ] Fixed values use union types.
- [ ] Reusable structures use interfaces/types.
- [ ] Generic functions use generics instead of `any`.
- [ ] Existing project types are reused.
- [ ] Type assertions are justified.
- [ ] `as unknown as` is avoided.
- [ ] TypeScript strict mode is enabled.
- [ ] Types reflect the real runtime data.
- [ ] No typing shortcuts were introduced just to silence compiler errors.

---

# Agent Behavior

When modifying TypeScript code:

1. Inspect existing types before creating new ones.
2. Determine the real shape of the data.
3. Search for existing domain models.
4. Reuse canonical types.
5. Create a specific type when none exists.
6. Use generics when the operation is intentionally type-independent.
7. Use unions for finite sets of valid values.
8. Use `unknown` only at genuinely unknown boundaries.
9. Validate `unknown` before using it.
10. Never use `any` to bypass a TypeScript error.
11. Never weaken `tsconfig` to hide typing problems.
12. Prefer fixing the source of the type problem rather than casting the result.
13. Keep types close to their domain when appropriate.
14. Remove unnecessary casts whenever possible.
15. Run the TypeScript compiler after significant typing changes.

The agent should treat TypeScript's type system as a design tool, not an obstacle.

---

# Final Principle

> **Known data → specific type.**
>
> **Variable data → generic type.**
>
> **Finite values → union type.**
>
> **Reusable structure → interface/type.**
>
> **External untrusted data → unknown + validation.**
>
> **`any` → exceptional last resort, never the default.**