---
name: full-project-auditor
description: Master orchestrator skill that coordinates security, code quality, performance, architecture, accessibility, test coverage, and dependency audits into a single unified report with a 0-100 project health score.
---

# Full Project Auditor Skill (Master Orchestrator)

This skill orchestrates all specialized agent skills to execute an end-to-end audit of the entire project repository.

## Audit Workflow

When invoked, the Full Project Auditor conducts a multi-dimensional assessment across 6 core pillars:

1. **Security & Vulnerabilities**: Runs `security-auditor`, `secrets-detection`, `owasp-top-10`, and `dependency-audit`.
2. **Code Quality & Static Analysis**: Runs `code-reviewer`, `typescript-expert`, `bug-hunter`, and `refactor-expert`.
3. **Performance & Optimization**: Runs `performance-optimizer` and `react-expert`.
4. **Architecture & Modularization**: Runs `architecture-reviewer` and `database-expert`.
5. **UI/UX & Accessibility**: Runs `ui-ux-inspector` and `accessibility-auditor`.
6. **Testing & CI/CD Integrity**: Runs `test-engineer` and `cicd-expert`.

## Output Report Format

The auditor outputs a comprehensive markdown report containing:

```markdown
# 📊 Audit Report: [Project Name]

## 🌟 Overall Project Health Score: [88 / 100]

### Summary Score Breakdown
- **Security & Secrets**: 95 / 100
- **Code Quality & Types**: 90 / 100
- **Performance**: 85 / 100
- **Architecture & DB**: 92 / 100
- **UI/UX & Accessibility**: 82 / 100
- **Test Coverage & CI/CD**: 84 / 100

---

## 🚨 Critical & High Priority Issues
| # | Category | Severity | Issue Description | Recommended Action |
|---|---|---|---|---|
| 1 | Security | High | Missing RLS policy on table X | Apply RLS script |

## 💡 Recommendations & Next Steps
1. Immediate actions...
2. Short-term refactoring...
```
