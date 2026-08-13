---
name: dependency-audit
description: Auditing, scanning, and resolving vulnerabilities in npm, pip, and open-source project dependencies.
---

# Dependency Audit Skill

This skill provides commands, triage procedures, and remediation workflows for auditing third-party software dependencies.

## Audit Workflow

### 1. Execute Vulnerability Scans
- **Node.js / npm**: `npm audit` or `npm audit --json`
- **Python**: `pip audit` or `safety check`
- **Go**: `govulncheck ./...`

### 2. Analyze Audit Output
- Filter by Severity (Critical, High, Moderate, Low).
- Verify if the vulnerable dependency is a direct runtime dependency or a devDependency used only at build time.

### 3. Remediation & Patching
- **Automatic Patching**: Run `npm audit fix`.
- **Force Major Upgrades**: For breaking changes, run `npm audit fix --force` only after reviewing changelogs and running test suites.
- **Overrides / Resolutions**: Use `overrides` in `package.json` to lock transitive dependencies to secure versions.
