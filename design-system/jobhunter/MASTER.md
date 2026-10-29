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
| Primary | `#111111` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary / links | `#0369A1` | `--color-link` |
| Accent/CTA | `#111111` | `--color-primary` |
| Background | `#FCFCFC` | `--color-page` |
| Foreground | `#111111` | `--color-text` |
| Card | `#FFFFFF` | `--color-card` |
| Card Foreground | `#111111` | `--color-text` |
| Muted | `#F4F4F2` | `--color-surface-muted` |
| Muted Foreground | `#666666` | `--color-text-muted` |
| Border | `#E5E5E3` | `--color-border` |
| Destructive | `#A12B2B` | `--color-danger` |
| On Destructive | `#FFFFFF` | `--color-on-danger` |
| Ring | `#0369A1` | `--color-focus` |

**Color Notes:** The interface follows the user’s established quiet, near-white direction. Use graphite for the primary action and reserve blue for links and keyboard focus. Do not add gradient or decorative accent fills.

### Typography

- **Heading Font:** Inter with system sans-serif fallbacks
- **Body Font:** Inter with system sans-serif fallbacks
- **Mood:** calm, clear, professional, focused
- **Loading:** Keep system fallbacks to avoid a remote font dependency and preserve a fast first paint.

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
  background: var(--color-primary);
  color: #FFFFFF;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: background-color 150ms ease, border-color 150ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  background: #303030;
}

/* Secondary Button */
.btn-secondary {
  background: #FFFFFF;
  color: var(--color-text);
  border: 1px solid var(--color-border);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: background-color 150ms ease, border-color 150ms ease;
  cursor: pointer;
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
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 16px;
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
- **Navigation:** Compact top navigation for Applications, Resume, Profile, and Browser helper.
- **Progression:** Keep job capture, tailoring, and profile editing distinct; explain the next action when a screen has no content.
- **CTA Placement:** One primary action per view; supporting actions use quiet secondary buttons.
- **Section Order:** Page title and context > job capture > search and application list.

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
