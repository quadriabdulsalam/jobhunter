# Jobhunter product design system

**Product:** Career search and resume workspace
**Interface direction:** Precise, calm, editorial, and work focused
**Updated:** 2026-11-17

## Color system

| Token | Value | Usage |
|---|---|---|
| `--color-page` | `#F4F7FA` | App canvas |
| `--color-surface` | `#FFFFFF` | Cards, forms, menus |
| `--color-surface-muted` | `#EDF3F7` | Quiet controls and selected navigation |
| `--color-text` | `#142B3D` | Main text on light surfaces |
| `--color-text-muted` | `#536B7D` | Supporting text on light surfaces |
| `--color-border` | `#D7E1E8` | Dividers and control edges |
| `--color-primary` | `#0969B5` | Primary action; white text only |
| `--color-primary-hover` | `#07528D` | Primary hover; white text only |
| `--color-link` | `#075D9F` | Text links on light surfaces |
| `--color-success` | `#176B55` | Success indicators on light surfaces |
| `--color-warning` | `#805B13` | Caution indicators on light surfaces |
| `--color-danger` | `#A22E36` | Destructive actions on light surfaces |
| `--color-focus` | `#0969B5` | Visible keyboard focus |

Spacing uses a 4px base with an 8px rhythm: 4, 8, 12, 16, 24, 32, 40, and 48px. Use these values for component padding and layout gaps before introducing a one-off value.

Never pair dark text with dark surfaces or light text with light surfaces. The only dark surface is the sign-in story panel; its text and icons use high contrast light colors. Keep the resume preview white with dark text for print fidelity. Do not use opacity to create text colors.

## Type

Use the native system sans stack with Inter when available. Keep the hierarchy clear and consistent:

- Page title: `clamp(1.75rem, 3vw, 2.25rem)`, 690 weight, tight tracking, 1.1 line height.
- Section title: 16–20px, 680–720 weight.
- Body: 14–16px, 1.55–1.65 line height.
- Labels and metadata: 12–14px, medium weight, readable contrast.
- Keep interface helper text at 12px or larger. Compact resume print metadata may use smaller type to preserve document fit.

## Layout and components

- Use a cool, pale blue-gray page canvas with flat white work surfaces and fine cool-gray borders.
- Keep panels at 10–12px radius. Avoid glass effects, gradients, ambient glow, and ornamental shadows.
- Primary buttons use saturated blue with white text. Secondary buttons use white with dark blue-gray text and a visible border. Destructive actions use dark red text on white.
- Buttons and controls are at least 44px high. Keep 8px between adjacent touch targets.
- Inputs have visible labels, 48px minimum height, 7–8px radius, a strong blue focus ring, and dark text on white.
- Native checkboxes and radios use the primary blue accent and remain at least 18px.
- Job cards use concise metadata, aligned actions, and thin separators. Empty states offer one clear next step.
- Resume preview remains a white, printable document with dark ink and no dark-mode treatments.

## Responsive behavior

- **Phones (320–767px):** Keep the brand and account actions in the top header. Pin the four destination controls to a full-width bottom bar flush with the viewport edge. Put the safe-area inset inside the bar so it clears the home indicator without lifting the navigation. Use 16px page gutters, one-column cards and forms, full-width primary actions, and bottom content padding that clears the bar.
- **Tablet (768–1023px):** Restore horizontal navigation and keep the resume editor in a compact two-column layout only when each column remains usable.
- **Desktop (1024px+):** Use the full horizontal header, readable page measure, and a dedicated resume controls column.
- Respect safe-area insets, reduced motion, keyboard focus, zoom, and long user-provided text. Prevent horizontal page scrolling.

## Accessibility and interaction

- Maintain at least 4.5:1 contrast for regular text and 3:1 for large text and meaningful UI boundaries.
- Provide visible focus on every interactive control. Never remove the outline without an equivalent.
- Use real labels and semantic buttons. Provide accessible names for icon-only actions and state for selected controls.
- Hover, active, disabled, loading, error, and success states must be visually distinct without relying on color alone.
- Keep transitions to brief color, border, and position feedback. Honor `prefers-reduced-motion`.

## Auth flow

The sign-in and account creation screen has a dark navy product story panel with light text and a light form surface with dark text. LinkedIn is the primary provider action; email and password use the same control language as the rest of the app. Never place dark labels or body text on the navy panel.
