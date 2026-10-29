# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Jobhunter
**Generated:** 2026-10-29 16:47:10
**Category:** Career productivity / job application workspace
**Design Dials:** Variance 3/10 (Centered / Minimal) | Motion 2/10 (Subtle) | Density 4/10 (Standard)

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary / action | `#C04E1B` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Primary hover | `#B84A16` | `--color-primary-hover` |
| Accent text / links / focus | `#963B16` | `--color-primary-strong`, `--color-link`, `--color-focus` |
| Accent/CTA | `#C04E1B` | `--color-primary` |
| Background | `#F7F6F3` | `--color-page` |
| Foreground | `#1A1917` | `--color-text` |
| Card | `#FFFFFF` | `--color-card` |
| Card Foreground | `#111111` | `--color-text` |
| Muted | `#F2F1EE` | `--color-surface-muted` |
| Muted Foreground | `#66625E` | `--color-text-muted` |
| Border | `#E6E3DE` | `--color-border` |
| Destructive | `#A12B2B` | `--color-danger` |
| On Destructive | `#FFFFFF` | `--color-on-danger` |
| Ring | `#C2410C` | `--color-focus` |

**Color Notes:** Use warm neutral surfaces and near-black text. Reserve terracotta orange for primary actions, the brand mark, selected navigation, and focus. Use the deeper orange for text links and focus; white text on the primary orange maintains WCAG AA contrast. Avoid gradients and decorative accent fills.

### Typography

- **Heading Font:** Inter with system sans-serif fallbacks
- **Body Font:** Inter with system sans-serif fallbacks
- **Mood:** calm, clear, professional, focused
- **Loading:** Keep system fallbacks to avoid a remote font dependency and preserve a fast first paint.

| Token | Size | Use |
|-------|------|-----|
| `--font-size-xs` | `.75rem` | Badges and compact metadata |
| `--font-size-sm` | `.875rem` | Buttons, labels, and secondary copy |
| `--font-size-base` | `1rem` | Default text and mobile body copy |
| `--font-size-lg` | `1.125rem` | Section headings and lead text |
| `--font-size-xl` | `1.5rem` | Subsection headings |
| `--font-size-2xl` | `2rem` | Page headings |
| `--font-size-3xl` | `2.5rem` | Large display headings |

Use a 1.5–1.6 body line-height. Keep supporting text at or above 12px and use the muted text token (`#666` on white) so contrast remains readable. Keep page headings fluid with `clamp()` and use system font fallbacks for a fast first paint.

### Spacing Variables

*Density: 4/10 — Standard*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | Tight gaps |
| `--space-2` | `8px` | Icon gaps, inline spacing |
| `--space-3` | `12px` | Compact component gaps |
| `--space-4` | `16px` | Standard padding |
| `--space-6` | `24px` | Section padding |
| `--space-8` | `32px` | Large gaps |
| `--space-10` | `40px` | Desktop section separation |
| `--space-12` | `48px` | Wide page breathing room |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| Default | `none` | Flat surfaces and application rows |
| Overlay | soft neutral scrim | Dialogs only |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  background: var(--color-primary);
  color: var(--color-on-primary); /* white maintains AA contrast on terracotta */
  padding: 10px 16px;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-control);
  font-size: var(--font-size-sm);
  font-weight: 550;
  transition: background-color var(--motion-fast) ease, border-color var(--motion-fast) ease;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-primary:active { opacity: .82; }
.btn-primary:disabled { opacity: .52; cursor: not-allowed; }

/* Ghost actions stay quiet until hover/focus; all button variants remain 44px tall. */
.btn-ghost { min-height: 44px; background: transparent; color: var(--color-text-muted); }

/* Secondary Button */
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  background: #FFFFFF;
  color: var(--color-text);
  border: 1px solid #dededd;
  padding: 10px 16px;
  border-radius: var(--radius-control);
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: background-color var(--motion-fast) ease, border-color var(--motion-fast) ease;
  cursor: pointer;
}

/* Destructive actions are visually distinct and retain readable contrast. */
.btn-danger {
  min-height: 44px;
  color: var(--color-danger);
  background: #fff;
  border: 1px solid #e4b7b7;
  border-radius: var(--radius-control);
  padding: 10px 16px;
}
```

### Cards

```css
.card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--color-border);
  box-shadow: none;
  transition: border-color 150ms ease;
}

.card:hover {
  border-color: #c9c9c6;
}
```

### Inputs

```css
.input {
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: var(--font-size-sm);
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: var(--color-focus);
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: none;
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Minimalism & Swiss Style

**Keywords:** Clean, simple, spacious, functional, white space, high contrast, geometric, sans-serif, grid-based, essential

**Best For:** Enterprise apps, dashboards, documentation sites, SaaS platforms, professional tools

**Key Effects:** Subtle hover (200-250ms), smooth transitions, sharp shadows if any, clear type hierarchy, fast loading

### Page Pattern

**Pattern Name:** Calm career workspace

- **Primary Surface:** Application list with a single, clear way to add a job.
- **Navigation:** Compact horizontal navigation on tablet and desktop; a persistent four-item bottom bar on phones for Jobs, Resume, Profile, and Helper.
- **Progression:** Keep job capture, tailoring, and profile editing distinct; explain the next action when a screen has no content.
- **CTA Placement:** One primary action per view; supporting actions use quiet secondary buttons.
- **Section Order:** Page title and context > job capture > search and application list.

### Responsive Dashboard

- **Mobile first (`320–480px`):** Default to a single column with 16px body text, 16px side gutters, an always-reachable bottom navigation dock with safe-area spacing, full-width primary actions, and no horizontal overflow.
- **Tablet (`768–1024px`):** Restore horizontal form and job-card actions when there is room; allow two-column profile and control groups while keeping nav labels legible.
- **Desktop (`900px+`):** Use the full top navigation and a two-column resume workspace.
- **Wide screens (`1200px+`):** Expand only the resume workspace; keep application text at a readable measure.
- **Touch:** Interactive controls are at least `44 × 44px`; keep `8px` or more between adjacent targets.
- **Overflow:** Wrap long content and action groups; never rely on horizontal page scrolling.

### Contrast and Accessibility

- Body text: `#111111` on `#FCFCFC`; muted text: `#666666` on white; links/focus: `#0369A1`; destructive text: `#A12B2B` on white. These pairs meet the normal-text `4.5:1` contrast target.
- Preserve a visible keyboard focus ring. Give each form field a visible label and each icon-only action an accessible name.
- Use `aria-pressed` for mutually exclusive view controls, provide clear disabled and destructive states, and respect reduced-motion preferences.

---

## Motion

**Interaction feedback** (Subtle) — Use short state feedback for buttons and focus; avoid scroll choreography in the work dashboard.

```css
button:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 3px; }
```

**Framework notes:** Respect `prefers-reduced-motion`; motion should never delay or hide work content.

- ✅ Keep feedback fast and visually subtle
- ✅ Respect `prefers-reduced-motion`
- ❌ Do not use decorative scroll-reveal animation in core work screens

---

## Anti-Patterns (Do NOT Use)

- ❌ Outdated forms
- ❌ Hidden filters

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
