---
name: ai-security
description: Defense mechanisms against prompt injection, model poisoning, data leakage, insecure output handling, and OWASP Top 10 for LLMs.
---

# AI Security Skill

This skill provides guidelines and countermeasures for securing AI models, Large Language Models (LLMs), agentic frameworks, and RAG architectures.

## OWASP Top 10 for LLM Applications

### 1. Prompt Injection (Direct & Indirect)
- **Direct**: Adversarial prompts attempting to override system instructions.
- **Indirect**: Untrusted inputs (retrieved web content, documents, user data) embedding hidden malicious prompts.
- *Mitigation*: Separate system instructions from user inputs, sanitize input text, and use strict tool privilege boundaries.

### 2. Insecure Output Handling
- Never execute unparsed LLM output directly as code, SQL, or raw HTML.
- Validate and parse structured JSON responses against explicit schemas before executing actions.

### 3. Training Data Poisoning / RAG Poisoning
- Validate and verify data sources used for RAG indexing or fine-tuning.
- Implement access control on vector databases.

### 4. Model Denial of Service (DoS)
- Enforce token limits, request rate limits, and execution timeouts on model API requests.

### 5. Sensitive Information Disclosure
- Filter system prompts and vector context for PII, secrets, or internal system details before generating output.
- Mask keys, tokens, and credentials in conversation contexts.
