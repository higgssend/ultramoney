---
name: secrets-detection
description: Automated scanning, regex patterns, entropy analysis, and pre-commit controls to detect exposed API keys, credentials, and tokens.
---

# Secrets Detection Skill

This skill provides patterns and scanning procedures for detecting hardcoded secrets, API keys, certificates, and private credentials in codebases and git histories.

## Detection Techniques

### 1. High-Entropy Pattern Matching
Scan for strings with high Shannon entropy that indicate generated keys or secrets.

### 2. Known API Key Regex Patterns
- **OpenAI / OpenRouter API Keys**: `sk-[a-zA-Z0-9]{32,}`
- **Generic Bearer Tokens**: `Bearer\s+[a-zA-Z0-9\-\._~\+\/]+=*`
- **AWS Access Keys**: `AKIA[0-9A-Z]{16}`
- **Private RSA / ECC Keys**: `-----BEGIN (RSA|EC|PGP|OPENSSH) PRIVATE KEY-----`
- **Database Connection Strings**: `postgres://[a-zA-Z0-9_]+:[^@]+@[a-zA-Z0-9\._\-]+`

## Best Practices & Remediation
1. **Never Commit Secrets**: Environment variables (`.env.local`) must be added to `.gitignore`.
2. **Immediate Revocation**: If a secret is committed, revoke and rotate it immediately. Cleaning git history alone is insufficient.
3. **Use Secret Managers**: Store production credentials in secure vaults (InsForge Secrets, GCP Secret Manager, AWS Secrets Manager).
