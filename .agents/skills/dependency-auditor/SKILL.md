---
name: dependency-auditor
description: Auditing unused npm libraries, outdated versions, vulnerable packages, lockfile conflicts, and bundle size impact.
---

# Dependency Auditor Skill

This skill provides procedures for auditing, trimming, and upgrading application dependencies.

## Key Actions

### 1. Unused & Redundant Package Cleanup
- Identify unimported npm packages.
- Replace heavy single-use libraries with native Web APIs or lightweight alternatives.

### 2. Vulnerability & Version Scanning
- Run dependency audit tools (`npm audit`, `depcheck`, `knip`).
- Pin exact versions in lockfiles to ensure deterministic builds.
