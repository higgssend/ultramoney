---
name: secure-code-review
description: Comprehensive guidelines, checklists, and automated patterns for conducting secure code reviews across frontend, backend, APIs, authentication, and database layers.
---

# Secure Code Review Skill

This skill provides step-by-step procedures, vulnerability detection patterns, and remediation guidance for secure code reviews.

## When to Activate
Activate this skill when reviewing pull requests, inspecting source code, auditing authentication/authorization flows, checking input validation, or verifying data sanitization.

## Core Security Review Pillars

### 1. Authentication & Authorization
- **Token Handling**: Ensure JWTs or session tokens are stored securely (HttpOnly cookies or encrypted storage), never exposed in URLs or client logs.
- **Role-Based Access Control (RBAC)**: Verify server-side authorization checks on all endpoint handlers (`lender_id`, user ID checks).
- **Session Lifecycle**: Invalidate tokens on logout, enforce idle timeout, and regenerate session IDs on privilege changes.

### 2. Data Validation & Injection Prevention
- **SQL / NoSQL Injection**: Ensure all database queries use parameterized prepared statements or safe ORM/query builder interfaces.
- **Cross-Site Scripting (XSS)**: HTML-encode user inputs before rendering. Escape untrusted dynamic strings in HTML templates.
- **Command Injection**: Avoid `eval()`, `exec()`, or unsanitized shell commands. Use strict argument lists instead of raw shell concatenation.

### 3. Cryptography & Secrets Handling
- **No Hardcoded Credentials**: Scan for API keys, private keys, database passwords, or JWT secrets in code files.
- **Strong Algorithms**: Use AES-256-GCM, RSA-4096, or ECC. Hash passwords using Argon2id or bcrypt with sufficient cost factors.
- **TLS Enforcement**: Enforce HTTPS for all web traffic and API endpoints.

### 4. Error Handling & Information Disclosure
- **Sanitized Error Responses**: Never leak full stack traces, database schemas, or internal server paths to end users.
- **Structured Logging**: Mask sensitive fields (passwords, PINs, SSNs, credit card numbers) before logging.

## Code Review Workflow Checklist
1. **Input Boundary Review**: Check all user-controlled entry points (query params, body, headers, cookies, file uploads).
2. **Business Logic Auditing**: Check for race conditions, broken workflow states, edge-case bypasses, or price manipulation.
3. **Dependency Check**: Audit third-party packages for known vulnerabilities using dependency scanners.
4. **Verification**: Run unit/integration tests with malformed and boundary inputs.
