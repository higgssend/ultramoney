---
name: architecture-reviewer
description: Detecting circular dependencies, tight coupling, layer violations, scalability bottlenecks, microservice boundaries, and modularization issues.
---

# Architecture Reviewer Skill

This skill provides static architectural auditing rules, dependency graph evaluation, and modular decoupling guidelines.

## Architecture Checklist

### 1. Circular Dependencies & Coupling
- Flag circular module imports (`A -> B -> A`).
- Separate data access layers (SDK/DB) from UI components and context providers.

### 2. Scalability & Modularization
- Enforce clear domain module boundaries (Auth, Clients, Loans, Accounting, Inventory).
- Prevent leaky abstractions across features.
