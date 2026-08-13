---
name: database-expert
description: Relational database design, PostgREST / PostgreSQL queries, index optimization, RLS policies, normalization, and migration scripts.
---

# Database Expert Skill

This skill provides query optimization techniques, schema design rules, index strategies, and Row-Level Security (RLS) enforcement.

## Database Guidelines

### 1. Schema & Indexing
- Enforce foreign keys with cascading options where appropriate.
- Index foreign key columns (`client_id`, `lender_id`, `loan_id`) and frequently queried status columns.

### 2. Row-Level Security (RLS)
- Enforce multi-tenant data isolation using `auth.uid() = lender_id`.
- Ensure write policies prevent unauthorized tenant data mutation.
