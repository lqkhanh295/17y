---
name: awesome-ui
description: >-
  Master frontend craftsmanship and anti-slop UI/UX design skill. Synthesizes UI/UX Pro Max intelligence,
  Taste Skill art direction, and modern high-end component engineering. Use when building, styling,
  or polishing interfaces, landing pages, dashboards, design systems, animations, and micro-interactions
  across React, Next.js, Vue, Tailwind CSS, Flutter, or HTML.
---

# Awesome UI — Frontend Craftsmanship & Anti-Slop Design System

Awesome UI provides opinionated, production-grade rules and patterns to elevate AI-generated code from generic, cliché templates into award-worthy, high-craft digital products.

---

## 1. The Core Anti-Slop Principles

Generic AI code invariably produces the same lazy tropes:
- A centered 3-line headline over a soft purple/indigo gradient.
- A 3-column row of rounded white cards with colored icons in squares.
- Vague buzzwords ("Revolutionize your workflow with AI-powered synergy").
- Weak contrast, gray-on-gray body text, and zero tactile feedback.

Awesome UI eliminates these habits:
1. **Commit to a Distinct Aesthetic**: Choose a clear visual identity (e.g. Linear-style B2B Precision, Editorial Brutalism, Scandinavian Minimalist, Dark OLED Neon, or Swiss Grid).
2. **Substance over Fluff**: Every card, panel, and widget must hold real, dense, credible data and realistic microcopy.
3. **High-Feel Tactile Feedback**: Interfaces must react instantly to user touch and cursor movement with spring physics, hover lifts, border glows, and active pressed states.
4. **Resilient Architecture**: Zero layout shift (CLS < 0.1), fluid typography with `clamp()`, and strict WCAG 2.2 AA/AAA compliance.

---

## 2. Design Token Architecture

Always define semantic tokens at the root level (`:root` or Tailwind theme). Never scatter arbitrary hex codes across components.

### Semantic Color Variables (Dark & Light Mode)

```css
:root {
  /* Surface & Base */
  --bg-canvas: #090a0f;
  --bg-surface: #12141c;
  --bg-surface-elevated: #1a1d29;
  --bg-overlay: rgba(18, 20, 28, 0.85);

  /* Text & Content */
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --text-on-accent: #ffffff;

  /* Brand & Accents */
  --accent-primary: #38bdf8;
  --accent-secondary: #818cf8;
  --accent-glow: rgba(56, 189, 248, 0.25);

  /* Status Colors */
  --status-success: #10b981;
  --status-warning: #f59e0b;
  --status-danger: #ef4444;
  --status-info: #3b82f6;

  /* Borders & Dividers (Subtle, never heavy) */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-hover: rgba(255, 255, 255, 0.18);
  --ring-focus: rgba(56, 189, 248, 0.5);

  /* Radii */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 9999px;
}
```

---

## 3. Fluid Typography System

Avoid abrupt font size jumps at screen breakpoints. Use fluid typography scales calculated via `clamp()`:

```css
:root {
  --step--1: clamp(0.78rem, calc(0.76rem + 0.10vw), 0.84rem); /* Captions, Badges */
  --step-0:  clamp(0.94rem, calc(0.90rem + 0.18vw), 1.06rem); /* Body text (min 15-17px) */
  --step-1:  clamp(1.12rem, calc(1.05rem + 0.38vw), 1.33rem); /* Subheads, Card Titles */
  --step-2:  clamp(1.35rem, calc(1.21rem + 0.70vw), 1.77rem); /* Section Headings */
  --step-3:  clamp(1.62rem, calc(1.38rem + 1.20vw), 2.37rem); /* Major Titles */
  --step-4:  clamp(2.10rem, calc(1.65rem + 2.20vw), 3.40rem); /* Hero Display */
}
```

### Font Pairing Best Practices
- **B2B / Tech / Tools**: `Inter` / `Geist` + `JetBrains Mono`
- **Modern Product / SaaS**: `Plus Jakarta Sans` / `Outfit` + `Inter`
- **Editorial / High Fashion / Studio**: `Syne` / `Clash Display` + `Archivo`
- **Clean Scandinavian / Reliable**: `Albert Sans` or `Satoshi`

---

## 4. Component Craftsmanship & Micro-Interactions

Every interactive component MUST implement all 6 essential states:
1. **Default**: Crisp contrast, subtle 1px border (`border-white/10`).
2. **Hover**: Smooth lift (`-translate-y-0.5`), border highlight (`border-white/25`), and optional subtle glow (`shadow-[0_0_20px_rgba(...)]`).
3. **Active/Pressed**: Tactile compression (`scale-[0.98]` or `translate-y-0.5`).
4. **Focus-Visible**: Unmistakable keyboard ring (`focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:outline-none`).
5. **Loading**: Content-matching shimmer skeleton, disabled pointer events.
6. **Disabled**: Visual opacity `0.45`, `cursor-not-allowed`, removed interactive transitions.

### Example: High-Craft Button (Tailwind / React)

```tsx
<button
  className="relative inline-flex items-center justify-center gap-2 px-5 py-2.5 
             text-sm font-medium text-white transition-all duration-200 ease-out 
             bg-surface-elevated border border-white/10 rounded-lg shadow-sm
             hover:-translate-y-0.5 hover:border-white/20 hover:shadow-md hover:shadow-primary/10
             active:translate-y-0 active:scale-[0.98]
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas
             disabled:opacity-40 disabled:pointer-events-none"
>
  <span>Action Label</span>
  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" ... />
</button>
```

---

## 5. Layout Formulas

### The Asymmetric Bento Grid
Instead of 3 identical square cards, divide space into intentional functional zones:
- **Card A (Span 2 cols, 2 rows)**: The Hero Capability with interactive live mockup or real chart.
- **Card B (Span 1 col, 2 rows)**: Vertical metric or real-time event feed.
- **Card C (Span 1 col, 1 row)**: Quick insight with key numeric indicator.
- **Card D (Span 1 col, 1 row)**: Feature badge with micro-toggle demo.

### Clean Data Dashboards
- KPI cards must show **real metric + directional delta (e.g. +14.2% vs last month) + sparkline**.
- Tables must have hoverable rows, sticky headers, monospaced right-aligned numeric data, and empty-state placeholders.

---

## 6. Accessibility & UX Quality Checklist

- [ ] **Contrast**: Body text passes 4.5:1 contrast against surface.
- [ ] **Target Size**: All buttons and tappable links >= 44x44px bounding area on mobile.
- [ ] **Keyboard Nav**: Tab order flows logically; modals trap focus; `Esc` dismisses overlays.
- [ ] **Zero Horizontal Overflow**: `overflow-x-hidden` on main wrapper; test at 360px viewport.
- [ ] **Reduced Motion**: Respect `prefers-reduced-motion: reduce` by disabling non-essential transitions.
- [ ] **Semantic HTML**: `<header>`, `<main>`, `<nav>`, `<section>`, `<footer>`, `<button>` (never `<div onClick>`).
