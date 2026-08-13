---
name: nextjs-expert
description: Next.js App Router architecture, Middleware, API Route Handlers, Metadata, SEO optimization, ISR, SSR, SSG, and Edge Runtime rules.
---

# Next.js Expert Skill

This skill provides guidelines and patterns for building scalable Next.js applications using the App Router.

## Features & Patterns

### 1. App Router Architecture
- **Server Components (`RSC`)**: Default to Server Components for data fetching and secret handling.
- **Client Components (`'use client'`)**: Use Client Components only for interactivity, state, and browser APIs.

### 2. Data Fetching & Rendering Modes
- **SSR (Server-Side Rendering)**: Dynamic rendering per request.
- **SSG / ISR (Incremental Static Regeneration)**: Static generation with background revalidation.
- **Middleware & Edge Runtime**: Lightweight requests filtering, auth headers, and route redirects.
