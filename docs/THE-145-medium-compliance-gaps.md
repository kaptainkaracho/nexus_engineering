# THE-145 — Medium Severity Compliance Gaps

**Severity:** Medium
**Assignee:** FrontendArchitect  
**From:** THE-142 Design System Compliance Audit

## Items

### M1 — Ghost button hover/active lacks dark-mode distinction

**File:** `packages/shared/src/design-system/components/Button.tsx:23`
```js
ghost: 'bg-transparent text-text-secondary hover:bg-surface-tertiary active:bg-surface-secondary disabled:text-text-tertiary',
```

On dark mode, `surface-tertiary` (#334155) and `surface-secondary` (#1E293B) differ only subtly from `surface-primary` (#0F172A). Hover feedback is nearly invisible.

**Design lens:** Fitts's Law — interactive states must provide clear feedback. WCAG — non-text contrast.

**Fix:** Add `dark:hover:bg-surface-secondary dark:active:bg-surface-tertiary` or use a border/focus-ring enhancement.

### M2 — Small button touch target below 44px minimum

**File:** `packages/shared/src/design-system/components/Button.tsx:29`
```js
sm: 'h-8 px-3 text-sm gap-1.5',
```

`h-8` = 32px. WCAG 2.2 / Apple HIG specify 44px minimum touch target. Fitts's Law: undersized targets increase error rate, especially for motor accessibility.

**Fix:** Either `min-h-[44px]` on mobile via responsive utility, or document that `sm` is desktop-only.

### M3 — No `prefers-color-scheme` listener for initial dark mode

**File:** DESIGN_SYSTEM.md §Accessibility mentions `prefers-color-scheme` but no code implements it.

Users with system dark mode see light mode on first load. Doherty Threshold: friction at startup degrades first impression.

**Fix:** Add a `useEffect` in App.tsx:
```tsx
useEffect(() => {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (mq.matches) {
    setDark(true);
    document.documentElement.classList.add('dark');
  }
}, []);
```

## Acceptance Criteria

1. Ghost buttons in dark mode show clear hover/active state
2. Small buttons have min 44px touch target on mobile (WCAG 2.2)
3. System dark mode preference is respected on first load
4. All changes use existing design tokens
