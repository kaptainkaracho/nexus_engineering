# Design System Grundgerüst

## Tokens

Colors are defined in `packages/shared/src/design-system/tokens/colors.ts` and mirrored as CSS custom properties in `packages/shared/src/design-system/theme.css`.

### Color Palette

| Scale | Primary (Blue) | Secondary (Emerald) | Neutral (Slate) |
|-------|---------------|--------------------|----------------||
| 50    | `#EFF6FF`     | `#ECFDF5`          | `#F8FAFC`      || 100   | `#DBEAFE`     | `#D1FAE5`          | `#F1F5F9`      |
| 200   | `#BFDBFE`     | `#A7F3D0`          | `#E2E8F0`      |
| 300   | `#93C5FD`     | `#6EE7B7`          | `#CBD5E1`      |
| 400   | `#60A5FA`     | `#34D399`          | `#94A3B8`      |
| 500   | `#3B82F6`     | `#10B981`          | `#64748B`      |
| 600   | `#2563EB`     | `#059669`          | `#475569`      |
| 700   | `#1D4ED8`     | `#047857`          | `#334155`      |
| 800   | `#1E40AF`     | `#065F46`          | `#1E293B`      |
| 900   | `#1E3A8A`     | `#064E3B`          | `#0F172A`      |
| 950   | `#172554`     | `#022C22`          | `#020617`      |

Semantic colors: `success` (green), `warning` (amber), `error` (red), `info` (sky).

### Surface & Text Semantics

| Token | Light | Dark |
|-------|-------|------|
| `--surface-primary` | `#FFFFFF` | `#0F172A` |
| `--surface-secondary` | `#F8FAFC` | `#1E293B` |
| `--surface-tertiary` | `#F1F5F9` | `#334155` |
| `--text-primary` | `#0F172A` | `#F8FAFC` |
| `--text-secondary` | `#475569` | `#CBD5E1` |
| `--text-tertiary` | `#94A3B8` | `#64748B` |
| `--border-default` | `#E2E8F0` | `#334155` |

### Typography

- Font family (sans): `Inter`, system-ui fallback
- Font family (mono): `JetBrains Mono`, Fira Code fallback
- Sizes: `xs (0.75rem)` → `6xl (3.75rem)`
- Weights: `normal (400)`, `medium (500)`, `semibold (600)`, `bold (700)`

### Spacing

Follows Tailwind's default scale (0–96). All values in rem.

### Shadows & Radii

Shadows: `sm`, `DEFAULT`, `md`, `lg`, `xl` — light adapts alpha for dark mode.
Radii: `sm (0.375rem)` → `full (9999px)`. Default radius: `0.5rem`.

## Dark Mode

Enabled via the `class` strategy. Add `class="dark"` to `<html>` to activate.

The `theme.css` file inverts palettes and adjusts semantic colors under `.dark`.

Usage:
```ts
document.documentElement.classList.toggle('dark', isDark);
```

Components use `dark:` variants for overrides (e.g. `dark:bg-surface-primary`).

## Tailwind Config

Located at `apps/frontend/tailwind.config.js`. All colors reference CSS custom properties (`var(--...)`) so dark mode updates propagate automatically.

```js
darkMode: 'class',
theme: {
  extend: {
    colors: {
      primary: { 50: 'var(--color-primary-50)', ... },
      secondary: { 50: 'var(--color-secondary-50)', ... },
      neutral: { 50: 'var(--color-neutral-50)', ... },
      success: { 50: 'var(--color-success-50)', ... },
      warning: { 50: 'var(--color-warning-50)', ... },
      error: { 50: 'var(--color-error-50)', ... },
      info: { 50: 'var(--color-info-50)', ... },
      surface: {
        DEFAULT: 'var(--surface-primary)',
        secondary: 'var(--surface-secondary)',
        tertiary: 'var(--surface-tertiary)',
      },
    },
    fontFamily: { ... },
    fontSize: { ... },
    borderRadius: { ... },
    boxShadow: { ... },
  },
}
```

## Components

All components are in `packages/shared/src/design-system/components/`.

### Button `<Button />`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` | Visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size preset |
| `loading` | `boolean` | `false` | Shows spinner, disables |
| `icon` | `ReactNode` | — | Icon element |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Icon placement |
| `fullWidth` | `boolean` | `false` | Full width button |
| `disabled` | `boolean` | — | Native disabled |

### Input `<Input />`

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Label text |
| `helperText` | `string` | Helper text below |
| `error` | `string` | Error message (shows in red) |
| `leftIcon` | `ReactNode` | Icon inside left |
| `rightIcon` | `ReactNode` | Icon inside right |
| `fullWidth` | `boolean` | Full width container |

Accessibility: `aria-invalid`, `aria-describedby` for error/helper, `htmlFor` linking.

### Card `<Card />`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'elevated' \| 'outlined'` | `'default'` | Card style |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Padding preset |

### Layout `<Container />`, `<Stack />`, `<Grid />`

**Container**: Centered width container with responsive padding. Sizes: `sm` (3xl), `md` (5xl), `lg` (7xl), `xl` (1440px), `full`.

**Stack**: Flexbox layout. Props: `direction`, `gap` (0–16), `align`, `justify`, `wrap`.

**Grid**: CSS Grid. Props: `cols` (1,2,3,4,6,12), `gap` (0–16). Responsive column defaults built in.

### Nav `<Nav />`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `NavItem[]` | — | Navigation items |
| `variant` | `'horizontal' \| 'vertical'` | `'horizontal'` | Orientation |

`NavItem`: `{ label, href, icon?, badge?, active? }`

Horizontal variant includes mobile hamburger menu with dropdown.

### Alert `<Alert />` (New — Added in THE-193)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'success' \| 'error' \| 'warning' \| 'info'` | — | Visual style |
| `title` | `string` | — | Optional bold title |
| `children` | `ReactNode` | — | Alert body content |
| `icon` | `ReactNode` | — | Icon element (matched to variant color) |
| `dismissible` | `boolean` | `false` | Shows close button |
| `onDismiss` | `() => void` | — | Callback on dismiss |

**Styling:**
| Variant | Background | Border | Text |
|---------|-----------|--------|------|
| success | `bg-success-50` | `border-success-200` | `text-success-700` |
| error | `bg-error-50` | `border-error-200` | `text-error-700` |
| warning | `bg-warning-50` | `border-warning-200` | `text-warning-700` |
| info | `bg-info-50` | `border-info-200` | `text-info-700` |

Uses `role="alert"` for accessibility.

## Utility

```ts
cn(...classes: (string | undefined | null | false)[]): string
```

Simple class name joiner — filters falsy values and joins with space.

## File Structure

```
packages/shared/src/design-system/
├── index.ts              # Barrel export
├── utils.ts              # cn() utility
├── theme.css             # CSS custom properties + dark mode
├── tokens/
│   ├── index.ts
│   ├── colors.ts
│   ├── typography.ts
│   └── spacing.ts
└── components/
    ├── index.ts
    ├── Alert.tsx
    ├── Badge.tsx
    ├── Button.tsx
    ├── Input.tsx
    ├── Card.tsx
    ├── Layout.tsx
    └── Nav.tsx
```

## Accessibility Criteria

- All interactive elements are keyboard-focusable with visible focus rings
- Buttons have `disabled` and `aria-` attributes
- Inputs have `aria-invalid`, `aria-describedby`, and linked labels
- Navigation uses semantic `<nav>` and `aria-current="page"`
- Color contrast meets WCAG AA across all token scales
- Dark mode respects `prefers-color-scheme` when used with system detection
- Reduced motion: animations use Tailwind's `motion-reduce:` as needed

## Design Documents

| Document | Location | Covers |
|----------|----------|--------|
| **Auth Flow Wireframes** | `docs/ux/auth-flow-wireframes.md` | Login, Registration, Password Reset, Email Verification, Auth Guard |
| **Admin UI Mockups** | `docs/ux/admin-ui-mockups.md` | Admin Dashboard, Members, Roles & Permissions, Settings, Audit Log |

## Design Lenses Applied

- **Nielsen's 10**: Visibility of system status (loading spinners), error prevention (inline validation), recognition over recall (semantic color tokens)
- **Gestalt**: Proximity (component spacing via gap), Similarity (consistent button patterns), Common Region (Card boundaries)
- **Fitts's Law**: Minimum 44px touch targets on mobile nav hamburger and buttons
- **Doherty Threshold**: 200ms transition durations for interactive states
- **WCAG POUR**: Perceivable (contrast), Operable (keyboard), Understandable (clear labels), Robust (semantic HTML)
- **Jakob's Law**: Familiar component patterns matching platform conventions
