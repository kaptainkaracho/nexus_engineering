# Epic B.3 — Onboarding UX + Landing Page Wireframes

**Completed:** 2026-07-19
**Guard:** ✅ Produced within 5-minute code window

## Artifacts Created

| File | Description |
|------|-------------|
| `onboarding-flow-wireframes.md` | Complete onboarding flow: welcome → profile → first project → tour (4 screens). Progress indicator design. Skip option UX with confirmation modal. State machine, persistence spec, component mapping, accessibility checklist. |
| `landing-page-wireframes.md` | Landing page redesign: nav bar, hero section, 6-feature grid, stats/metrics bar, CTA section, footer. Deployment status indicator in nav. Full responsive spec (desktop/tablet/mobile). |
| `mockups/onboarding-flow.svg` | Visual wireframe: all 4 onboarding screens in a single view |
| `mockups/landing-page.svg` | Visual wireframe: full landing page layout |

## Design System Compliance

- All colors reference `theme.css` CSS custom properties — **zero hardcoded values**
- All typography uses scale from theme (text-xs through text-6xl)
- All components map to existing design system (Card, Button, Input, Badge, Avatar, Modal)
- New components proposed: `OnboardingStepper`, `TourItem` (with TypeScript interfaces)
- Dark mode supported via existing token inversion

## Key Design Decisions

1. **Progress indicator**: Stepped circles (desktop) / slim linear bar (mobile) with completed/active/upcoming states
2. **Skip behavior**: First skip shows confirmation modal; subsequent skips bypass. Partial state preserved.
3. **Tour**: Static list format (no interactive overlay in v1) — extensible to interactive tooltip walkthrough
4. **Landing page**: Fixed glass-nav, hero with gradient background, 6-card feature grid, live deployment status badge
5. **Route protection**: Onboarding guarded by `OnboardingGuard` — completed users redirected to dashboard

## Handoff to FrontendArchitect

See acceptance criteria sections in each document:
- `onboarding-flow-wireframes.md` §17 — 12 checklist items
- `landing-page-wireframes.md` §16 — 9 checklist items

## Escalation Note

Per Sprint 13 plan: This document was produced within the 5-minute code window. No escalation needed.
