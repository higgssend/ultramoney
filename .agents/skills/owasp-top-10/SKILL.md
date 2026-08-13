---
name: owasp-top-10
description: Practical auditing and defense strategies against the OWASP Top 10 web application security risks.
---

# OWASP Top 10 Security Skill

This skill outlines guidelines, vulnerability patterns, and defensive implementations for the OWASP Top 10 Web Application Security Risks.

## 1. A01:2021 - Broken Access Control
- Enforce strict server-side ownership checks (`lender_id = currentUser.id`).
- Disable directory browsing and restrict access to internal API endpoints.

## 2. A02:2021 - Cryptographic Failures
- Encrypt data at rest (AES-256) and in transit (TLS 1.3).
- Disable weak cipher suites and unencrypted legacy protocols.

## 3. A03:2021 - Injection
- Use parameterized SQL queries, ORMs, and strict schema validation.
- Sanitize and encode dynamic inputs before rendering or execution.

## 4. A04:2021 - Insecure Design
- Establish threat modeling and secure architecture patterns early in design.
- Enforce rate limiting, lockout policies, and defensive defaults.

## 5. A05:2021 - Security Misconfiguration
- Remove default credentials, unused features, and debug options.
- Maintain security headers (`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`).

## 6. A06:2021 - Vulnerable and Outdated Components
- Audit third-party dependencies regularly using package vulnerability tools.
- Lock dependency versions and patch known vulnerabilities promptly.

## 7. A07:2021 - Identification and Authentication Failures
- Implement multi-factor authentication (MFA) and strong password rules.
- Protect against credential stuffing, brute-force attacks, and session fixation.

## 8. A08:2021 - Software and Data Integrity Failures
- Verify digital signatures on npm packages, binaries, and automated updates.
- Protect CI/CD pipelines from unauthorized modifications.

## 9. A09:2021 - Security Logging and Monitoring Failures
- Log critical operations (logins, privilege escalations, failed attempts, data exports).
- Ensure central, tamper-evident log storage with active alerting.

## 10. A10:2021 - Server-Side Request Forgery (SSRF)
- Validate and sanitize all user-supplied URLs.
- Restrict outbound HTTP client calls using domain allowlists and private IP blocks.
