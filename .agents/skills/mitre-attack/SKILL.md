---
name: mitre-attack
description: MITRE ATT&CK framework mapping for enterprise, web, cloud, and adversary tactics, techniques, and procedures (TTPs).
---

# MITRE ATT&CK Skill

This skill provides adversary tactics, techniques, and mitigation controls mapped against the MITRE ATT&CK framework.

## Core Tactics & Relevant Techniques

### 1. Initial Access (TA0001)
- **Exploit Public-Facing Application (T1190)**: Exploiting web app vulnerabilities. *Mitigation*: WAF, input validation, patching.
- **Valid Accounts (T1078)**: Using stolen credentials. *Mitigation*: MFA, password rotation, anomaly detection.

### 2. Execution (TA0002)
- **Command and Scripting Interpreter (T1059)**: Executing shell or PowerShell scripts. *Mitigation*: Restrict execution policies, disable eval.

### 3. Persistence (TA0003) & Privilege Escalation (TA0004)
- **Account Manipulation (T1098)**: Modifying roles or user privileges. *Mitigation*: Immutable audit logging, RBAC checks.

### 4. Credential Access (TA0006)
- **Brute Force (T1110)**: Password spraying or credential stuffing. *Mitigation*: Rate limiting, lockout policies, CAPTCHA.

### 5. Exfiltration (TA0010)
- **Exfiltration Over Web Service (T1567)**: Transferring data to unauthorized external endpoints. *Mitigation*: Egress filtering, DLP rules.
