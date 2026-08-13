---
name: threat-modeling
description: Frameworks, methodologies (STRIDE, PASTA), data flow analysis, and attack surface mapping for modeling application threats and architecture risks.
---

# Threat Modeling Skill

This skill provides methodologies, templates, and actionable procedures for performing threat modeling on system architectures, microservices, and applications.

## Methodologies

### 1. STRIDE Threat Model
- **Spoofing (Authentication)**: Impersonating another user or system. *Mitigation*: Strong MFA, digital signatures, mutual TLS.
- **Tampering (Integrity)**: Modifying data in transit or at rest. *Mitigation*: HMAC signatures, TLS 1.3, DB encryption, RLS policies.
- **Repudiation (Non-repudiation)**: Denying having performed an action. *Mitigation*: Immutable audit logging, digital signatures.
- **Information Disclosure (Confidentiality)**: Exposing sensitive data. *Mitigation*: Encryption, strict access controls, masking.
- **Denial of Service (Availability)**: Overwhelming resources. *Mitigation*: Rate limiting, CDN protection, auto-scaling, timeouts.
- **Elevation of Privilege (Authorization)**: Gaining unauthorized access levels. *Mitigation*: Least privilege, principle of default-deny.

### 2. Threat Modeling Workflow
1. **Define Architecture & Boundaries**: Map entry points, trust boundaries, external dependencies, and data flows.
2. **Identify Assets**: Identify PII, financial data, access tokens, database credentials, and critical application features.
3. **Enumerate Threats**: Apply STRIDE or PASTA across data flow diagrams (DFDs).
4. **Determine Risk Score**: Assess Impact (High/Med/Low) vs Likelihood (High/Med/Low).
5. **Formulate Countermeasures**: Design specific security controls to mitigate each identified threat.
