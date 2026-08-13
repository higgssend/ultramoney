---
name: security-auditor
description: Automated and static detection of SQL Injection, XSS, CSRF, SSRF, RCE, Path Traversal, Command Injection, hardcoded secrets, and insecure JWTs.
---

# Security Auditor Skill

This skill provides comprehensive vulnerability scanning patterns and defense implementations for web applications and APIs.

## Vulnerability Detection Patterns

### 1. Injection Vulnerabilities
- **SQL / NoSQL Injection**: Ensure queries use parameterized inputs or prepared statements.
- **Command / Code Injection (`eval`, `exec`)**: Flag direct string execution or unsanitized shell commands.
- **Cross-Site Scripting (XSS)**: Verify DOM innerHTML escaping and proper React/framework JSX rendering.

### 2. Access Control & SSRF
- **Server-Side Request Forgery (SSRF)**: Validate external URLs against allowlists.
- **Path Traversal**: Sanitize file paths using `path.basename()` and prevent `../` directory escapes.
- **Insecure Direct Object References (IDOR)**: Enforce RLS policies and server-side ownership verification (`lender_id`).

### 3. Secrets & Tokens
- **Hardcoded Secrets**: Scan for API keys, DB credentials, or JWT signing keys in source code.
- **Insecure JWT Handling**: Enforce strong algorithms (RS256, HS256 with long keys) and HttpOnly cookies.
