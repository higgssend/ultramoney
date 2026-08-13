---
name: accessibility-auditor
description: WCAG 2.1/2.2 AA compliance auditing, missing aria-labels, color contrast, keyboard navigation, image alt attributes, and focus traps.
---

# Accessibility Auditor Skill

This skill provides testing procedures and guidelines for Web Content Accessibility Guidelines (WCAG 2.1/2.2 AA) compliance.

## Audit Checklist

### 1. ARIA & Semantic HTML
- Use semantic HTML tags (`<main>`, `<nav>`, `<header>`, `<article>`, `<button>`).
- Add descriptive `aria-label` or `aria-labelledby` to icon-only buttons and interactive elements.

### 2. Color Contrast & Keyboard Navigation
- Ensure text contrast meets minimum 4.5:1 ratio (3:1 for large text).
- Visible focus rings (`focus-visible:ring-2`) on all interactive controls.
- Full keyboard accessibility (Tab, Enter, Space, Escape on modals).
