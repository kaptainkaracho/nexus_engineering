# Landing Page Wireframes — Epic B.3

**Owner:** UXDesigner
**Parent:** Sprint 13 — Epic B: Go-to-Market Polish
**Depends on:** Design System Tokens (theme.css), Auth Flow patterns
**Feeds:** FrontendArchitect — Epic B.2: Onboarding UI + Landing Page

---

## 1. Design Principles Applied

| Lens | Decision |
|------|----------|
| **Cognitive Load** | Single-page layout with clear visual hierarchy. Navigation ≤5 items (within Miller's Law). Content zones separated by whitespace and subtle background changes. |
| **Fitts's Law** | Primary CTA ("Get Started") is top-right in nav AND center hero — two access points. "Sign In" is smaller, top-left. |
| **Gestalt: Similarity** | Feature cards use consistent visual language (icon + title + description). Each card is a unified visual unit. |
| **Gestalt: Proximity** | Related sections grouped by background changes. CTA buttons are always near their value proposition text. |
| **Hick's Law** | Hero section offers exactly 2 choices: "Get Started" (primary) or "Sign In" (secondary). Feature section shows 6 cards in 3×2 grid — scannable within seconds. |
| **F-pattern scanning** | Headline + subheadline at top (F top bar). Feature cards in horizontal rows (F crossbar). CTA repeated at bottom (F lower bar). |
| **Aesthetic-Usability Effect** | Clean, modern SaaS landing page. Consistent spacing, rounded cards, subtle shadows. Design tokens throughout. |
| **Jakob's Law** | Follows SaaS landing page conventions: nav bar → hero → features → CTA → footer. Users instantly recognize the pattern. |
| **Accessibility (WCAG POUR)** | All content sections have proper heading hierarchy (h1 → h2 → h3). Color is never the sole indicator. All interactive elements have focus rings. |
| **Peak-End Rule** | Users will remember the hero (peak visual impact) and the closing CTA (end experience). Both are designed with maximum polish. |

---

## 2. Landing Page Layout — Full Page

```
┌─────────────────────────────────────────────────────────────┐
│  [Nexus]    Product  Discovery  Projects  Pricing  [Sign In] │ ← Fixed nav, h-16
│                                              [Get Started]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────── HERO ─────────────────────────────────┐    │
│  │                                                      │    │
│  │  Engineering Intelligence                            │    │ ← h1, text-5xl
│  │  for the Modern Enterprise                           │    │
│  │                                                      │    │
│  │  Connect your tools, trace requirements to           │    │ ← p, text-xl
│  │  deployments, and ship with confidence.              │    │
│  │                                                      │    │
│  │  ┌──────────────────┐  ┌──────────────────┐         │    │
│  │  │  Get Started →   │  │  Watch Demo      │         │    │ ← CTAs
│  │  └──────────────────┘  └──────────────────┘         │    │
│  │                                                      │    │
│  │  ┌───┐ ┌───┐ ┌───┐                                  │    │
│  │  │Trust││Trust││Trust│                                │    │ ← Social proof / logos
│  │  │Logo ││Logo ││Logo │                                │    │
│  │  └───┘ └───┘ └───┘                                  │    │
│  │                                                      │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  ┌────────── FEATURES ──────────────────────────────────┐   │
│  │                                                      │   │
│  │  Everything you need to engineer with confidence     │   │ ← h2 section title
│  │                                                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │   │
│  │  │ 🎯       │  │ 🔍       │  │ 🔗        │           │   │
│  │  │ Requirement│  │ Artifact  │  │ Traceability│       │   │ ← Feature cards 3×2
│  │  │ Tracking  │  │ Discovery │  │           │           │   │
│  │  └──────────┘  └──────────┘  └──────────┘           │   │
│  │                                                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │   │
│  │  │ 📊       │  │ 🔐       │  │ 🚀        │           │   │
│  │  │ Quality   │  │ Enterprise│  │ Deployment│          │   │
│  │  │ Analytics │  │ Security  │  │ Insights  │          │   │
│  │  └──────────┘  └──────────┘  └──────────┘           │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  ┌────────── STATS ────────────────────────────────────┐   │
│  │                                                      │   │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐             │   │
│  │  │ 99.9%│  │ 10K+ │  │ 500+ │  │ <100ms│            │   │ ← Stats / metrics bar
│  │  │Uptime│  │Projects│  │Integs│  │ Latency│           │   │
│  │  └──────┘  └──────┘  └──────┘  └──────┘             │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  ┌────────── CTA ───────────────────────────────────────┐   │
│  │                                                      │   │
│  │  Ready to transform your engineering workflow?       │   │ ← h2
│  │                                                      │   │
│  │  Start shipping with confidence today.               │   │ ← p
│  │                                                      │   │
│  │  ┌──────────────────────────────┐                    │   │
│  │  │  Start Free →                │                    │   │ ← Primary CTA
│  │  └──────────────────────────────┘                    │   │
│  │  No credit card required. Free tier includes 3 users. │   │ ← footnote
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  ┌────────── FOOTER ───────────────────────────────────┐   │
│  │                                                      │   │
│  │  Nexus Engineering          Product  Company  Legal  │   │
│  │  © 2026 Nexus Engineering   [links]  [links] [links] │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Navigation Bar

### Route: Persistent on `/` (landing page)

```
┌─────────────────────────────────────────────────────────────┐
│  [Nexus Logo]    Product  Discovery  Projects  Pricing      │ ← h-16 bg-surface-primary
│                                              [Sign In]      │    border-b border-border
│                                              [Get Started]  │    fixed top-0 z-50
└─────────────────────────────────────────────────────────────┘
```

| Element | Component / Token | Notes |
|---------|------------------|-------|
| **Container** | `fixed top-0 left-0 right-0 h-16 bg-surface-primary/95 backdrop-blur-sm border-b border-border z-50` | Glass-morphism effect |
| **Logo** | `flex items-center gap-2 font-bold text-lg text-text-primary` | Links to `#/` |
| **Nav links** | `text-sm font-medium text-text-secondary hover:text-text-primary transition-colors` | 5 links max |
| **Sign In** | `<Button variant="ghost" size="sm">` | Links to `#login` |
| **Get Started** | `<Button variant="primary" size="sm">` | Links to `#register` or `#onboarding` |
| **Mobile** | Hamburger icon on <768px. Nav becomes overlay drawer. | Same pattern as admin sidebar |

---

## 4. Hero Section

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                                                      │    │
│  │     Engineering Intelligence                         │    │ ← h1
│  │     for the Modern Enterprise                        │    │
│  │                                                      │    │
│  │     Connect your tools, trace requirements to        │    │ ← p, subtitle
│  │     deployments, and ship with confidence.           │    │
│  │                                                      │    │
│  │     ┌──────────────────┐  ┌──────────────────┐       │    │
│  │     │  Get Started →   │  │  Watch Demo      │       │    │ ← Primary + secondary CTAs
│  │     └──────────────────┘  └──────────────────┘       │    │
│  │                                                      │    │
│  │     Trusted by engineering teams at                  │    │ ← Social proof label
│  │     ┌──────────────┐  ┌──────────────┐  ┌──────────┐│    │
│  │     │  [Logo 1]    │  │  [Logo 2]    │  │ [Logo 3] ││    │ ← Company logos
│  │     └──────────────┘  └──────────────┘  └──────────┘│    │
│  │                                                      │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Specs

| Element | Component / Token | Notes |
|---------|------------------|-------|
| **Section bg** | `bg-gradient-to-b from-primary-50/50 to-surface-secondary` | Subtle gradient |
| **Padding** | `pt-32 pb-20 px-4` (pt accounts for fixed nav) | Desktop |
| **Container** | `max-w-5xl mx-auto text-center` | Centered content |
| **Headline** | `<h1>` | `text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary leading-tight` |
| **Highlight** | `text-primary-600` | On "Intelligence" word (optional accent) |
| **Subtitle** | `<p>` | `text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mt-4` |
| **CTA group** | `flex items-center justify-center gap-4 mt-8 flex-wrap` | Row of buttons |
| **Primary CTA** | `<Button variant="primary" size="lg">` | "Get Started →" |
| **Secondary CTA** | `<Button variant="secondary" size="lg">` | "Watch Demo" |
| **Social proof** | `mt-12 pt-8 border-t border-border` | Separator line |
| **Proof label** | `text-sm text-text-tertiary mb-4` | "Trusted by engineering teams at" |
| **Logo row** | `flex items-center justify-center gap-8 opacity-50` | 3 placeholder logos, grayscale |

---

## 5. Feature Highlights

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                                                      │    │
│  │  Everything you need to engineer                     │    │ ← h2
│  │  with confidence                                     │    │
│  │                                                      │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────┐│    │
│  │  │  ┌────────────┐  │  │  ┌────────────┐  │  │┌────┐││    │
│  │  │  │ 🎯 Target │  │  │  │ 🔍 Search  │  │  ││🔗   │││    │
│  │  │  └────────────┘  │  │  └────────────┘  │  ││Chain│││    │
│  │  │    Requirement    │  │    Artifact       │  ││Trace│││    │
│  │  │    Tracking       │  │    Discovery      │  ││ability||    │
│  │  └──────────────────┘  └──────────────────┘  └──────┘│    │
│  │                                                      │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────┐│    │
│  │  │  ┌────────────┐  │  │  ┌────────────┐  │  │┌────┐││    │
│  │  │  │ 📊 Chart  │  │  │  │ 🔐 Shield  │  │  ││🚀   │││    │
│  │  │  └────────────┘  │  │  └────────────┘  │  ││Rocket││    │
│  │  │    Quality        │  │    Enterprise     │  ││Deploy││    │
│  │  │    Analytics      │  │    Security       │  ││Insight│    │
│  │  └──────────────────┘  └──────────────────┘  └──────┘│    │
│  │                                                      │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Feature Card Spec

| Element | Token |
|---------|-------|
| **Card** | `<Card variant="outlined" padding="lg">` with `hover:shadow-md transition-shadow` |
| **Icon container** | `w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center mb-4` |
| **Icon** | lucide-react icon, `w-6 h-6 text-primary-500` |
| **Title** | `text-base font-semibold text-text-primary` |
| **Description** | `text-sm text-text-secondary mt-1 leading-relaxed` |
| **Grid** | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` |

### Feature Cards Content

| # | Icon | Title | Description |
|---|------|-------|-------------|
| 1 | `Target` | Requirement Tracking | Capture, organize, and trace requirements from ideation to deployment. Full bidirectional traceability. |
| 2 | `Search` | Artifact Discovery | Automatically discover and index artifacts across your connected registries and repositories. |
| 3 | `Link` | Traceability Chains | Visualize end-to-end traceability from requirements through features, tests, and deployments. |
| 4 | `BarChart3` | Quality Analytics | Real-time quality scores, trend analysis, and actionable insights for your engineering process. |
| 5 | `Shield` | Enterprise Security | SSO, SAML, OAuth, RBAC, and audit logs. Enterprise-grade security out of the box. |
| 6 | `Rocket` | Deployment Insights | Track deployments, monitor release quality, and correlate changes to outcomes. |

---

## 6. Stats / Metrics Bar

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                                                      │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │    │
│  │  │   99.9%    │  │   10,000+  │  │   500+     │     │    │
│  │  │  Platform  │  │  Projects  │  │Integrations│     │    │
│  │  │  Uptime    │  │  Tracked   │  │  Supported  │     │    │
│  │  └────────────┘  └────────────┘  └────────────┘     │    │
│  │                                                      │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Specs

| Element | Token |
|---------|-------|
| **Section bg** | `bg-surface-primary border-y border-border` |
| **Padding** | `py-16 px-4` |
| **Container** | `max-w-4xl mx-auto` |
| **Grid** | `grid grid-cols-1 md:grid-cols-3 gap-8` |
| **Value** | `text-3xl md:text-4xl font-bold text-primary-600` |
| **Label** | `text-sm text-text-secondary mt-1` |

---

## 7. CTA Section

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                                                      │    │
│  │  Ready to transform your engineering                 │    │ ← h2
│  │  workflow?                                           │    │
│  │                                                      │    │
│  │  Start shipping with confidence today.               │    │ ← p
│  │                                                      │    │
│  │  ┌──────────────────────────────────────┐            │    │
│  │  │        Start Free →                  │            │    │ ← Primary CTA
│  │  └──────────────────────────────────────┘            │    │
│  │                                                      │    │
│  │  No credit card required. Free tier includes 3 users.│    │ ← footnote
│  │                                                      │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Specs

| Element | Token |
|---------|-------|
| **Section bg** | `bg-gradient-to-b from-surface-secondary to-primary-50/30` |
| **Padding** | `py-20 px-4` |
| **Container** | `max-w-2xl mx-auto text-center` |
| **Headline** | `text-3xl md:text-4xl font-bold text-text-primary` |
| **Subtitle** | `text-lg text-text-secondary mt-3` |
| **CTA** | `<Button variant="primary" size="xl">` — custom `h-14 px-10 text-base` |
| **Footnote** | `text-sm text-text-tertiary mt-4` |

---

## 8. Footer

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Nexus Engineering                                    │    │ ← Logo, left column
│  │  © 2026 Nexus Engineering. All rights reserved.       │    │
│  │                                                      │    │
│  │  Product         Company          Legal               │    │ ← Link columns
│  │  Features        About            Privacy             │    │
│  │  Pricing         Blog             Terms               │    │
│  │  Integrations    Careers          Security            │    │
│  │  Changelog       Contact          Cookies             │    │
│  │                                                      │    │
│  │  [GitHub icon] [Twitter icon] [LinkedIn icon]        │    │ ← Social links
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Specs

| Element | Token |
|---------|-------|
| **Section bg** | `bg-surface-primary border-t border-border` |
| **Padding** | `py-12 px-4` |
| **Layout** | `max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8` |
| **Logo area** | `col-span-2 md:col-span-1` |
| **Link column title** | `text-sm font-semibold text-text-primary mb-3` |
| **Link items** | `text-sm text-text-tertiary hover:text-text-primary transition-colors block py-1` |
| **Copyright** | `text-sm text-text-tertiary mt-4` |
| **Social icons** | `flex gap-4 mt-6` — `text-text-tertiary hover:text-text-primary` |
| **Bottom bar** | Full-width: `border-t border-border mt-8 pt-6 text-center text-xs text-text-tertiary` |

---

## 9. Deployment Status Indicator

The landing page includes a live deployment status badge positioned in the nav bar (right side, near "Sign In").

```
┌─────────────────────────────────────────────────────────────┐
│  [Nexus]    Product  Discovery  Projects  Pricing          │
│                                    [● Operational] [Sign In]│
└─────────────────────────────────────────────────────────────┘
```

### Specs

| Element | Token |
|---------|-------|
| **Container** | `flex items-center gap-1.5 text-xs font-medium` |
| **Dot** | `w-2 h-2 rounded-full` — `bg-success-500` (operational), `bg-warning-500` (degraded), `bg-error-500` (down) |
| **Label** | `text-text-secondary` |
| **Hover** | Tooltip: "Platform status: All systems operational" with last-checked timestamp |
| **Click** | Navigates to `#/status` (status page) |
| **Source** | `GET /api/system/status` — cached 60s, updates via polling |

### Status States

| State | Dot Color | Label | Tooltip |
|-------|-----------|-------|---------|
| **Operational** | `bg-success-500` | "Operational" | "All systems operational. Last checked 30s ago." |
| **Degraded** | `bg-warning-500` | "Degraded" | "Some services experiencing issues. Investigating." |
| **Down** | `bg-error-500` | "Down" | "Service disruption detected. Working on it." |
| **Loading** | `bg-neutral-300 animate-pulse` | "Loading..." | "Checking status..." |

---

## 10. Component Mapping

| Wireframe Element | Design System Component | Token/Variant |
|-------------------|------------------------|---------------|
| **Nav container** | Custom shell div | `fixed h-16 bg-surface-primary/95 backdrop-blur-sm border-b border-border` |
| **Nav links** | `<a>` text links | `text-sm font-medium text-text-secondary` |
| **Nav CTAs** | `<Button variant="primary/ghost" size="sm">` | Standard |
| **Hero headline** | `<h1>` | `text-5xl font-bold text-text-primary` |
| **Hero subtitle** | `<p>` | `text-xl text-text-secondary` |
| **Hero CTAs** | `<Button variant="primary/secondary" size="lg">` | h-12, px-8 |
| **Feature grid** | Custom CSS grid | `grid-cols-3 gap-6` |
| **Feature card** | `<Card variant="outlined" padding="lg">` | `hover:shadow-md` |
| **Feature icon** | lucide-react icon in container | `w-12 h-12 rounded-xl bg-primary-50` |
| **Stats section** | Custom grid of stat blocks | `grid-cols-3 gap-8` |
| **Stat value** | `<span>` | `text-4xl font-bold text-primary-600` |
| **Stat label** | `<span>` | `text-sm text-text-secondary` |
| **CTA section** | Custom centered container | `max-w-2xl mx-auto text-center` |
| **CTA button** | `<Button variant="primary" size="xl">` | `h-14 px-10 text-base` |
| **Footer** | Custom grid layout | `grid-cols-4 gap-8` |
| **Status badge** | Custom inline component | `flex items-center gap-1.5 text-xs` |
| **Status dot** | `<span>` | `w-2 h-2 rounded-full` |
| **Social proof logos** | `<img>` or SVG placeholders | `h-8 opacity-50 grayscale` |

---

## 11. Responsive Behavior

| Viewport | Layout Adaptation |
|----------|-------------------|
| **≥1024px (desktop)** | Full multi-column layout. 3-column feature grid. 4-column footer. Fixed nav with glass-morphism. |
| **768-1023px (tablet)** | Nav collapses to hamburger. Feature grid becomes 2 columns. Stats stack 3 rows. CTA remains centered. |
| **<768px (mobile)** | Nav becomes overlay drawer. Hero text scales down (text-3xl). Feature grid 1 column. Stats 1 column. CTAs stack vertically. Footer 2 columns. |

### Mobile Nav

```
┌──────────────────────────────────┐
│ [≡] Nexus                 [● Op] │ ← Hamburger + status
├──────────────────────────────────┤
│  (overlay drawer)                │
│  ┌──────────── overlay ──────┐   │
│  │ ○ Product                  │   │
│  │ ○ Discovery                │   │
│  │ ○ Projects                 │   │
│  │ ○ Pricing                  │   │
│  │                            │   │
│  │ [Sign In]                  │   │
│  │ [Get Started]              │   │
│  └────────────────────────────┘   │
└──────────────────────────────────┘
```

### Mobile Hero

```
┌──────────────────────────────────┐
│                                  │
│  Engineering Intelligence        │
│  for the Modern Enterprise       │
│                                  │
│  Connect your tools, trace       │
│  requirements to deployments,    │
│  and ship with confidence.       │
│                                  │
│  ┌──────────────────────────┐    │
│  │     Get Started →        │    │
│  └──────────────────────────┘    │
│  ┌──────────────────────────┐    │
│  │     Watch Demo           │    │
│  └──────────────────────────┘    │
│                                  │
└──────────────────────────────────┘
```

---

## 12. Dark Mode

All tokens from `theme.css`. Same dark mode pattern as all other UX docs.

| Light | Dark |
|-------|------|
| `bg-surface-primary` (#FFFFFF) | `bg-surface-primary` (#0F172A) |
| `bg-surface-secondary` (#F8FAFC) | `bg-surface-secondary` (#1E293B) |
| `text-text-primary` (#0F172A) | `text-text-primary` (#F8FAFC) |
| `border-border` (#E2E8F0) | `border-border` (#334155) |
| Hero gradient: `from-primary-50/50` | Hero gradient: `from-primary-950/30` |
| Social proof logos: `opacity-50 grayscale` | Same (works on dark bg) |

---

## 13. Icons Required (from lucide-react)

| Icon | Usage |
|------|-------|
| `Target` | Feature: Requirement Tracking |
| `Search` | Feature: Artifact Discovery |
| `Link` | Feature: Traceability Chains |
| `BarChart3` | Feature: Quality Analytics |
| `Shield` | Feature: Enterprise Security |
| `Rocket` | Feature: Deployment Insights |
| `ArrowRight` | Primary CTA icon |
| `Play` | "Watch Demo" CTA icon |
| `CheckCircle` | Status: Operational |
| `AlertTriangle` | Status: Degraded / Down |
| `Loader2` | Status: Loading |
| `Menu` | Mobile hamburger |
| `X` | Mobile drawer close |
| `Github` | Social link |
| `Twitter` | Social link |
| `Linkedin` | Social link |
| `ChevronRight` | Breadcrumb / nav indicator |

---

## 14. Accessibility Checklist

| Criterion | Implementation |
|-----------|---------------|
| **Heading hierarchy** | h1 (hero) → h2 (sections) → h3 (feature cards) |
| **Nav landmark** | `<nav aria-label="Main navigation">`, `aria-current="page"` on active |
| **Skip link** | "Skip to main content" link at very top of page |
| **CTA buttons** | Visible text labels, not icon-only |
| **Feature cards** | Keyboard navigable, hover not required for content |
| **Status indicator** | `role="status"`, `aria-live="polite"`, color-independence (icon + label) |
| **Social proof** | Company logo `alt` text, decorative icons `aria-hidden="true"` |
| **Footer links** | Keyboard navigable, visible focus rings |
| **Mobile nav** | `aria-expanded` on hamburger, focus trap when open |
| **Contrast** | All text meets WCAG AA. Hero gradient ensures headline contrast. |
| **Reduced motion** | `prefers-reduced-motion` — no parallax or scroll animations |
| **Focus management** | Skip link focus, nav link focus, CTA focus visible |

---

## 15. Route & Integration Notes

### Route

- Landing page lives at `#/` or `/` — replaces the current default view
- When user is authenticated, `#/` shows dashboard (not landing page)
- Landing page is shown only when NOT authenticated (public route)

### Deployment Status API

```
GET /api/system/status
→ { status: 'operational' | 'degraded' | 'down', lastChecked: string }
```

- Polled every 60 seconds from the client
- Cached server-side for 30s
- Falls back gracefully to "Unknown" if API unreachable

### Navigation Link Targets

| Link | Target | Notes |
|------|--------|-------|
| Product (nav) | `#/features` | Internal features page (future) |
| Discovery (nav) | `#/discovery` | Only if authenticated, else redirect to login |
| Projects (nav) | `#/projects` | Only if authenticated, else redirect to login |
| Pricing (nav) | `#/pricing` | Static pricing page (future) |
| Sign In | `#login` | Auth flow |
| Get Started | `#register` → redirect to `#onboarding` | Onboarding flow |
| Watch Demo | `#/demo` | Demo video / interactive tour (future) |
| Privacy (footer) | `#/legal/privacy` | Static page |
| Terms (footer) | `#/legal/terms` | Static page |

---

## 16. Acceptance Criteria for FrontendArchitect

### Navigation
- [ ] Fixed top nav with glass-morphism (bg + backdrop-blur)
- [ ] Logo + 4 nav links + Sign In + Get Started
- [ ] Mobile: hamburger overlay drawer
- [ ] Deployment status badge in nav (right side)
- [ ] Active nav link indicator on scroll

### Hero Section
- [ ] Headline + highlighted accent word
- [ ] Subtitle paragraph
- [ ] Primary CTA ("Get Started →") links to register/onboarding
- [ ] Secondary CTA ("Watch Demo") — see future
- [ ] Social proof section with company logo placeholders
- [ ] Responsive text sizing

### Feature Highlights
- [ ] 6 feature cards in 3×2 grid (responsive: 2-col tablet, 1-col mobile)
- [ ] Each card: icon + title + description
- [ ] Hover shadow elevation effect
- [ ] Section title + subtitle

### Stats / Metrics Bar
- [ ] 3 stat blocks: Uptime (99.9%), Projects (10K+), Integrations (500+)
- [ ] Responsive: side-by-side desktop, stacked mobile

### CTA Section
- [ ] Closing headline + subtitle
- [ ] Primary CTA (large, centered)
- [ ] Footnote: "No credit card required..."

### Footer
- [ ] Logo + copyright
- [ ] 3 link columns (Product, Company, Legal)
- [ ] Social media icon links
- [ ] Bottom copyright bar

### Deployment Status Indicator
- [ ] Inline badge in nav
- [ ] 4 states: Operational, Degraded, Down, Loading
- [ ] Color-dot + text label
- [ ] Polled via API every 60s
- [ ] Tooltip with details on hover

### Design System Compliance
- [ ] All tokens from `theme.css` — no hardcoded values
- [ ] Existing components: Button, Card, Badge
- [ ] Dark mode via existing token system
- [ ] Consistent spacing, type, and color scales

### Responsive
- [ ] Desktop (≥1024px): full layout, 3-col features, fixed nav
- [ ] Tablet (768-1023px): hamburger nav, 2-col features, stacked stats
- [ ] Mobile (<768px): single column, stacked CTAs, overlay nav
- [ ] All touch targets ≥44px

### Accessibility
- [ ] Skip link at top of page
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] ARIA landmarks: `<nav>`, `<main>`, `<footer>`
- [ ] Status indicator: `role="status"`, `aria-live="polite"`
- [ ] Mobile nav: `aria-expanded`, focus trap
- [ ] All interactive elements have visible focus
- [ ] Reduced motion respected

---

## 17. UX Quality Checklist (Self-Review)

| Criterion | Status |
|-----------|--------|
| **Visual hierarchy** — Hero is most visually prominent. Features scannable. CTA is clear call to action. | ✅ |
| **Spacing** — Scale used: `gap-4`, `gap-6`, `gap-8`, `p-4`, `p-12`, `py-20` from spacing tokens. | ✅ |
| **Alignment** — Content centered within max-width containers. Grids aligned. | ✅ |
| **Type system** — `text-xs` through `text-6xl` from typography scale. | ✅ |
| **Empty states** — N/A (static marketing page, no dynamic content) | ✅ |
| **Loading states** — Status indicator has loading state. Graceful fallback if API unreachable. | ✅ |
| **Error states** — N/A (static page). Status indicator shows "Unknown" on API error. | ✅ |
| **Edge cases** — Authenticated user reroute to dashboard. Mobile nav focus trap. | ✅ |
| **Dark mode** — All tokens invert via `theme.css`. No hardcoded colors. | ✅ |
| **Accessibility** — Skip link, heading hierarchy, ARIA landmarks, keyboard nav. | ✅ |
| **No dark patterns** — Clear CTAs, no misleading buttons, honest status indicator. | ✅ |
| **Performance** — Static page, no heavy JS. Status polling is minimal (60s interval). | ✅ |

---

*Document created by UXDesigner (Epic B.3). Ready for FrontendArchitect handoff — see Epic B.2 implementation issue.*
