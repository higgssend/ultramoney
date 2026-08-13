---
name: code-reviewer
description: Detect code smells, duplicated code, unused variables, long functions, high cyclomatic complexity, bad practices, and dead code using static analysis patterns.
---

# Code Reviewer Skill

This skill provides static analysis rules, code smell detection patterns, and refactoring guidelines to elevate code quality.

## Core Analysis Areas

### 1. Code Smells & Bad Practices
- **Long Functions / Methods**: Flag functions exceeding 50 lines. Break down into single-responsibility helpers.
- **Large Components / Classes**: Identify files with >300 lines of mixed logic and presentation.
- **Deep Nesting**: Avoid if/else nesting beyond 3 levels. Use early return guard clauses.
- **Magic Numbers & Strings**: Replace hardcoded values with named constants or enum definitions.

### 2. Duplicated & Dead Code
- **DRY Violations**: Detect duplicate logic across components or utility functions. Extract shared helpers.
- **Dead Code**: Flag unused imports, unreferenced variables, uncalled helper functions, or unreachable branches.

### 3. Complexity & Maintainability
- **Cyclomatic Complexity**: Keep cyclomatic complexity per function under 10.
- **Coupling & Cohesion**: High cohesion within modules, low coupling between modules.
