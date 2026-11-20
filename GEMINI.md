# Project Design & Development Guidelines

This project integrates three industry-leading design systems and AI agent skills to guarantee award-level, production-grade frontend engineering:

1. **UI/UX Pro Max (`ui-ux-pro-max`)**: Design intelligence database with 80+ styles, 192 product palettes, 74 font pairings, 120 UX guidelines, and 22 technology stack rules.
2. **Taste Skill (`design-taste-frontend` / `tasteskill v2`)**: The anti-slop art direction engine distilled from 247 curated award-winning websites (One Page Love, Awwwards).
3. **Awesome UI (`awesome-ui`)**: High-craft component engineering, tactile micro-interactions, fluid typography, and semantic token architecture.

---

## 🎨 Design Workflow for Any UI Task

When building, modifying, or reviewing any frontend interface in this project, adhere to this workflow:

### Step 1: Query Design Intelligence (UI/UX Pro Max)
- Search for tailored design tokens, styles, or stack best practices:
  ```bash
  # Search by domain (style, color, chart, ux, typography, landing, icons, gsap)
  node .agents/skills/ui-ux-pro-max/scripts/search.mjs "<product or keyword>" --domain <domain>

  # Or generate a complete cohesive design system for a new product
  node .agents/skills/ui-ux-pro-max/scripts/search.mjs "<product_type> <industry>" --design-system

  # Stack-specific best practices (react, nextjs, vue, svelte, html-tailwind, flutter, etc.)
  node .agents/skills/ui-ux-pro-max/scripts/search.mjs "<query>" --stack <stack_name>
  ```

### Step 2: Establish Art Direction (Taste Skill)
- Generate a unique, anti-slop direction sheet before writing layout code:
  ```bash
  # Deal layout direction, typography, and section blueprints
  node .agents/skills/design-taste-frontend/scripts/draw.mjs --sector <sector> --brief "<project description>"

  # For app screens (dashboards, admin tables, analytics, settings):
  node .agents/skills/design-taste-frontend/scripts/draw.mjs --app --kind <kind> --brief "<brief>"
  ```
- **Strict Anti-Slop Rules**:
  - No centered 3-line headline with a soft generic gradient.
  - No predictable 3-card icon rows.
  - No grey-on-grey low contrast text.
  - Headlines strictly <= 2 lines.

### Step 3: Implement High-Craft Components (Awesome UI)
- **6 States Required**: Every interactive element must handle `Default`, `Hover`, `Active/Pressed`, `Focus-Visible`, `Loading`, and `Disabled`.
- **Tactile Feedback**:
  - Hover: Subtle lift (`hover:-translate-y-0.5`), border glow, or highlight.
  - Active: Tactile compression (`active:scale-[0.98]` or `active:translate-y-px`).
  - Focus: Clear visible focus ring (`focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`).
- **Fluid Typography**: Use `clamp()` for font sizes so text scales smoothly across all viewport widths.
- **Design Tokens**: Always use semantic variables (`--bg-surface`, `--text-primary`, `--accent-primary`, `--border-subtle`).

---

## ♿ Accessibility & Quality Standards (Non-Negotiable)

- **Contrast**: 4.5:1 minimum contrast for normal text, 3:1 for large display text and UI controls (WCAG 2.2 AA).
- **Touch Targets**: Minimum 44×44px hit target for interactive elements on mobile devices.
- **Responsive**: Zero horizontal scrollbar on any device (`overflow-x-hidden`).
- **Motion**: Always respect `@media (prefers-reduced-motion: reduce)`.
- **Keyboard Navigation**: Complete keyboard navigability with visible focus indicators.
