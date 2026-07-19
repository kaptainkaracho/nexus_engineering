# Feature Browser UX Design — Epic B (THE-233)

**Author:** UXDesigner
**Date:** 2026-07-19
**Status:** Ready for FrontendArchitect handoff
**Parent:** THE-228 (Sprint 12)
**Related:** THE-231 (FAC Backend), THE-232 (FAC Frontend)

---

## 1. Design Rationale

The Feature Browser is the primary interface for navigating Features as Code (FAC) documents. Users need to:
- **Discover** features across domains quickly
- **Inspect** feature details (description, status, user stories, acceptance criteria)
- **Trace** feature→requirement links inline without losing context
- **Filter** by domain, status, or search term

### Design Lens Choices

| Lens | Application |
|------|-------------|
| **Gestalt: Proximity** | Feature cards group related info (name, status, story count) tightly; user stories are visually separated from trace links |
| **Gestalt: Similarity** | Status badges use consistent color coding from design system (`draft`=neutral, `approved`=success, `implemented`=primary, `deprecated`=error) |
| **Fitts's Law** | Primary action (select feature) is the full card — large click target. Secondary actions (trace link) are smaller but still meet 44px minimum |
| **Hick's Law** | Sidebar filter limited to 3 dimensions: search, domain dropdown, status chips — not a complex filter panel |
| **Jakob's Law** | Layout mirrors TAC Viewer master-detail pattern — users familiar with TAC will feel at home |
| **Cognitive Load** | Detail panel shows one feature at a time; user stories and trace links are collapsible sections, not all visible at once |
| **Information Scent** | Sidebar previews: feature name, status badge, user story count — enough to decide whether to click |
| **Recognition over Recall** | Trace links expand inline with requirement detail on click; no need to remember requirement IDs |

---

## 2. Information Architecture

```
Feature Browser
├── Header
│   ├── Title: "Feature Browser"
│   └── Subtitle: description + document count
├── Summary Stats (4 cards)
│   ├── Total Features
│   ├── Approved count
│   ├── Implementation coverage (%)
│   └── Document count
├── Main Content (two-panel)
│   ├── Sidebar (list panel)
│   │   ├── Search input
│   │   ├── Domain filter (dropdown or chips)
│   │   ├── Status filter (chip group)
│   │   ├── Feature list (scrollable)
│   │   │   └── Feature card (name, status, story count, domain)
│   │   └── Document count footer
│   └── Detail Panel
│       ├── Empty state (select a feature)
│       ├── Loading state (skeleton)
│       ├── Error state
│       └── Feature Detail
│           ├── Feature header (name, status, ID, domain)
│           ├── Description
│           ├── User Stories section
│           │   └── Story card (role, want, soThat)
│           │       └── Acceptance Criteria (given/when/then)
│           └── Trace Links section
│               └── Trace link (type, target, confidence)
│                   └── Inline requirement detail (expandable)
```

---

## 3. Wireframes

### 3.1 Desktop (1440×900)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ┌──────┐                                                           │
│  │  B   │  The Bike App                              [user] [🌙]   │
│  └──────┘                                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Feature Browser                                                    │
│  Browse and manage product features defined as .feature.yaml       │
│  documents. Track status, user stories, and requirement traces.    │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │  Total   │ │ Approved │ │ Coverage │ │ Documents│              │
│  │    8     │ │    5     │ │   62%    │ │    3     │              │
│  │ features │ │ features │ │ traced   │ │ loaded   │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
│                                                                     │
│  ┌─── Search ──────────────────┐  ┌─── Detail Panel ─────────────┐│
│  │ 🔍 [search features...    ] │  │                              ││
│  │                             │  │  feat-one-click-checkout     ││
│  │ Domain: [All ▼]             │  │  ─────────────────────────── ││
│  │ Status: [All][Draft][Appr]  │  │  Status: ● approved          ││
│  │         [Impl][Deprec]      │  │  Domain: checkout            ││
│  │                             │  │  ID: feat-one-click-checkout ││
│  │ ┌─────────────────────────┐ │  │                              ││
│  │ │ ● One-Click Checkout    │ │  │  Allow returning customers  ││
│  │ │   approved · 2 stories  │ │  │  to complete a purchase     ││
│  │ ├─────────────────────────┤ │  │  with a single tap using a  ││
│  │ │ ○ Guest Checkout        │ │  │  saved payment method.      ││
│  │ │   draft · 1 story       │ │  │                              ││
│  │ ├─────────────────────────┤ │  │  ┌── User Stories ─────────┐││
│  │ │ ● express-shipping      │ │  │  │                         │││
│  │ │   approved · 3 stories  │ │  │  │  US-OC-1                │││
│  │ ├─────────────────────────┤ │  │  │  As a returning customer│││
│  │ │ ◐ loyalty-points        │ │  │  │  I want to complete my  │││
│  │ │   implemented · 2 storie│ │  │  │  purchase with one tap  │││
│  │ ├─────────────────────────┤ │  │  │  so that I can avoid    │││
│  │ │ × returns-policy        │ │  │  │  re-entering payment... │││
│  │ │   deprecated · 0 stories│ │  │  │                         │││
│  │ └─────────────────────────┘ │  │  │  Acceptance Criteria:   │││
│  │                             │  │  │  ✓ Given I am signed-in │││
│  │  8 features · 3 documents  │  │  │    with a saved card     │││
│  └─────────────────────────────┘  │  │    When I tap "Buy now"  │││
│                                   │  │    Then the order is     │││
│                                   │  │    placed using saved    │││
│                                   │  │    payment details       │││
│                                   │  │                         │││
│                                   │  │  ✓ Given I have no saved │││
│                                   │  │    payment method        │││
│                                   │  │    When I tap "Buy now"  │││
│                                   │  │    Then I am prompted to │││
│                                   │  │    add a payment method  │││
│                                   │  └─────────────────────────┘││
│                                   │                              ││
│                                   │  ┌── Trace Links ──────────┐││
│                                   │  │ satisfies → REQ-CHECKOUT │││
│                                   │  │ -001 [high]              │││
│                                   │  │ ↳ "Satisfies the fast   │││
│                                   │  │    checkout requirement" │││
│                                   │  └─────────────────────────┘││
│                                   └──────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Mobile (390×844)

```
┌───────────────────────┐
│ ┌──┐ The Bike App     │
│ │B │          [🌙]    │
└───────────────────────┘
│ Feature Browser       │
│ Browse and manage     │
│ product features...   │
│                       │
│ ┌────┐ ┌────┐        │
│ │  8 │ │  5 │        │
│ │total│ │appv│        │
│ └────┘ └────┘        │
│ ┌────┐ ┌────┐        │
│ │62% │ │  3 │        │
│ │trce│ │docs│        │
│ └────┘ └────┘        │
│                       │
│ 🔍 [search...]       │
│ [All ▼] [Draft][Appr]│
│                       │
│ ┌─────────────────────┐
│ │ ● One-Click Checkout│
│ │   approved · 2 st.  │
│ ├─────────────────────┤
│ │ ○ Guest Checkout    │
│ │   draft · 1 story   │
│ ├─────────────────────┤
│ │ ● express-shipping  │
│ │   approved · 3 st.  │
│ └─────────────────────┘
│                       │
│  ← Feature Browser   │  (back button on detail)
│                       │
│ ┌─────────────────────┐
│ │ One-Click Checkout  │
│ │ ● approved          │
│ │                     │
│ │ Allow returning     │
│ │ customers to...     │
│ │                     │
│ │ ▼ User Stories (2)  │
│ │   US-OC-1           │
│ │   As returning cust.│
│ │   I want...         │
│ │   so that...        │
│ │                     │
│ │   Acceptance Criteria│
│ │   ✓ Given...        │
│ │     When...         │
│ │     Then...         │
│ │                     │
│ │ ▼ Trace Links (1)   │
│ │   satisfies →       │
│ │   REQ-CHECKOUT-001  │
│ └─────────────────────┘
└───────────────────────┘
```

---

## 4. Interaction Specs

### 4.1 Feature Selection

| State | Behavior |
|-------|----------|
| **Idle** | Sidebar shows feature list. Detail panel shows empty state with prompt. |
| **Click/Enter on feature** | Feature card highlights. Detail panel loads feature data. Sidebar card gets `border-primary-500` + `bg-primary-500/5`. |
| **Keyboard** | `Tab` through list items. `Enter`/`Space` to select. `↑`/`↓` to navigate within list (roving tabindex). |
| **Mobile** | Selecting a feature hides sidebar, shows detail with back button. Back returns to list. |

### 4.2 Search & Filter

| Element | Behavior |
|---------|----------|
| **Search input** | Debounced 300ms. Searches feature name, description, ID. Placeholder: "Search features..." |
| **Domain filter** | Dropdown populated from loaded documents. Options: "All" + unique domains. |
| **Status filter** | Horizontal chip group: All, Draft, Approved, Implemented, Deprecated. Single-select. `aria-pressed` on active. |
| **Combined** | All filters are AND-combined. Result count updates in footer. |

### 4.3 User Stories Section

| State | Behavior |
|-------|----------|
| **Collapsed** | Shows section header: "User Stories (N)". Click to expand. |
| **Expanded** | Shows story cards stacked vertically. Each card shows: ID (mono), role, want, soThat. |
| **Acceptance Criteria** | Nested under each story. Given/When/Then format. Displayed as a structured list, not prose. |

### 4.4 Trace Links Section

| State | Behavior |
|-------|----------|
| **Collapsed** | Shows section header: "Trace Links (N)". Click to expand. |
| **Expanded** | Shows trace link items: type badge, target ID (clickable), confidence badge. |
| **Target click** | Expands inline requirement detail below the link (like TAC Viewer pattern). Fetches requirement via API. Shows: title, description, type, priority, status. |
| **Loading** | Spinner + "Loading requirement..." text while fetching. |
| **Error** | "Requirement could not be loaded" with target ID still visible. |

### 4.5 States

#### Empty State (no features loaded)
```
┌─────────────────────────────────────┐
│                                     │
│           📋                        │
│                                     │
│     No features defined yet.        │
│                                     │
│  Create .feature.yaml documents     │
│  in docs/features/ to see them      │
│  here.                              │
│                                     │
│        [Refresh]                    │
│                                     │
└─────────────────────────────────────┘
```

#### Empty State (no search results)
```
┌─────────────────────────────────────┐
│                                     │
│           🔍                        │
│                                     │
│  No features found for "xyz".       │
│                                     │
│     Try a different search.         │
│                                     │
└─────────────────────────────────────┘
```

#### Loading State
```
┌─────────────────────────────────────┐
│  ┌───────┐ ┌───────┐ ┌───────┐    │
│  │ ████  │ │ ████  │ │ ████  │    │
│  │ ███   │ │ ███   │ │ ███   │    │
│  └───────┘ └───────┘ └───────┘    │
│  ┌───────┐ ┌───────┐ ┌───────┐    │
│  │ ████  │ │ ████  │ │ ████  │    │
│  │ ███   │ │ ███   │ │ ███   │    │
│  └───────┘ └───────┘ └───────┘    │
└─────────────────────────────────────┘
```
(Same skeleton pattern as TestResultsDashboard)

#### Error State
```
┌─────────────────────────────────────┐
│  ⚠ Error loading features:         │
│  {error message}                    │
│                                     │
│  [Retry]                            │
└─────────────────────────────────────┘
```

---

## 5. Component Specifications

### 5.1 Reuse from Design System

| Component | Usage | Notes |
|-----------|-------|-------|
| `Container size="lg"` | Page wrapper | Matches TAC/TestResults pattern |
| `Card variant="default" padding="md"` | Feature cards in sidebar | Consistent with existing list items |
| `Card variant="outlined" padding="lg"` | Empty state, detail sections | Visual hierarchy: outlined = secondary |
| `Badge variant={status}` | Feature status, trace confidence | Use existing variants: `draft`, `approved`, `implemented`, `deprecated` |
| `Badge variant={traceType}` | Trace link types | Use existing: `satisfies`, `dependsOn`, `tracesTo`, `refines`, `conflictsWith` |
| `Button variant="secondary" size="sm"` | Retry, refresh actions | Consistent with error states |
| `Input` | Search field | With left search icon |
| `Stack gap={N}` | Vertical spacing | Token values: 2, 3, 4, 6 |
| `Grid cols={4} gap={4}` | Summary stat cards | Matches TestResultsDashboard layout |

### 5.2 New Patterns (Not New Components)

These are composition patterns, not new design system components:

| Pattern | Description | Reuse elsewhere |
|---------|-------------|-----------------|
| **Stat Card** | Label + large value + hint text in a Card | Already exists in TestResultsDashboard as `StatCard` — extract to shared if needed |
| **Filter Chip Group** | Horizontal button group with `aria-pressed` | Already exists in TestResultsDashboard as `ter-filter-chip` — align styling |
| **Expandable Section** | Collapsible section with header toggle | TAC Viewer uses inline expand. Standardize if needed. |
| **Inline Trace Detail** | Expands below trace link on click | TAC Viewer already implements this pattern — match exactly |

### 5.3 Token Usage

| Token | Usage |
|-------|-------|
| `text-text-primary` | Feature names, section headings |
| `text-text-secondary` | Descriptions, story text |
| `text-text-tertiary` | IDs, meta info, labels |
| `bg-surface-primary` | Card backgrounds |
| `bg-surface-secondary` | Page background, hover states |
| `border-border` | Card borders, dividers |
| `bg-primary-500/5` | Selected feature card highlight |
| `border-primary-500` | Selected feature card border |

---

## 6. Accessibility Spec

### 6.1 Keyboard Navigation

- **Tab order:** Search → Domain filter → Status chips → Feature list → Detail panel
- **Feature list:** Roving tabindex. `↑`/`↓` moves focus. `Enter`/`Space` selects.
- **Expandable sections:** `Enter`/`Space` toggles. `aria-expanded` on trigger.
- **Trace links:** `Enter` expands inline detail. `Escape` collapses.
- **Mobile back button:** Focus management — return focus to selected feature in list.

### 6.2 ARIA

| Element | ARIA |
|---------|------|
| Feature list | `role="listbox"` + `aria-label="Features"` |
| Feature items | `role="option"` + `aria-selected` |
| Status filter group | `role="group"` + `aria-label="Filter by status"` |
| Status chips | `aria-pressed` |
| Expandable sections | `aria-expanded` on trigger, `aria-controls` targeting content |
| Trace link expand | `aria-expanded` + `aria-controls` |
| Empty state | `role="status"` (live region for search results) |
| Loading | `aria-busy="true"` on container |
| Error | `role="alert"` |

### 6.3 Color Independence

- Status conveyed via: Badge color + text label + icon (●/○/◐/×)
- Trace confidence: Badge text ("high"/"medium"/"low") — not color-only
- Domain: Text label, not color-coded

### 6.4 Contrast

- All text tokens from design system meet WCAG AA (4.5:1 normal text, 3:1 large text)
- Badge backgrounds use 10% opacity — text remains high-contrast
- Focus ring: `ring-2 ring-primary-500 ring-offset-2` — visible on both themes

### 6.5 Reduced Motion

- Expandable sections: Use CSS `transition` with `prefers-reduced-motion` media query
- No animated transitions required for core functionality
- Loading spinner respects `prefers-reduced-motion`

---

## 7. Responsive Behavior

### Breakpoints

| Breakpoint | Layout |
|------------|--------|
| **≥1024px (lg)** | Two-panel: sidebar (340px) + detail panel |
| **<1024px** | Single-panel: list or detail, not both |

### Mobile (<1024px)

- **List view:** Full-width feature list with search + filters at top
- **Detail view:** Full-width detail panel. Back button ("← Features") at top.
- **Transition:** Selecting a feature hides list, shows detail. Back returns to list.
- **Filter persistence:** Filters persist when returning from detail view.

### Touch Targets

- Feature cards: Full-width, minimum 48px height
- Filter chips: 44px minimum height
- Trace link buttons: 44px minimum tap area
- Back button: 44px minimum

---

## 8. Handoff to FrontendArchitect

### 8.1 File Structure

```
apps/frontend/src/views/FeatureBrowser/
├── index.tsx              # Main FeatureBrowser component
├── FeatureBrowser.css     # Styles (skeleton, filter chips, table)
├── FeatureDetail.tsx      # Detail panel component
├── FeatureCard.tsx        # Sidebar list item
├── TraceLinkItem.tsx      # Expandable trace link with inline detail
└── UserStoryCard.tsx      # User story + acceptance criteria display
```

### 8.2 API Dependencies (from THE-231)

```
GET /api/fac                    → { data: FeatureDocumentSummary[], total: number }
GET /api/fac/:id                → FeatureDocument (full)
POST /api/fac/validate          → validation result
GET /api/requirements/:id       → Requirement (for trace link expansion)
```

### 8.3 Component Specs for Implementation

#### `<FeatureBrowser />`

```tsx
// State
const [documents, setDocuments] = useState<FeatureDocumentSummary[]>([])
const [selectedId, setSelectedId] = useState<string | null>(null)
const [selectedFeature, setSelectedFeature] = useState<FeatureDetail | null>(null)
const [query, setQuery] = useState('')
const [domainFilter, setDomainFilter] = useState<string>('all')
const [statusFilter, setStatusFilter] = useState<FeatureStatus | 'all'>('all')
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

// Derived
const filtered = documents.filter(doc => {
  const matchesQuery = !query || doc.name.includes(query) || doc.description.includes(query)
  const matchesDomain = domainFilter === 'all' || doc.domain === domainFilter
  const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
  return matchesQuery && matchesDomain && matchesStatus
})

// Layout
<Container size="lg">
  <Stack gap={6}>
    <Header />           {/* Title + subtitle */}
    <SummaryStats />     {/* 4 stat cards in Grid cols={4} */}
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <Sidebar />        {/* Search + filters + list */}
      <DetailPanel />    {/* Empty | Loading | Error | FeatureDetail */}
    </div>
  </Stack>
</Container>
```

#### `<FeatureCard />`

```tsx
// Props
interface FeatureCardProps {
  feature: FeatureSummary  // { id, name, status, domain, storyCount }
  isSelected: boolean
  onSelect: (id: string) => void
}

// Rendering
<Card
  variant="outlined"
  padding="md"
  className={cn(
    'cursor-pointer transition-colors',
    isSelected
      ? 'border-primary-500 bg-primary-500/5'
      : 'hover:bg-surface-secondary/50'
  )}
  onClick={() => onSelect(feature.id)}
  role="option"
  aria-selected={isSelected}
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(feature.id)
    }
  }}
>
  <div className="flex items-center gap-2">
    <Badge variant={feature.status}>{feature.status}</Badge>
    <span className="text-sm font-semibold text-text-primary">{feature.name}</span>
  </div>
  <span className="text-xs text-text-tertiary">
    {feature.domain} · {feature.storyCount} {feature.storyCount === 1 ? 'story' : 'stories'}
  </span>
</Card>
```

#### `<TraceLinkItem />`

```tsx
// Match TAC Viewer pattern exactly
// Inline expansion on click
// Fetch requirement via fetchRequirement(target.id)
// Show: title, description, type, priority, status
// Loading/error states
```

### 8.4 CSS Classes (from FeatureBrowser.css)

```css
/* Skeleton loading — match TestResultsDashboard */
.feature-skeletons { display: grid; gap: 1rem; }
.feature-skeleton { height: 4rem; border-radius: 0.75rem; background: var(--color-neutral-200); }
.feature-skeleton-card { grid-column: span 2; }

/* Filter chips — align with TestResultsDashboard */
.feature-filter-chip { /* same as ter-filter-chip */ }

/* Feature table (if using table layout for list) */
.feature-table { width: 100%; border-collapse: collapse; }
```

---

## 9. Tradeoffs & Decisions

| Decision | Rationale | Alternative Considered |
|----------|-----------|----------------------|
| **Master-detail (not full-page)** | TAC Viewer established this pattern; users expect it for browse+detail flows | Full-page list → detail navigation: loses context, more page transitions |
| **Sidebar 340px fixed** | Matches TAC Viewer; sufficient for feature names + meta | Fluid sidebar: harder to maintain consistent detail panel width |
| **Inline trace expansion** | TAC Viewer does this; keeps user in context | Modal/popover: breaks flow, adds overlay management |
| **Status as chips (not dropdown)** | 4 statuses — chips are faster to scan and toggle than dropdown | Dropdown: saves space but slower to switch |
| **No pagination** | FAC documents are expected to be <50 features; full list is scannable | Pagination: adds complexity for unlikely scale |
| **Stat cards at top** | Provides at-a-glance health; matches TestResultsDashboard pattern | Skip stats: loses quick health check |

---

## 10. Acceptance Criteria for FrontendArchitect

- [ ] Two-panel layout: sidebar (340px) + detail, responsive at lg breakpoint
- [ ] Search input with 300ms debounce, searches name/description/ID
- [ ] Domain filter dropdown populated from loaded documents
- [ ] Status filter chip group: All, Draft, Approved, Implemented, Deprecated
- [ ] Feature list with selection highlight (primary border + bg)
- [ ] Detail panel shows: name, status badge, domain, ID, description
- [ ] User stories section: expandable, shows role/want/soThat per story
- [ ] Acceptance criteria: given/when/then display under each story
- [ ] Trace links section: expandable, shows type badge + target ID + confidence
- [ ] Trace link click: inline requirement detail expansion (matches TAC Viewer)
- [ ] Empty states: no features, no search results
- [ ] Loading state: skeleton cards
- [ ] Error state: message + retry button
- [ ] Mobile: single-panel with back navigation
- [ ] Keyboard: tab navigation, roving tabindex in list, Enter/Space selection
- [ ] ARIA: listbox, option, aria-selected, aria-expanded, role="alert"
- [ ] Uses only existing design system tokens and components
- [ ] No one-off values — all spacing, colors, type from tokens

---

## 11. Residual Risks

1. **Backend API readiness:** THE-231 (FAC Backend) is in_progress. API endpoints may not be available when FrontendArchitect starts. Mitigation: mock API responses for development.
2. **Requirement fetch for trace links:** Depends on existing requirements API. Verify `GET /api/requirements/:id` is available.
3. **Stat card computation:** Requires aggregating status across all features. May need backend support or client-side computation from loaded documents.

---

*Design complete. Ready for FrontendArchitect implementation handoff.*
