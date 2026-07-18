# Auth Flow Wireframes — THE-193

**Owner:** UXDesigner
**Parent:** THE-189 (Sprint 9: Enterprise Phase 2 — Auth + RBAC)
**Depends on:** Backend Auth API (THE-191)
**Feeds:** FrontendArchitect (THE-192)

---

## 1. Design Principles Applied

| Lens | Decision |
|------|----------|
| **Cognitive Load** | Single-column auth forms. Max 4 fields per screen. Progressive disclosure for optional fields. |
| **Fitts's Law** | Primary CTA is full-width, centered, large touch target (h-12 / Button size lg). |
| **Hick's Law** | No social login clutter initially — email/password only. OAuth buttons below the fold if added later. |
| **Aesthetic-Usability Effect** | Clean card-based layout with generous whitespace. Error states are inline, not blocking. |
| **Jakob's Law** | Standard auth flow positions: logo top, form centered, footer links bottom. Matches mental model of every SaaS auth. |
| **Tesler's Law** | Password requirements shown inline on focus, not as a modal. Complexity pushed to the system. |
| **Accessibility (WCAG POUR)** | All form fields have visible labels (not placeholder-only). Error messages linked via `aria-describedby`. Focus management on route change. |

---

## 2. Shared Layout — Auth Shell

All auth pages share a consistent shell. This is the **outer frame**, not a page-specific layout.

```
┌─────────────────────────────────────────────────────┐
│                  [B] Nexus Logo                      │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │                                              │   │
│  │              ┌────────────────┐              │   │
│  │              │   CARD (md)    │              │   │
│  │              │                │              │   │
│  │              │  [Form Content] │              │   │
│  │              │                │              │   │
│  │              └────────────────┘              │   │
│  │                                              │   │
│  │         [Secondary link / footer]            │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  © 2026 Nexus Engineering                           │
└─────────────────────────────────────────────────────┘
```

### Layout Specs

| Element | Spec |
|---------|------|
| **Page bg** | `bg-surface-secondary` (`#F8FAFC` light / `#1E293B` dark) |
| **Centering** | `flex min-h-screen items-center justify-center p-4` |
| **Card** | `<Card variant="elevated" padding="lg">` with `max-w-md w-full` |
| **Logo** | `text-2xl font-bold text-primary-600` — top of card, centered |
| **Footer** | `text-sm text-text-tertiary` — below card, centered |
| **Mobile** | Card breathes at `p-6` on mobile, full-width minus `p-4` margin |

---

## 3. Login Page

### Route: `#login` or `/login`

```
┌──────────────────────────────────────────┐
│            Nexus                         │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │                                    │  │
│  │  Welcome back                      │  │  ← h2, text-primary, font-semibold
│  │  Sign in to your account           │  │  ← text-secondary, text-sm
│  │                                    │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │ Email                        │  │  │  ← Input with leftIcon (Mail)
│  │  │ [icon] you@example.com       │  │  │
│  │  └──────────────────────────────┘  │  │
│  │                                    │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │ Password              [eye]  │  │  │  ← Input with leftIcon (Lock) + rightIcon (Eye/EyeOff toggle)
│  │  │ [icon] ••••••••              │  │  │
│  │  └──────────────────────────────┘  │  │
│  │                                    │  │
│  │  [x] Remember me    Forgot password?│  │  ← Row: checkbox left, link right
│  │                                    │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │         Sign in              │  │  │  ← Button variant="primary" size="lg" fullWidth
│  │  └──────────────────────────────┘  │  │
│  │                                    │  │
│  │  ─────── or continue with ─────── │  │  ← divider (if OAuth enabled later)
│  │                                    │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │      [G] Continue with Google │  │  │  ← Button variant="secondary" size="lg" fullWidth (optional/future)
│  │  └──────────────────────────────┘  │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Don't have an account? Sign up          │  ← text-sm, text-secondary, link primary-600
│  © 2026 Nexus Engineering               │
└──────────────────────────────────────────┘
```

### Field Specifications

| Field | Component | Type | Validation | Error Message |
|-------|-----------|------|------------|---------------|
| Email | `<Input leftIcon={<Mail />} label="Email" placeholder="you@example.com" type="email" />` | email | Required, valid email format | "Please enter a valid email address" |
| Password | `<Input leftIcon={<Lock />} rightIcon={<EyeToggle />} label="Password" type="password" />` | password (toggleable) | Required, min 8 chars | "Password must be at least 8 characters" |
| Remember me | `<input type="checkbox">` with visible label | checkbox | Optional | — |
| Forgot password | `<a>` link | navigation | — | — |

### Interaction States

| State | Behavior |
|-------|----------|
| **Empty / idle** | Fields show placeholder text, button disabled until both fields have values (client-side) |
| **Focusing field** | Border transitions to `border-primary-500`, `ring-2 ring-primary-500/20` |
| **Submitting** | Button shows `<Spinner>` + "Signing in...", all fields disabled |
| **Error (API)** | Alert banner at top of card: `bg-error-50 border border-error-200 text-error-700 rounded-lg p-3` with icon. Fields shake (optional: `animate-shake`) |
| **Error (field)** | Inline error below Input: `text-sm text-error-500` linked via `aria-describedby` |
| **Success** | Redirect to `#dashboard` or `#/` after 100ms |

### Password Visibility Toggle

- Default state: password masked (`type="password"`)
- Toggle button: right icon, `aria-label="Show password"` / `"Hide password"`
- On click: toggle between `type="password"` and `type="text"`
- Icon swaps between `Eye` (hidden) and `EyeOff` (visible)

### Forgot Password Link

- `text-sm text-primary-600 hover:text-primary-700`
- Navigates to `#forgot-password`
- Keyboard accessible: `Tab` order is Email → Password → Remember → Forgot → Sign in

---

## 4. Registration Page

### Route: `#register` or `/register`

```
┌──────────────────────────────────────────┐
│            Nexus                         │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │                                    │  │
│  │  Create your account               │  │  ← h2, text-primary, font-semibold
│  │  Start tracking your engineering   │  │  ← text-secondary, text-sm
│  │                                    │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │ Full name                    │  │  │  ← Input with leftIcon (User)
│  │  │ [icon] John Doe              │  │  │
│  │  └──────────────────────────────┘  │  │
│  │                                    │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │ Email                        │  │  │  ← Input with leftIcon (Mail)
│  │  │ [icon] you@example.com       │  │  │
│  │  └──────────────────────────────┘  │  │
│  │                                    │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │ Password              [eye]  │  │  │  ← Input with leftIcon (Lock) + rightIcon (Eye toggle)
│  │  │ [icon] ••••••••              │  │  │
│  │  └──────────────────────────────┘  │  │
│  │                                    │  │
│  │  Password strength: ●●●○○         │  │  ← Strength meter (visual only)
│  │  Must be at least 8 characters     │  │  ← Requirement hint
│  │                                    │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │      Create account          │  │  │  ← Button variant="primary" size="lg" fullWidth
│  │  └──────────────────────────────┘  │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Already have an account? Sign in        │  ← text-sm, text-secondary, link primary-600
│  © 2026 Nexus Engineering               │
└──────────────────────────────────────────┘
```

### Field Specifications

| Field | Component | Validation | Error |
|-------|-----------|------------|-------|
| Full name | `<Input leftIcon={<User />} label="Full name" placeholder="John Doe" />` | Required, min 2 chars | "Name must be at least 2 characters" |
| Email | `<Input leftIcon={<Mail />} label="Email" placeholder="you@example.com" type="email" />` | Required, valid email, unique | "Please enter a valid email" or "This email is already registered" |
| Password | `<Input leftIcon={<Lock />} rightIcon={<EyeToggle />} label="Password" type="password" />` | Required, min 8 chars | Inline requirement list |

### Password Strength Indicator

- Visual bar below password field
- Strength levels: Weak (0-2), Fair (3-4), Good (5-6), Strong (7-8+)
- Colors: `error-500`, `warning-500`, `info-500`, `success-500`
- Update on every keystroke (debounced 150ms)

### Password Requirements (Inline)

Shown on password focus, below strength meter:

```
✓ At least 8 characters           ← green check when met
✓ Contains a number               ← green check when met
✓ Contains a special character    ← green check when met
```

- Each requirement: `text-xs text-text-tertiary` normally, `text-xs text-success-600` when satisfied
- Check icon: `CheckCircle` from lucide-react, `text-success-500` when met

### Interaction States

Same as login. Additionally:
- **Email already registered**: Show inline error on email field + suggestion to sign in
- **Success**: Show confirmation message, then redirect to `#login` with `?verified=pending` param

---

## 5. Forgot Password Page

### Route: `#forgot-password` or `/forgot-password`

```
┌──────────────────────────────────────────┐
│            Nexus                         │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │                                    │  │
│  │  Reset your password               │  │  ← h2
│  │  Enter your email and we'll send   │  │  ← text-secondary
│  │  you a reset link                  │  │
│  │                                    │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │ Email                        │  │  │  ← Input with leftIcon (Mail)
│  │  │ [icon] you@example.com       │  │  │
│  │  └──────────────────────────────┘  │  │
│  │                                    │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │      Send reset link         │  │  │  ← Button variant="primary" size="lg" fullWidth
│  │  └──────────────────────────────┘  │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Remember your password? Sign in         │  ← Back to login link
│  © 2026 Nexus Engineering               │
└──────────────────────────────────────────┘
```

### Success State (After Submission)

```
┌──────────────────────────────────────────┐
│            Nexus                         │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │                                    │  │
│  │  ✓ Check your email                │  │  ← Icon: CheckCircle, text-success-500
│  │                                    │  │
│  │  We sent a password reset link to  │  │
│  │  you@example.com                   │  │  ← email bolded
│  │                                    │  │
│  │  The link expires in 1 hour.       │  │  ← text-sm text-text-tertiary
│  │                                    │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │    Resend reset link         │  │  │  ← Button variant="secondary" size="lg" fullWidth
│  │  └──────────────────────────────┘  │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Back to sign in                         │
│  © 2026 Nexus Engineering               │
└──────────────────────────────────────────┘
```

### Interaction Details

- **Email not found**: Do NOT reveal whether email exists (security). Show same success state regardless.
- **Resend**: Disabled for 60 seconds after first submission, countdown shown: "Resend in 58s"
- **Rate limiting**: Max 3 requests per email per hour. If exceeded: "Too many requests. Please try again later."

---

## 6. Reset Password Page

### Route: `#reset-password?token=<jwt>` or `/reset-password?token=<jwt>`

```
┌──────────────────────────────────────────┐
│            Nexus                         │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │                                    │  │
│  │  Set new password                  │  │  ← h2
│  │  Choose a strong password for      │  │  ← text-secondary
│  │  your account                      │  │
│  │                                    │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │ New password          [eye]  │  │  │
│  │  │ [icon] ••••••••              │  │  │
│  │  └──────────────────────────────┘  │  │
│  │                                    │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │ Confirm password      [eye]  │  │  │
│  │  │ [icon] ••••••••              │  │  │
│  │  └──────────────────────────────┘  │  │
│  │                                    │  │
│  │  Password strength: ●●●○○         │  │  ← Strength meter (shared component)
│  │                                    │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │     Reset password           │  │  │  ← Button variant="primary" size="lg" fullWidth
│  │  └──────────────────────────────┘  │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  © 2026 Nexus Engineering               │
└──────────────────────────────────────────┘
```

### Field Specifications

| Field | Validation | Error |
|-------|------------|-------|
| New password | Required, min 8 chars, same rules as registration | Inline requirements |
| Confirm password | Must match new password | "Passwords do not match" |

### Interaction States

- **Invalid/expired token**: Show error state instead of form: "This reset link has expired or is invalid. [Request a new link]"
- **Submitting**: Button shows spinner
- **Success**: Show success state with checkmark + "Password reset successfully. Redirecting to sign in..."

---

## 7. Email Verification Page (Optional/Grace)

### Route: `#verify-email?token=<jwt>` or `/verify-email?token=<jwt>`

```
┌──────────────────────────────────────────┐
│            Nexus                         │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │                                    │  │
│  │  ✓ Email verified                  │  │  ← CheckCircle icon, success-500
│  │                                    │  │
│  │  Your email has been verified.     │  │
│  │  You can now sign in to access     │  │
│  │  your account.                     │  │
│  │                                    │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │        Sign in               │  │  │  ← Button variant="primary" size="lg" fullWidth
│  │  └──────────────────────────────┘  │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  © 2026 Nexus Engineering               │
└──────────────────────────────────────────┘
```

### Error State

```
┌──────────────────────────────────────────┐
│            Nexus                         │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │                                    │  │
│  │  ✗ Verification failed             │  │  ← XCircle icon, error-500
│  │                                    │  │
│  │  This verification link has        │  │
│  │  expired or is invalid.            │  │
│  │                                    │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │   Resend verification email  │  │  │  ← Button variant="secondary" size="lg" fullWidth
│  │  └──────────────────────────────┘  │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  © 2026 Nexus Engineering               │
└──────────────────────────────────────────┘
```

---

## 8. Auth Guard / Protected Routes

### Behavior

```typescript
// Conceptual — not literal implementation, just UX behavior spec
function AuthGuard({ children }) {
  // If not authenticated → redirect to #login?redirect=<current_hash>
  // If authenticated but unverified → show #verify-email prompt
  // If authenticated + verified → render children
}
```

### Route Protection Matrix

| Route | Required Role | Redirect Unauthenticated |
|-------|---------------|-------------------------|
| `#/` (dashboard) | Any authenticated user | → `#login?redirect=%23` |
| `#/discovery` | Any authenticated user | → `#login?redirect=%23discovery` |
| `#/admin/*` | admin role | → `#login?redirect=%23admin` |
| `#/admin/roles` | admin role | → `#login?redirect=%23admin%2Froles` |
| `#/admin/members` | admin role | → `#login?redirect=%23admin%2Fmembers` |

### Unauthenticated Redirect UX

- After successful login, check `redirect` query param
- If present: navigate to decoded redirect target
- If absent: navigate to `#/` (default dashboard)
- This preserves the user's intended destination

### Session Expiry

- On 401 response from any API call: clear session, show toast "Your session has expired. Please sign in again."
- Redirect to `#login?redirect=<current_page>`
- Toast: `bg-warning-50 border border-warning-200 text-warning-700 rounded-lg p-3`

---

## 9. Component Mapping

Every wireframe element maps to existing design system components:

| Wireframe Element | Design System Component | Token/Variant |
|-------------------|------------------------|---------------|
| Page background | `bg-surface-secondary` | `--surface-secondary` |
| Auth card | `<Card variant="elevated" padding="lg">` | `shadow-lg`, `rounded-xl` |
| Heading | `<h2>` | `text-2xl font-semibold text-text-primary` |
| Subheading | `<p>` | `text-sm text-text-secondary` |
| Form field | `<Input>` | `leftIcon`, `label`, `error`, `helperText` |
| Primary CTA | `<Button variant="primary" size="lg" fullWidth>` | — |
| Secondary CTA | `<Button variant="secondary" size="lg" fullWidth>` | — |
| Text link | `<a>` | `text-sm text-primary-600 hover:text-primary-700` |
| Error alert | Custom `<Alert>` (new) or inline `<div>` | `bg-error-50 border-error-200 text-error-700` |
| Success icon | `<CheckCircle>` from lucide-react | `text-success-500` |
| Error icon | `<XCircle>` from lucide-react | `text-error-500` |
| Divider | `<hr>` | `border-border` |
| Password toggle | `<Eye>` / `<EyeOff>` from lucide-react | `text-text-tertiary` |

---

## 10. Accessibility Checklist

| Criterion | Implementation |
|-----------|---------------|
| **Visible labels** | Every `<Input>` has a `label` prop — never placeholder-only |
| **Focus order** | Logical tab order: Email → Password → Remember → Forgot → Sign in |
| **Focus visible** | `focus:ring-2 focus:ring-primary-500 focus:ring-offset-2` on all interactive elements |
| **Error announcement** | Errors use `role="alert"` and `aria-describedby` linked to input |
| **Password toggle** | `aria-label="Show password"` / `"Hide password"`, `aria-pressed` |
| **Keyboard** | Enter submits form, Escape closes any modals, Tab navigates |
| **Contrast** | All text meets WCAG AA (4.5:1 normal, 3:1 large). `text-primary` on `surface-primary` = 15.4:1 |
| **Reduced motion** | `prefers-reduced-motion` respected — no shake animation, instant transitions |
| **Color independence** | Errors always paired with icon + text, never color alone |

---

## 11. Responsive Behavior

| Viewport | Adaptation |
|----------|------------|
| **≥768px (desktop)** | Centered card, max-w-md, generous padding |
| **<768px (mobile)** | Full-width card with p-4 margin, no side margins, logo scales down |
| **Touch targets** | All buttons ≥44px height (Button lg = h-12 = 48px ✓) |
| **Keyboard on mobile** | Single-column layout avoids horizontal scroll, inputs sized for mobile keyboard |

---

## 12. Dark Mode

All tokens have dark mode variants defined in `theme.css`. No additional work needed beyond using existing tokens:

| Light | Dark |
|-------|------|
| `bg-surface-secondary` (#F8FAFC) | `bg-surface-secondary` (#1E293B) |
| `text-text-primary` (#0F172A) | `text-text-primary` (#F8FAFC) |
| `border-border` (#E2E8F0) | `border-border` (#334155) |

---

## 13. Icons Required (from lucide-react)

| Icon | Usage |
|------|-------|
| `Mail` | Email input left icon |
| `Lock` | Password input left icon |
| `User` | Full name input left icon |
| `Eye` | Password visibility (hidden state) |
| `EyeOff` | Password visibility (visible state) |
| `CheckCircle` | Success states, password requirements met |
| `XCircle` | Error states |
| `AlertCircle` | Warning/info alerts |
| `ArrowLeft` | "Back to sign in" link icon |
| `Loader2` | Spinner (replaces `animate-spin` SVG in Button) |

---

## 14. New Component Proposals

### Alert Component (New)

Needed for auth error/success banners. Proposal:

```typescript
type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  variant: AlertVariant;
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}
```

**Styling:**
| Variant | Background | Border | Text | Icon Color |
|---------|-----------|--------|------|------------|
| success | `bg-success-50` | `border-success-200` | `text-success-700` | `text-success-500` |
| error | `bg-error-50` | `border-error-200` | `text-error-700` | `text-error-500` |
| warning | `bg-warning-50` | `border-warning-200` | `text-warning-700` | `text-warning-500` |
| info | `bg-info-50` | `border-info-200` | `text-info-700` | `text-info-500` |

**Layout:** `flex items-start gap-3 p-4 rounded-lg border`

This component should be added to `packages/shared/src/design-system/components/Alert.tsx`.

### PasswordStrength Component (New)

Visual strength meter. Proposal:

```typescript
interface PasswordStrengthProps {
  password: string;
}
```

Renders a segmented bar (4 segments) that fills based on complexity. Each segment uses a color from the existing palette.

This can be an internal component in the auth pages — does not need to be in the shared design system unless reused elsewhere.

---

## 15. Acceptance Criteria for FrontendArchitect (THE-192)

### Auth Shell
- [ ] Shared auth layout with centered card on `surface-secondary` background
- [ ] Logo/branding at top of card
- [ ] Responsive: full-width on mobile, max-w-md on desktop

### Login
- [ ] Email + password fields with correct icons
- [ ] Password visibility toggle works
- [ ] "Remember me" checkbox (stored in localStorage)
- [ ] "Forgot password" link navigates to `#forgot-password`
- [ ] "Sign up" link navigates to `#register`
- [ ] Form validation: required fields, email format, min password length
- [ ] API error display (invalid credentials)
- [ ] Loading state on submit button
- [ ] Redirect after successful login (respects `?redirect=` param)
- [ ] Keyboard: Enter submits, Tab navigates logically

### Registration
- [ ] Full name + email + password fields with correct icons
- [ ] Password strength meter updates on keystroke
- [ ] Password requirement checklist with live checkmarks
- [ ] Form validation: all fields required, email unique, password rules
- [ ] API error display (email already registered)
- [ ] Loading state on submit
- [ ] Redirect to login with success message after registration
- [ ] "Sign in" link navigates to `#login`

### Forgot Password
- [ ] Email field with validation
- [ ] Submit sends reset request
- [ ] Success state shows "check your email" message
- [ ] Resend button with 60s cooldown
- [ ] "Back to sign in" link
- [ ] Does NOT reveal whether email exists (security)

### Reset Password
- [ ] New password + confirm password fields
- [ ] Password strength meter
- [ ] Password match validation
- [ ] Invalid/expired token error state
- [ ] Success state with redirect to login

### Auth Guard
- [ ] Unauthenticated users redirect to `#login?redirect=<current>`
- [ ] After login, redirect to saved destination
- [ ] 401 responses trigger session expiry toast + redirect
- [ ] Protected `#/admin/*` routes require admin role

### Design System Compliance
- [ ] Only existing design system components used (Button, Input, Card, Container, Stack)
- [ ] New `Alert` component added to shared design system
- [ ] All tokens from `theme.css` — no hardcoded values
- [ ] Dark mode works via existing token system

### Accessibility
- [ ] All inputs have visible labels
- [ ] Errors announced with `role="alert"`
- [ ] Focus management on route change
- [ ] All interactive elements keyboard accessible
- [ ] Contrast ratios meet WCAG AA

---

*Document created by UXDesigner. Ready for FrontendArchitect handoff.*
