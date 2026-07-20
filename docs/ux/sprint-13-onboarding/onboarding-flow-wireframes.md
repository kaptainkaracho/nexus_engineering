# Onboarding Flow Wireframes — Epic B.3

**Owner:** UXDesigner
**Parent:** Sprint 13 — Epic B: Go-to-Market Polish
**Depends on:** Auth Flow Wireframes (THE-193), Design System Tokens (theme.css)
**Feeds:** FrontendArchitect — Epic B.2: Onboarding UI + Landing Page

---

## 1. Design Principles Applied

| Lens | Decision |
|------|----------|
| **Cognitive Load** | Wizard pattern: one screen at a time, max 4 actions per screen. Progress indicator shows position and remaining steps. |
| **Fitts's Law** | "Next" button is bottom-right, large touch target (h-12). "Skip" is small, top-right (h-8) — less prominent but always accessible. |
| **Hick's Law** | Max 3 choices per step (profile role selection, project action). No overwhelming option grids. |
| **Goal-Gradient** | Progress indicator fills left-to-right; each completed step triggers micro-transition (checkmark + brief animation). Users accelerate toward the end. |
| **Jakob's Law** | Multi-step wizard follows SaaS conventions: progress bar at top, content center, navigation bottom-right. Matches Stripe/Notion/Slack onboarding mental model. |
| **Tesler's Law** | Tour step is automatic (no user input). Complexity pushed to the system — pre-built demo project available. |
| **Forgiveness** | "Skip" available on every step. "Back" preserves form state. Tour can be re-triggered from help menu later. |
| **Progressive Disclosure** | Profile form shows only essential fields. Advanced settings (avatar, bio) are secondary. First project offers "Import demo" as one-click path. |
| **Aesthetic-Usability Effect** | Clean, card-based layout with consistent spacing, subtle step transitions, and generous whitespace. Design tokens throughout. |
| **Accessibility (WCAG POUR)** | Progress indicator has `aria-valuenow` / `aria-valuemax`. Step content has `role="group"` with `aria-label`. Skip/Back/Next have visible labels. |

---

## 2. Onboarding Shell

All onboarding screens share a consistent wizard shell, distinct from the auth shell and admin shell.

```
┌─────────────────────────────────────────────────────┐
│  [Nexus]                              [Skip →]      │ ← Top bar: logo left, skip right
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  ● ● ● ○ ○   Step 2 of 4                   │    │ ← Progress indicator (varies per step)
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │                                             │    │
│  │             [Step Content]                  │    │ ← Card with step content
│  │                                             │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │  [Back]                    [Next →]         │    │ ← Navigation bar
│  └─────────────────────────────────────────────┘    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Layout Specs

| Element | Component / Token | Notes |
|---------|------------------|-------|
| **Page bg** | `bg-surface-secondary` | Same as auth shell |
| **Card bg** | `bg-surface-primary` | `<Card variant="default" padding="lg">` |
| **Card max-width** | `max-w-2xl w-full` | Wider than auth cards for content |
| **Centering** | `flex min-h-screen items-center justify-center p-4` | Same pattern as auth |
| **Logo** | `text-2xl font-bold text-primary-600` | Top-left, consistent with auth |
| **Skip button** | `<Button variant="ghost" size="sm">` | Top-right, h-8 |
| **Step title** | `<h2>` | `text-2xl font-semibold text-text-primary` |
| **Step subtitle** | `<p>` | `text-sm text-text-secondary` |
| **Footer nav** | `flex items-center justify-between` | Back (left), Next (right) |
| **Back button** | `<Button variant="secondary" size="lg">` | With `ArrowLeft` icon |
| **Next button** | `<Button variant="primary" size="lg">` | With `ArrowRight` icon |

---

## 3. Progress Indicator Design

### Variant A: Stepped Progress Bar (Primary)

```
┌─────────────────────────────────────────────────────┐
│                                                      │
│  ┌──────┐  ───  ┌──────┐  ───  ┌──────┐  ───  ┌──────┐
│  │  1   │       │  2   │       │  3   │       │  4   │
│  │      │       │      │       │      │       │      │
│  └──────┘       └──────┘       └──────┘       └──────┘
│    Welcome       Profile       Project         Tour
│                                                      │
│              Step 2 of 4 — Profile Setup             │ ← always visible
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Variant B: Slim Linear Bar (Alternative)

```
┌─────────────────────────────────────────────────────┐
│  ████████████░░░░░░░░░░░░░  55%                      │
│  Step 3 of 4  →  First Project                       │
└─────────────────────────────────────────────────────┘
```

### Interaction States

| State | Visual | Behavior |
|-------|--------|----------|
| **Completed** | Circle filled `bg-primary-500 text-white`, checkmark icon | Animates from active to completed on "Next" click |
| **Active** | Circle `border-2 border-primary-500 bg-primary-50 text-primary-700 font-semibold` | Pulsing dot inside |
| **Upcoming** | Circle `border-2 border-border bg-surface-primary text-text-tertiary` | Dimmed, no interaction |
| **Transition** | `transition-all duration-300` | Step label crossfades; progress bar animates width |

### Specs

| Element | Token |
|---------|-------|
| Step circle (completed) | `w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center` |
| Step circle (active) | `w-10 h-10 border-2 border-primary-500 bg-primary-50 text-primary-700 rounded-full` |
| Step circle (upcoming) | `w-10 h-10 border-2 border-border bg-surface-primary text-text-tertiary rounded-full` |
| Connector line | `h-0.5 w-12 bg-border` (incomplete), `bg-primary-500` (completed) |
| Step label | `text-xs font-medium` — color matches circle state |
| "Step N of M" | `text-sm text-text-tertiary text-center` below circles |
| Checkmark | `<Check>` from lucide-react, `w-5 h-5` |

### Accessibility

- `role="progressbar"` with `aria-valuenow` (1-4) and `aria-valuemax="4"`
- `aria-label="Step {n} of 4: {step name}"`
- Each step circle has `aria-current="step"` when active

---

## 4. Skip Option UX

### Behavior Specification

| Aspect | Detail |
|--------|--------|
| **Visibility** | Shown on all 4 onboarding screens |
| **Position** | Top-right of shell, above progress bar |
| **Label** | `"Skip →"` (desktop), icon-only on mobile (`ArrowRight` with `aria-label="Skip onboarding"`) |
| **Trigger** | Click/tap anywhere on the button |
| **Confirmation** | First skip shows a confirmation modal: "Are you sure? You can always come back to these settings later." |
| **Skip context** | Subsequent skips suppress the confirmation (session flag) |
| **After skip** | Navigate to default app dashboard (`#/`) or landing page |
| **Recovery** | Onboarding can be re-triggered from `#settings/onboarding` or help menu |
| **State persistence** | `localStorage` key `nexus_onboarding_completed` — prevents showing again |
| **Partial completion** | Each completed step saves state individually. If user skips at step 3, steps 1-2 data is saved. |

### Confirmation Modal

```
┌──────────────────────────────────────────────┐
│  Skip onboarding?                      [×]   │
├──────────────────────────────────────────────┤
│                                              │
│  You can access all settings later from      │
│  your account settings.                      │
│                                              │
│  [ Stay ]              [ Skip for now ]      │
│                              (primary btn)    │
│                                              │
│  [x] Don't ask me again                      │
└──────────────────────────────────────────────┘
```

### Skip Button Spec

| State | Desktop | Mobile |
|-------|---------|--------|
| **Idle** | `"Skip →"` text + arrow icon | Arrow icon only |
| **Hover** | `text-primary-700` + underline | Same |
| **After confirmation** | No modal on subsequent skips | Same |

---

## 5. Screen 1: Welcome

### Route: `#onboarding` or `/onboarding`

```
┌──────────────────────────────────────────────┐
│  Nexus                             [Skip →]   │
│                                               │
│  ● ○ ○ ○   Step 1 of 4 — Welcome             │
│                                               │
│  ┌──────────────────────────────────────┐    │
│  │                                      │    │
│  │      [Nexus logo — Layers icon]      │    │ ← 64x64, centered
│  │                                      │    │
│  │  Welcome to Nexus                    │    │ ← h1: text-3xl font-bold text-center
│  │                                      │    │
│  │  Your engineering intelligence       │    │
│  │  platform. Connect your tools,       │    │ ← text-center, text-secondary
│  │  discover patterns, and ship with    │    │    max-w-md mx-auto
│  │  confidence.                         │    │
│  │                                      │    │
│  │  ┌──────────────────────────────┐    │    │
│  │  │      Get Started →           │    │    │ ← Button variant="primary" size="lg"
│  │  └──────────────────────────────┘    │    │    fullWidth, h-12
│  │                                      │    │
│  │  Already set up?  Sign in            │    │ ← link to #login
│  │                                      │    │
│  └──────────────────────────────────────┘    │
│                                               │
│  [Back]                    [Next →]           │
└──────────────────────────────────────────────┘
```

### Content Spec

| Element | Value |
|---------|-------|
| **Icon** | `<Layers>` from lucide-react, `w-16 h-16 text-primary-500`, in `bg-primary-50 dark:bg-primary-950 rounded-2xl p-4 mx-auto` |
| **Headline** | "Welcome to Nexus" |
| **Subheadline** | "Your engineering intelligence platform. Connect your tools, discover patterns, and ship with confidence." |
| **CTA** | "Get Started →" — full-width primary button |
| **Secondary link** | "Already set up? Sign in" — links to `#login` |
| **Animation** | Icon fades in (300ms), text slides up (400ms), button fades in (500ms) — staggered entrance |

### Interaction Details

- **"Get Started"** click → animate to Step 2 (slide left exit + slide right enter, 300ms)
- **"Sign in"** click → navigate to `#login` (no onboarding state saved)
- **"Skip"** → confirmation modal, then `#/` (dashboard)
- **Back button** — disabled on this step (no previous step)

---

## 6. Screen 2: Profile Setup

### Route: `#onboarding/profile`

```
┌──────────────────────────────────────────────┐
│  Nexus                             [Skip →]   │
│                                               │
│  ● ● ○ ○   Step 2 of 4 — Profile Setup       │
│                                               │
│  ┌──────────────────────────────────────┐    │
│  │                                      │    │
│  │  Set up your profile                 │    │ ← h2
│  │  Tell us about yourself              │    │ ← subtitle
│  │                                      │    │
│  │  ┌──────────────────────────────┐    │    │
│  │  │ Display name                 │    │    │ ← Input with label
│  │  │ [ John Doe                         │    │
│  │  └──────────────────────────────┘    │    │
│  │                                      │    │
│  │  ┌──────────────────────────────┐    │    │
│  │  │ What best describes you?     │    │    │ ← label for role selector
│  │  │                              │    │    │
│  │  │ ┌────────────────────────┐   │    │    │
│  │  │ │ ○ Engineering Manager  │   │    │    │ ← Radio option
│  │  │ ├────────────────────────┤   │    │    │
│  │  │ │ ○ Developer           │   │    │    │ ← Default selected
│  │  │ ├────────────────────────┤   │    │    │
│  │  │ │ ○ Product Manager     │   │    │    │
│  │  │ ├────────────────────────┤   │    │    │
│  │  │ │ ○ DevOps / Platform   │   │    │    │
│  │  │ ├────────────────────────┤   │    │    │
│  │  │ │ ○ Other               │   │    │    │
│  │  │ └────────────────────────┘   │    │    │
│  │  └──────────────────────────────┘    │    │
│  │                                      │    │
│  │  Avatar — optional                   │    │
│  │  ┌────┐                              │    │
│  │  │ JD │  [ Upload photo ]            │    │ ← Avatar preview (initials) + upload button
│  │  └────┘                              │    │
│  │                                      │    │
│  └──────────────────────────────────────┘    │
│                                               │
│  [Back]                    [Next →]           │
└──────────────────────────────────────────────┘
```

### Field Specifications

| Field | Component | Validation | Notes |
|-------|-----------|------------|-------|
| **Display name** | `<Input label="Display name" placeholder="Jane Smith" />` | Required, min 2 chars | Prefilled from auth if available |
| **Role** | `<RadioGroup>` | Optional, defaults to "Developer" | 5 options with descriptions |
| **Avatar** | `<AvatarInput>` — custom composite | Optional | Click opens file picker (png/jpg, max 2MB). Shows initials fallback. |

### Role Options

| Role | Icon | Description |
|------|------|-------------|
| Engineering Manager | `<Users>` | "I manage engineering teams" |
| Developer | `<Code2>` | "I write code day-to-day" |
| Product Manager | `<ClipboardList>` | "I define product requirements" |
| DevOps / Platform | `<Server>` | "I manage infrastructure" |
| Other | `<MoreHorizontal>` | "Something else" |

### Interaction Details

- **Name field auto-focused** on entry
- **Role selection** uses radio cards (not raw radio buttons) — same pattern as private-registry-ux.md §9 RadioGroup
- **Avatar upload** opens native file picker. Previews immediately. `input type="file" accept="image/png,image/jpeg"` max 2MB. If no upload, show initials in `<Avatar>` component.
- **"Next"** validates name field only (role is optional). Saves to user profile via `PUT /api/users/me/profile`.
- **"Back"** returns to welcome step with preserved state.

---

## 7. Screen 3: First Project

### Route: `#onboarding/project`

```
┌──────────────────────────────────────────────┐
│  Nexus                             [Skip →]   │
│                                               │
│  ● ● ● ○   Step 3 of 4 — First Project       │
│                                               │
│  ┌──────────────────────────────────────┐    │
│  │                                      │    │
│  │  Your first project                  │    │ ← h2
│  │  Let's get some data in Nexus        │    │ ← subtitle
│  │                                      │    │
│  │  ┌──────────────────────────────┐    │    │
│  │  │  ┌────────────────────────┐   │    │    │
│  │  │  │ [Rocket icon]          │   │    │    │
│  │  │  │                        │   │    │    │
│  │  │  │ Explore Demo Project   │   │    │    │ ← Card option 1 (primary)
│  │  │  │                        │   │    │    │
│  │  │  │ See Nexus in action     │   │    │    │
│  │  │  │ with a pre-built        │   │    │    │
│  │  │  │ demo project            │   │    │    │
│  │  │  │                        │   │    │    │
│  │  │  │ [ Import demo → ]      │   │    │    │ ← CTA button
│  │  │  └────────────────────────┘   │    │    │
│  │  │                              │    │    │
│  │  │  ┌────────────────────────┐   │    │    │
│  │  │  │ [Plus icon]            │   │    │    │
│  │  │  │                        │   │    │    │
│  │  │  │ Create Blank Project   │   │    │    │ ← Card option 2 (secondary)
│  │  │  │                        │   │    │    │
│  │  │  │ Start from scratch     │   │    │    │
│  │  │  │ with an empty project   │   │    │    │
│  │  │  │                        │   │    │    │
│  │  │  │ [ Create blank → ]     │   │    │    │
│  │  │  └────────────────────────┘   │    │    │
│  │  └──────────────────────────────┘    │    │
│  │                                      │    │
│  │  Also: Connect your repo             │    │ ← Subtle link below cards
│  │  Link a GitHub/GitLab repository to  │    │
│  │  automatically import data.          │    │
│  │                                      │    │
│  └──────────────────────────────────────┘    │
│                                               │
│  [Back]                    [Next →]           │
└──────────────────────────────────────────────┘
```

### Card Option Spec

| Element | Import Demo | Create Blank |
|---------|-------------|--------------|
| **Card style** | `<Card variant="elevated" padding="lg">` — full width | Same |
| **Icon** | `<Rocket>` primary-500 | `<Plus>` primary-500 |
| **Title** | "Explore Demo Project" | "Create Blank Project" |
| **Description** | "See Nexus in action with a pre-built demo project" | "Start from scratch with an empty project" |
| **CTA** | `<Button variant="primary">` "Import demo →" | `<Button variant="secondary">` "Create blank →" |
| **Hover** | Card elevates `shadow-md` | Same |

### Interaction Details

- **"Import demo"** → calls `POST /api/projects/demo/import` — creates project from seed data. Shows loading spinner within card (not full page). On success: toast "Demo project imported" → auto-proceed to step 4.
- **"Create blank"** → navigates to `#/projects/new` (inline, not modal). After creation, returns to onboarding step 4.
- **"Connect repo"** → subtle link (`text-sm text-text-secondary`), navigates to `#/integrations` if clicked — does not block onboarding.
- **"Skip"** → confirmation modal ("Without a project, you'll see an empty dashboard. You can create one later.") → navigates to `#/`.
- **"Back"** → returns to profile step with preserved state.

---

## 8. Screen 4: Tour

### Route: `#onboarding/tour`

```
┌──────────────────────────────────────────────┐
│  Nexus                             [Skip →]   │
│                                               │
│  ● ● ● ●   Step 4 of 4 — Quick Tour          │
│                                               │
│  ┌──────────────────────────────────────┐    │
│  │                                      │    │
│  │      [Compass icon]                  │    │
│  │                                      │    │
│  │  You're all set!                     │    │ ← h2
│  │                                      │    │
│  │  Here's a quick tour of your         │    │ ← subtitle
│  │  workspace:                          │    │
│  │                                      │    │
│  │  ┌──────────────────────────────┐    │    │
│  │  │  ① Dashboard — View your     │    │    │ ← Tour item 1
│  │  │     engineering metrics      │    │    │
│  │  │     and recent activity       │    │    │
│  │  ├──────────────────────────────┤    │    │
│  │  │  ② Discovery — Search and    │    │    │ ← Tour item 2
│  │  │     browse artifacts across   │    │    │
│  │  │     your connected sources    │    │    │
│  │  ├──────────────────────────────┤    │    │
│  │  │  ③ Projects — Manage         │    │    │ ← Tour item 3
│  │  │     requirements, features,   │    │    │
│  │  │     and traceability          │    │    │
│  │  ├──────────────────────────────┤    │    │
│  │  │  ④ Settings — Configure      │    │    │ ← Tour item 4
│  │  │     your org, integrations,   │    │    │
│  │  │     and team members          │    │    │
│  │  └──────────────────────────────┘    │    │
│  │                                      │    │
│  │  Tip: You can replay this tour      │    │ ← text-xs text-text-tertiary
│  │  anytime from the Help menu.         │    │
│  │                                      │    │
│  └──────────────────────────────────────┘    │
│                                               │
│  [Back]              [Start using Nexus →]    │
└────────────────────────────────────────────────┘
```

### Tour Item Spec

| Element | Token |
|---------|-------|
| **Number circle** | `w-8 h-8 bg-primary-50 text-primary-600 font-semibold text-sm rounded-full flex items-center justify-center flex-shrink-0` |
| **Item title** | `text-sm font-semibold text-text-primary` |
| **Item description** | `text-sm text-text-secondary` |
| **Item layout** | `flex items-start gap-3 p-3` with bottom border |
| **Hover** | `bg-surface-tertiary/30 rounded-lg transition-colors` |

### Post-Tour: Interactive Overlay (Future Enhancement)

After completing the static tour, the user can optionally activate an interactive overlay that highlights key UI elements:

| Step | Target | Tooltip |
|------|--------|---------|
| 1 | Main nav sidebar | "This is your navigation. Use it to switch between sections." |
| 2 | Dashboard stats | "Your key metrics live here — quality scores, recent activity, and trends." |
| 3 | Search bar (top right) | "Search across all your projects and artifacts from here." |
| 4 | User avatar (top right) | "Access your profile, settings, and help documentation." |

Overlay: `fixed inset-0 bg-black/30 z-50`, highlighted element has `ring-2 ring-primary-500 rounded-lg`, tooltip `bg-surface-primary shadow-lg rounded-lg p-3 max-w-xs`.

### Completion Flow

- **"Start using Nexus →"** → sets `localStorage.nexus_onboarding_completed = true` with timestamp. Navigates to `#/` (dashboard).
- **Celebration toast**: `<Alert variant="success">` — "🎉 Welcome to Nexus! Your workspace is ready." Auto-dismisses after 4s.
- **"Back"** → returns to project step (state preserved).

---

## 9. Progress Persistence & State Machine

### Onboarding State

```typescript
interface OnboardingState {
  completed: boolean;
  completedAt?: string; // ISO 8601
  currentStep: 1 | 2 | 3 | 4;
  profile: {
    displayName: string;
    role: string;
    hasAvatar: boolean;
  };
  project: {
    action: 'demo' | 'blank' | 'skip';
    projectId?: string;
  };
  tourCompleted: boolean;
  skipConfirmed: boolean; // true after first skip dialog
}
```

### State Transition Rules

| From | Action | To |
|------|--------|----|
| Step 1 | "Get Started" | Step 2 |
| Step 1 | "Skip" | Skip confirmation → Dashboard |
| Step 1 | "Back" | (disabled) |
| Step 2 | "Next" (valid) | Step 3 |
| Step 2 | "Back" | Step 1 (state preserved) |
| Step 2 | "Skip" | Skip confirmation → Dashboard |
| Step 3 | "Import demo" (success) | Step 4 |
| Step 3 | "Create blank" (success) | Step 4 |
| Step 3 | "Back" | Step 2 (state preserved) |
| Step 3 | "Skip" | Skip confirmation → Dashboard |
| Step 4 | "Start using Nexus" | Dashboard, state = completed |

### Storage

- **Temporary**: In-memory React state (useState/useReducer)
- **Persistent per-step**: `localStorage.setItem('nexus_onboarding', JSON.stringify(state))` on each "Next"
- **Final**: `localStorage.setItem('nexus_onboarding_completed', 'true')`
- **Server**: Profile data synced to `PUT /api/users/me/profile` on step 2. Project created on step 3.

---

## 10. Component Mapping

| Wireframe Element | Design System Component | Token/Variant |
|-------------------|------------------------|---------------|
| Page background | `bg-surface-secondary` | `--surface-secondary` |
| Wizard card | `<Card variant="default" padding="lg">` | `max-w-2xl w-full shadow-sm` |
| Step title | `<h2>` | `text-2xl font-semibold text-text-primary` |
| Step subtitle | `<p>` | `text-sm text-text-secondary` |
| Welcome icon | `<Layers>` in custom container | `w-16 h-16 text-primary-500` |
| Progress circles | Custom stepper | See §3 |
| Progress connector | Custom `<div>` | `h-0.5 w-12` |
| Skip button | `<Button variant="ghost" size="sm">` | Top-right, h-8 |
| Back button | `<Button variant="secondary" size="lg">` | With `<ArrowLeft>` |
| Next / CTA button | `<Button variant="primary" size="lg" fullWidth>` | h-12 |
| Form input | `<Input>` | Standard variants |
| Radio group | `<RadioGroup>` (proposed) | See private-registry-ux.md §9 |
| Avatar | `<Avatar>` (proposed) | See admin-ui-mockups.md §9 |
| Skip confirmation | `<Modal size="sm">` (proposed) | See admin-ui-mockups.md §9 |
| Toast (success) | `<Alert variant="success">` | Auto-dismiss 4s |
| Tour items | Custom `<TourItem>` | `flex items-start gap-3 p-3` |
| Text link | `<a>` | `text-sm text-primary-600 hover:text-primary-700` |
| Empty state (no project) | `<Card padding="lg">` centered | `text-center py-12` |

---

## 11. New Component Proposals

### OnboardingStepper Component

```typescript
interface Step {
  id: number;
  label: string;
}

interface OnboardingStepperProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
}
```

### TourItem Component

```typescript
interface TourItemProps {
  number: number;
  title: string;
  description: string;
  active?: boolean;
}
```

---

## 12. Responsive Behavior

| Viewport | Layout Adaptation |
|----------|-------------------|
| **≥768px (desktop)** | Centered card, max-w-2xl, generous padding. Progress circles with labels. |
| **<768px (mobile)** | Full-width card with p-4 margin. Progress bar (slim linear variant) instead of circles. Role radio cards stack full-width. Two-choice project cards stack vertically. "Skip" becomes icon-only. |
| **Touch targets** | All buttons ≥44px height (Button lg = h-12 = 48px ✓). Radio card padding ≥12px. |
| **Keyboard on mobile** | Single-column layout avoids horizontal scroll. Inputs sized for mobile keyboard. |

### Mobile Progress Variant

```
┌──────────────────────────────────────┐
│  ████████████░░░░░░░░  50%           │
│  Step 3 of 4 — First Project         │
└──────────────────────────────────────┘
```

---

## 13. Dark Mode

All tokens have dark mode variants defined in `theme.css`. Same pattern as auth and admin docs.

| Light | Dark |
|-------|------|
| `bg-surface-secondary` (#F8FAFC) | `bg-surface-secondary` (#1E293B) |
| `bg-surface-primary` (#FFFFFF) | `bg-surface-primary` (#0F172A) |
| `text-text-primary` (#0F172A) | `text-text-primary` (#F8FAFC) |
| `border-border` (#E2E8F0) | `border-border` (#334155) |

---

## 14. Icons Required (from lucide-react)

| Icon | Usage |
|------|-------|
| `Layers` | Welcome screen hero icon |
| `ArrowRight` | Next button, skip button (mobile) |
| `ArrowLeft` | Back button |
| `Check` | Progress step completed |
| `Rocket` | "Import Demo" card icon |
| `Plus` | "Create Blank" card icon, add project |
| `Users` | Engineering Manager role |
| `Code2` | Developer role |
| `ClipboardList` | Product Manager role |
| `Server` | DevOps role |
| `MoreHorizontal` | "Other" role, overflow |
| `Compass` | Tour screen icon |
| `Upload` | Avatar upload button |
| `User` | Avatar fallback |
| `X` | Modal close |
| `AlertTriangle` | Skip confirmation warning |
| `Loader2` | Loading spinner |

---

## 15. Accessibility Checklist

| Criterion | Implementation |
|-----------|---------------|
| **Progress indicator** | `role="progressbar"`, `aria-valuenow`, `aria-valuemax`, `aria-label` |
| **Step container** | `role="group"` with `aria-label="Step N: {name}"` |
| **Skip button** | Visible text label, or `aria-label="Skip onboarding"` on mobile |
| **Back/Next buttons** | `aria-label="Go to previous step"` / `"Go to next step"` |
| **Form fields** | Visible labels, `aria-describedby` for errors, `aria-invalid` |
| **Radio group** | `role="radiogroup"`, `role="radio"`, `aria-checked` |
| **Modal (skip confirm)** | Focus trap, `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| **Keyboard nav** | Enter/Next on "Next", Escape skips, Tab through form fields |
| **Focus management** | First focusable element on step enter. Previous trigger on step leave. |
| **Announcements** | Step change announced via `aria-live="polite"` region |
| **Contrast** | All text meets WCAG AA. Tokens from existing palette. |
| **Reduced motion** | `prefers-reduced-motion` — instant step transitions, no pulse animation |
| **Touch targets** | All interactive elements ≥44×44px on mobile |

---

## 16. Route Protection & Auth Integration

### Onboarding Guard

Onboarding should only be accessible:
- After registration (first login)
- Via explicit navigation from settings (replay)
- Must NOT be accessible to users who have completed it (redirect to `#/`)

```typescript
function OnboardingGuard() {
  if (localStorage.getItem('nexus_onboarding_completed') === 'true') {
    return <Navigate to="#/" />;
  }
  // If not authenticated → redirect to login first
  if (!isAuthenticated) {
    return <Navigate to="#login?redirect=%23onboarding" />;
  }
  return <OnboardingFlow />;
}
```

### Post-Onboarding Redirect

- **Normal completion**: Navigate to `#/` (dashboard)
- **Skip**: Navigate to `#/` (dashboard, empty state)
- **On re-authentication after skip**: Navigate to `#/` (skip onboarding check)

---

## 17. Acceptance Criteria for FrontendArchitect

### Onboarding Shell
- [ ] Wizard layout with centered card on `surface-secondary`
- [ ] Logo top-left, Skip top-right
- [ ] Progress indicator with step labels
- [ ] Back/Next navigation buttons
- [ ] Responsive: full-width on mobile, max-w-2xl on desktop

### Welcome Screen (Step 1)
- [ ] Hero icon + headline + subheadline
- [ ] "Get Started" CTA (full-width primary button)
- [ ] "Already set up? Sign in" secondary link
- [ ] Staggered entrance animation

### Profile Setup (Step 2)
- [ ] Display name input with validation (min 2 chars)
- [ ] Role selection as radio cards (5 options)
- [ ] Avatar upload with preview + initials fallback
- [ ] All fields prefilled from auth if available
- [ ] "Back" returns to welcome with preserved state

### First Project (Step 3)
- [ ] Two choice cards: Import Demo (primary) / Create Blank (secondary)
- [ ] "Import demo" triggers POST with loading state
- [ ] "Create blank" navigates to project creation
- [ ] "Connect your repo" subtle link
- [ ] "Back" returns to profile with preserved state

### Tour (Step 4)
- [ ] Checkmark + "You're all set" message
- [ ] 4 tour items with numbered circles
- [ ] "Start using Nexus" completion CTA
- [ ] Settings overlay tooltip pattern (optional enhancement)

### Progress Indicator
- [ ] 4-step visual with completed/active/upcoming states
- [ ] Responsive: circles on desktop, linear bar on mobile
- [ ] Checkmark animation on completion
- [ ] ARIA progressbar attributes

### Skip Option
- [ ] Visible on all steps (top-right)
- [ ] First skip shows confirmation modal
- [ ] Skip confirmed navigates to dashboard
- [ ] Partial state preserved (data saved up to current step)
- [ ] Can replay from settings

### Design System Compliance
- [ ] All tokens from `theme.css` — no hardcoded values
- [ ] Existing components: Button, Input, Card, Badge, Avatar, Modal
- [ ] New components: OnboardingStepper, TourItem (proposed)
- [ ] Dark mode via existing token system
- [ ] Consistent with auth shell layout pattern

### Accessibility
- [ ] Progressbar with `aria-valuenow`
- [ ] Step groups with `aria-label`
- [ ] Visible labels on all form fields
- [ ] Focus management on step transitions
- [ ] `aria-live` announcements for step changes
- [ ] Touch targets ≥44px on mobile

### State Management
- [ ] Per-step state persistence in localStorage
- [ ] Completed flag prevents re-onboarding
- [ ] Skip confirmation flag (session)
- [ ] Profile synced to API on step 2
- [ ] Project created on step 3

---

## 18. UX Quality Checklist (Self-Review)

| Criterion | Status |
|-----------|--------|
| **Visual hierarchy** — Primary action (Next) is prominent. Skip is intentionally less prominent. | ✅ |
| **Spacing** — Scale used: `gap-3`, `gap-4`, `gap-6`, `p-4`, `p-6`, `p-8` from spacing tokens. | ✅ |
| **Alignment** — Card-centered vertically and horizontally. Form fields aligned left. | ✅ |
| **Type system** — `text-sm`, `text-base`, `text-lg`, `text-2xl`, `text-3xl` from typography scale. | ✅ |
| **Empty states** — Dashboard will be empty if user skips project — handled via skip confirmation. | ✅ |
| **Loading states** — Project import shows loading spinner on card. | ✅ |
| **Error states** — API errors on profile save and project import displayed as inline Alert. | ✅ |
| **Edge cases** — Already-authenticated reroute, completed-guard, partial-completion recovery, re-onboarding. | ✅ |
| **Dark mode** — All tokens invert via `theme.css`. No hardcoded colors. | ✅ |
| **Accessibility** — Color-independence, keyboard nav, ARIA, focus management. | ✅ |
| **No dark patterns** — Skip is honest (no trickery). Data saved before skip. Confirmation on destructive skip. | ✅ |
| **Data minimization** — Only display name, role, avatar collected. Role is optional. | ✅ |

---

*Document created by UXDesigner (Epic B.3). Ready for FrontendArchitect handoff — see Epic B.2 implementation issue.*
