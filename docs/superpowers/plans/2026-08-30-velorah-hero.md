# Velorah Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive fullscreen Velorah hero with a looping video, glass navigation, and cinematic typography.

**Architecture:** A Vite React entry renders one semantic `App` surface. Global CSS owns Tailwind theme variables, fonts, liquid glass, and entrance motion; the shadcn Button primitive provides reusable button semantics and composition.

**Tech Stack:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Vitest, Testing Library

**Spec:** `docs/superpowers/specs/2026-08-30-velorah-hero-design.md`

## Global Constraints

- Use the exact user-supplied video URL, copy, palette, typefaces, glass effect, and animation timing.
- Do not add gradients, overlays, decorative blobs, or additional sections.
- Keep both CTAs presentation-only until a destination is supplied.
- Respect `prefers-reduced-motion`.

---

### Task 1: Application Surface

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/lib/utils.ts`, `src/components/ui/button.tsx`
- Create: `src/App.test.tsx`, `src/test/setup.ts`
- Create: `components.json`, `eslint.config.js`

**Interfaces:**
- Consumes: the design specification and supplied remote MP4 URL.
- Produces: a default-exported `App(): JSX.Element` and shadcn-compatible `Button` component.

- [ ] **Step 1: Scaffold Vite, Tailwind, shadcn/ui, and test dependencies**

Run the project generator and shadcn CLI using npm, then install Vitest and Testing Library.

- [ ] **Step 2: Write the failing render test**

Assert the wordmark, headline, body copy, two CTA buttons, video source, and `autoplay`, `loop`, `muted`, and `playsinline` behavior.

- [ ] **Step 3: Run the focused test and confirm it fails**

Run: `npm test -- --run src/App.test.tsx`

Expected: FAIL because the Velorah surface is not implemented.

- [ ] **Step 4: Implement the semantic hero and global visual system**

Create the video canvas, navigation, responsive hero content, exact CSS variables, liquid-glass treatment, font imports, and reduced-motion fallback.

- [ ] **Step 5: Run tests and production build**

Run: `npm test -- --run`

Expected: all tests pass.

Run: `npm run build`

Expected: TypeScript and Vite complete with exit code 0.

- [ ] **Step 6: Perform browser QA**

Start the Vite server, capture desktop and mobile screenshots, validate each image, and fix any overlap, framing, or overflow defects in one batch.

