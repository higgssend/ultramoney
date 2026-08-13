---
name: api-inspector
description: REST & GraphQL API auditing, request/response validation, rate limiting, authentication, OpenAPI/Swagger specifications, and HTTP status codes.
---

# API Inspector Skill

This skill provides guidelines for designing, inspecting, and securing REST and GraphQL API contracts.

## Rules & Standards

### 1. REST Standards & Status Codes
- Use proper HTTP verbs (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
- Return standard status codes: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `429 Too Many Requests`.

### 2. Validation & Authentication
- Validate all incoming payloads against explicit Zod / Yup schemas.
- Protect endpoints with JWT or API Key authentication headers.
