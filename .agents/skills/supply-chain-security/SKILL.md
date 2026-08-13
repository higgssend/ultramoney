---
name: supply-chain-security
description: Securing software build pipelines, package dependencies, SBOM generation, package pinning, and CI/CD security controls.
---

# Supply Chain Security Skill

This skill provides frameworks and actionable controls for protecting software supply chains, build infrastructure, and package dependencies.

## Key Risk Areas & Controls

### 1. Package Dependency Integrity
- **Lockfile Pinning**: Lock all exact package versions in `package-lock.json` or `yarn.lock`.
- **Typosquatting & Malicious Packages**: Verify package author, download counts, and repository links before adding new packages.
- **Transitive Dependencies**: Scan full dependency trees for vulnerabilities and malicious scripts.

### 2. Software Bill of Materials (SBOM)
- Generate SBOMs (CycloneDX or SPDX) for releases.
- Track components, licenses, and maintainer details across environments.

### 3. CI/CD Pipeline Hardening
- Enforce least privilege for CI/CD runner tokens and secrets.
- Pin GitHub Actions or CI plugins to specific full commit SHA hashes rather than mutable tags.
- Run builds in isolated, reproducible ephemeral environments.
