# Private Artifact Registry UX — THE-210

**Owner:** UXDesigner
**Parent:** THE-210 (Sprint 10: Private Registry UX Design — Epic B)
**Depends on:** Admin UI Shell (THE-193), Design System Components (Modal, Table, Select, Toggle proposed in THE-193)
**Feeds:** FrontendArchitect (THE-211), Sprint 10/11 implementation

## Integration with Admin Shell

The Private Registry UI lives under the Admin shell defined in `admin-ui-mockups.md` (§2). Add **Registries** as a sidebar nav item:

```
Admin Home     →  #admin              icon: LayoutDashboard
Registries     →  #admin/registries   icon: Package      ← NEW
Teams          →  #admin/teams        icon: Building2
Members        →  #admin/members      icon: Users
Roles          →  #admin/roles        icon: Shield
Audit Log      →  #admin/audit        icon: ScrollText
```

### Route Protection

| Route | Required Role | Notes |
|-------|---------------|-------|
| `#admin` | Admin | Dashboard/overview |
| `#admin/registries` | Admin | Registry management (this spec) |
| `#admin/registries/:id` | Admin | Registry detail view |

---

## 1. Design Principles Applied

| Lens | Decision |
|------|----------|
| **Cognitive Load** | Registry list uses card layout (not raw table) to show type icon + name + status + key metadata in a glance-scannable format. Miller's Law: each registry card shows ≤7 visible attributes. |
| **Gestalt: Common Region** | Each registry is a card with a unified border, containing its metadata grouped into regions (type+name top, URL+status middle, actions bottom). |
| **Gestalt: Uniform Connectedness** | Type icons use consistent visual language: npm (package box), PyPI (python), Maven (M), Generic (cube). Color is an enhancement, not the sole differentiator. |
| **Hick's Law** | Registry card exposes at most 3 action buttons directly. Less frequent actions (credentials, delete) live in an overflow menu. Default/primary action ("Scan") is always the most prominent button. |
| **Fitts's Law** | "Create Registry" button is top-right, fixed position. Scan button is on each card. Danger actions require modal confirmation — placed on opposite side of the dialog from Cancel. |
| **Doherty Threshold** | Registry list is fetched once on page load and cached client-side. Mutations (create, update, delete, scan) provide immediate toast feedback (<400ms) with optimistic UI where safe. |
| **Forgiveness** | Delete requires a two-step confirmation modal. Credential secrets are never shown — only "hasSecret" indicator — with a clear "replace" flow. |
| **Information Scent** | Registry type icons and badges signal what kind of registry at a glance. "Last scanned" timestamp gives confidence in data freshness. "Enabled/Disabled" badge is prominent on every card. |
| **Progressive Disclosure** | Credentials are collapsed behind a settings section — not shown on the main registry card. Artifact list is on a separate detail view, not inlined. |
| **Accessibility (WCAG POUR)** | Color is never the sole indicator of status (icon + text label paired with every badge). All interactive elements have visible focus rings. Type icons have `aria-label` descriptions. |
| **Tesler's Law** | Auth type selection uses a radio group (not raw JSON editor). The system handles secret masking automatically — the user only chooses auth type + fills fields. |
| **Peak-End Rule** | Scan flow shows an immediate "Scan started" toast, then transitions to a results summary. The final state (success summary with package count) is what users remember. |
| **Goal-Gradient** | The "Scan" button shows the last scanned date, motivating users to keep registries fresh. Progress is visible. |

---

## 2. Registry List View

### Route: `#admin/registries`

```
┌─────────────────────────────────────────────────────────────┐
│ Registries                                    [ + Create ]  │ ← Page header + primary action
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Search registries...]          [All types ▼]              │ ← Filter bar
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ┌──┐ ┌─────────────────────────────────────────────┐ │   │
│  │ │📦│ │ npm Private Registry                        │ │   │ ← Registry card (type icon + name)
│  │ │  │ │ npm           https://npm.mycompany.com     │ │   │    (type badge + URL)
│  │ │  │ │ [Enabled][45 packages]   2h ago              │ │   │    (status + count + last scan)
│  │ │  │ │                                [Scan] [⋮]   │ │   │    (actions)
│  │ └──┘ └─────────────────────────────────────────────┘ │   │
│  │                                                       │   │
│  │ ┌──┐ ┌─────────────────────────────────────────────┐ │   │
│  │ │🐍│ │ Internal PyPI Mirror                        │ │   │
│  │ │  │ │ pypi         https://pypi.internal.com      │ │   │
│  │ │  │ │ [Enabled][12 packages]   5d ago              │ │   │
│  │ │  │ │                           [Scan] [⋮]       │ │   │
│  │ └──┘ └─────────────────────────────────────────────┘ │   │
│  │                                                       │   │
│  │ ┌──┐ ┌─────────────────────────────────────────────┐ │   │
│  │ │📦│ │ Maven Central Mirror                        │ │   │
│  │ │  │ │ maven        https://maven.internal.com     │ │   │
│  │ │  │ │ [Disabled][-- packages]   Never scanned      │ │   │
│  │ │  │ │                           [Scan] [⋮]       │ │   │
│  │ └──┘ └─────────────────────────────────────────────┘ │   │
│  │                                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  Showing 1-3 of 3 registries                                │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Registry Card Spec

| Element | Token / Component | Notes |
|---------|------------------|-------|
| **Card wrapper** | `<Card variant="default" padding="md">` | Full-width card per registry |
| **Type icon** | 40×40px SVG, `rounded-lg`, colored bg per type | See §7 (Icons) |
| **Registry name** | `text-base font-semibold text-text-primary` | Clickable → `#admin/registries/:id` |
| **Type badge** | `<Badge variant="info">` with `text-xs` | Shows type label (npm, PyPI, Maven, Generic) |
| **URL** | `text-sm text-text-secondary truncate` | Single-line truncation |
| **Status** | `<Badge>` — `success` for enabled, `neutral` for disabled | Always visible |
| **Package count** | `text-sm text-text-tertiary` | `{n} packages` or `-- packages` if never scanned |
| **Last scanned** | `text-xs text-text-tertiary` | Relative time, "Never scanned" if none |
| **Scan button** | `<Button variant="secondary" size="sm">` | Prominent action on every card |
| **Overflow menu** | `<DropdownMenu>` trigger: `<Button variant="ghost" size="sm">` icon `MoreHorizontal` | Items: Edit, Credentials, Disable/Enable, Delete |

### Edit/Delete in Overflow Menu

| Menu Item | Action | Icon |
|-----------|--------|------|
| **Edit** | Opens Create/Edit modal (prefilled) | `Pencil` |
| **Credentials** | Opens Credentials modal | `Key` |
| **Disable/Enable** | Toggle registry enabled state | `ToggleLeft` / `ToggleRight` |
| **Delete** | Opens Delete confirmation modal | `Trash2` (danger variant) |

### Overflow Menu Item States

- **Edit** — always available
- **Credentials** — always available, shows `hasSecret` indicator (`text-xs text-text-tertiary`) beside label if credentials set
- **Disable** — shown when `enabled === true`
- **Enable** — shown when `enabled === false`
- **Delete** — danger variant, last item, separated by divider

### Filter Bar

| Element | Component | Notes |
|---------|-----------|-------|
| **Search** | `<Input leftIcon={<Search />}>` with `w-72` placeholder "Search registries..." | Client-side filter by name |
| **Type filter** | `<Select>` with options: All Types, npm, PyPI, Maven, Generic | Client-side filter |
| **Status filter** | `<Select>` with options: All, Enabled, Disabled | Client-side filter |

### Empty State

```
┌────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │           [Package icon]                              │   │
│  │           No registries configured                    │   │
│  │                                                      │   │
│  │           Connect your organization's private         │   │
│  │           package registries to discover artifacts    │   │
│  │           from npm, PyPI, Maven, and more.            │   │
│  │                                                      │   │
│  │           [ + Create your first registry ]            │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

### Loading State

- 3 skeleton cards: `animate-pulse` grey blocks mimicking card layout
- Each skeleton: 40×40 icon block + 2 text lines (h-4 w-3/4 + h-3 w-1/2) + button placeholder (h-8 w-20)

### Error State

```
┌────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [AlertTriangle icon]          [ Dismiss ]            │   │
│  │  Failed to load registries                            │   │
│  │  We couldn't fetch your registry list.                │   │
│  │                                                      │   │
│  │  [ Retry ]                                            │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

Uses `<Alert variant="error">` from the design system.

---

## 3. Create/Edit Registry Modal

```
┌────────────────────────────────────────────────┐
│  Create Registry                         [×]    │ ← Title dynamic: "Create" or "Edit"
├────────────────────────────────────────────────┤
│                                                │
│  Registry name                                 │
│  [ ┌──────────────────────────────────┐ ]      │
│  [ | e.g., "Internal npm Mirror"     | ]      │
│  [ └──────────────────────────────────┘ ]      │
│                                                │
│  Registry type                                 │
│  [ ○ npm  ○ PyPI  ○ Maven  ● Generic  ]      │ ← Radio group, 4 options
│                                                │
│  URL                                           │
│  [ ┌──────────────────────────────────┐ ]      │
│  [ | https://npm.mycompany.com       | ]      │
│  [ └──────────────────────────────────┘ ]      │
│                                                │
│  Description                                   │
│  [ ┌──────────────────────────────────┐ ]      │
│  [ | Private npm packages for         | ]      │
│  [ | our engineering team             | ]      │
│  [ └──────────────────────────────────┘ ]      │
│                                                │
│  Visibility                                    │
│  [ ● Private  ○ Team  ○ Organization  ]       │ ← Radio group, 3 options
│                                                │
│  Enabled                                       │
│  [✓] Enable registry immediately               │ ← Toggle, default on
│                                                │
│  [ Cancel ]                [ Create registry ]  │
│                               (primary btn)     │
└────────────────────────────────────────────────┘
```

### Form Field Specs

| Field | Component | Validation | Notes |
|-------|-----------|------------|-------|
| **Registry name** | `<Input>` | Required, 1-128 chars, trimmed | Auto-focus on open. `placeholder="e.g., Internal npm Mirror"` |
| **Registry type** | New `<RadioGroup>` | Required, defaults to "generic" | 4 options: npm, PyPI, Maven, Generic. Each with type icon. |
| **URL** | `<Input type="url">` | Optional, no format validation | `placeholder="https://npm.mycompany.com"`. `helperText="Required for scanning"` |
| **Description** | `<textarea>` or `<Input>` as multiline | Optional, max 500 chars | `placeholder="Describe what this registry is used for"`. Char counter. |
| **Visibility** | `<RadioGroup>` | Required, defaults to "private" | 3 options: Private (just me/admins), Team (specific teams), Organization (all members). |
| **Enabled** | `<Toggle>` | Optional, defaults to true | `label="Enable registry immediately"`. `description="Disabled registries cannot be scanned."` |

### Edit Mode Differences

- Title changes to "Edit Registry"
- Submit button changes to "Save changes"
- All fields prefilled with current values
- Registry type is **not editable** after creation — shown as a disabled indicator with the type label (changing type would break existing artifact associations)

### Delete Confirmation Modal

```
┌────────────────────────────────────────────────┐
│  Delete registry                         [×]    │
├────────────────────────────────────────────────┤
│                                                │
│  ⚠ Are you sure you want to delete             │
│  "npm Private Registry"?                       │
│                                                │
│  This will permanently remove:                 │
│  • The registry configuration                   │
│  • All stored credentials                       │
│  • All artifact-to-registry associations        │
│  • Scan history                                 │
│                                                │
│  The artifacts themselves will not be deleted. │
│                                                │
│  [ Cancel ]         [ Delete registry ]        │
│                               (danger btn)      │
└────────────────────────────────────────────────┘
```

---

## 4. Registry Detail View

### Route: `#admin/registries/:id`

Accessed by clicking a registry name on the list view. This is a full page view within the Admin shell, not a modal.

```
┌─────────────────────────────────────────────────────────────┐
│ Registries  >  npm Private Registry                         │ ← Breadcrumb: link to list + current name
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Registry Details                           [ Edit ] │   │ ← Section card with Edit button
│  │                                                     │   │
│  │  Type:    npm                    Status: [Enabled]   │   │
│  │  URL:     https://npm.myco.com  Visibility: Private  │   │
│  │  Created: Jul 15, 2026 by admin@example.com          │   │
│  │  Updated: Jul 18, 2026                               │   │
│  │  Description: Private npm packages for engineering   │   │
│  │                                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Authentication                              [ Set ] │   │ ← Credentials section
│  │                                                     │   │
│  │  Auth type:   Token Auth                             │   │
│  │  Credential:  ●●●●●●●●  (set)                        │   │
│  │  Updated:     Jul 18, 2026                           │   │
│  │                                                     │   │
│  │  [ Test connection ]    [ Remove credentials ]       │   │
│  │                                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Scan                                         [⋯]  │   │ ← Scan section
│  │                                                     │   │
│  │  Last scan: Jul 18, 2026 14:32 (150 packages found)  │   │
│  │  Status:    ✅ Completed                             │   │
│  │                                                     │   │
│  │  [ Scan now ]                                        │   │
│  │                                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Artifacts (45)                               [⋯]   │   │ ← Artifacts list
│  │                                                     │   │
│  │  [Search artifacts...]                               │   │
│  │                                                     │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ Artifact Name           │ Type       │ Added   │  │   │
│  │  ├────────────────────────────────────────────────┤  │   │
│  │  │ @scope/package-name     │ npm        │ 2h ago  │  │   │
│  │  │ @scope/another-pkg      │ npm        │ 2h ago  │  │   │
│  │  │ my-python-lib           │ pypi       │ 5d ago  │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                                                     │   │
│  │  Showing 1-10 of 45                     [1] [2] [3]…│   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Sections Detail

#### Registry Details Card

| Element | Component | Notes |
|---------|-----------|-------|
| **Card** | `<Card variant="default" padding="md">` | — |
| **Edit button** | `<Button variant="ghost" size="sm" icon={<Pencil />}>` | Opens edit modal |
| **Type** | `<Badge variant="info">` with type icon | npm icon + "npm" label |
| **Status** | `<Badge>` — `success` (enabled) / `neutral` (disabled) | — |
| **Metadata rows** | `text-sm` with label/value pairs in a 2-column grid | Left-aligned labels, right-aligned values |

#### Authentication Card

| State | What's shown |
|-------|-------------|
| **No credentials set** | "No authentication configured. Auth type: None. [Set credentials]" button |
| **Credentials set** | Auth type label + "●●●●●●●●" masked indicator + "Updated" timestamp |
| **Editing** | Opens Credentials modal (see §5) |

- "Test connection" — POST to backend test endpoint (future), shows success/failure toast
- "Remove credentials" — confirmation modal, then DELETE credentials API call

#### Scan Section

| State | Visual |
|-------|--------|
| **Never scanned** | "Never scanned. [Scan now]" — no status, no timestamp |
| **Scanning** | "Scan in progress..." with `<Spinner>` + animation. Disable "Scan now" button |
| **Completed** | ✅ "Completed — {n} packages found". Show timestamp. [Scan now] enabled |
| **Failed** | ❌ "Scan failed — {error message}". Show timestamp. [Retry] button |

#### Artifacts Section

| Element | Component | Notes |
|---------|-----------|-------|
| **Table** | `<Table>` (proposed in THE-193) | 3 columns: Name, Type, Added |
| **Search** | `<Input leftIcon={<Search />}>` | Client-side filter by artifact name |
| **Pagination** | `<Pagination>` (proposed in THE-193) | Server-side pagination supported |
| **Empty** | Centered empty state: "No artifacts scanned yet. Run a scan to discover packages." | — |
| **Row click** | Navigates to the Discovery Dashboard artifact detail | `#discovery?artifact={id}` |

### Empty State (No Artifacts Scanned)

```
┌────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │           [Package search icon]                       │   │
│  │           No artifacts yet                           │   │
│  │                                                      │   │
│  │           Run a scan to discover packages from        │   │
│  │           this registry.                              │   │
│  │                                                      │   │
│  │           [ Scan this registry ]                     │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

---

## 5. Credentials Management Modal

```
┌────────────────────────────────────────────────┐
│  Registry Credentials                    [×]    │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │  Auth Type                                │  │
│  │                                          │  │
│  │  ○ No Auth                               │  │ ← No credentials needed
│  │     Connect to a public registry          │  │    (helper text)
│  │                                          │  │
│  │  ○ Basic Auth                            │  │ ← Username + password
│  │     Username + password authentication    │  │
│  │                                          │  │
│  │  ● Token Auth                            │  │ ← Bearer token
│  │     Bearer token authentication          │  │    (default selection if none)
│  │                                          │  │
│  │  ○ Environment Variable                  │  │ ← Read from env var at scan time
│  │     Secret read from env at scan time     │  │
│  └──────────────────────────────────────────────────┘
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │  ● Token Auth — Details                   │  │ ← Expando section based on selection
│  │                                          │  │
│  │  Token                                    │  │
│  │  [ ┌────────────────────────────────┐ ]   │  │
│  │  [ | npm-token-abc-def              | ]   │  │ ← If editing existing, placeholder
│  │  [ └────────────────────────────────┘ ]   │  │    "(unchanged)" + note about masking
│  │                                          │  │
│  │  ﾷ Token will be encrypted and stored     │  │
│  │  ﾷ Token will never be displayed again    │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  [ Cancel ]         [ Save credentials ]       │
│                         (primary btn)          │
└────────────────────────────────────────────────┘
```

### Auth Type Conditional Fields

| Auth Type | Fields Shown | Validation |
|-----------|-------------|------------|
| **No Auth** | None | No fields required |
| **Basic Auth** | Username (text), Password (password, masked) | Both required |
| **Token Auth** | Token (password, masked) | Token required |
| **Environment Variable** | Env Var Name (text) | Name required, `helperText="e.g., NPM_REGISTRY_TOKEN"` |

### Edit Mode

- If credentials already exist, show `hasSecret: true` indicator
- Field shows placeholder "(unchanged)" — user must enter a new value to replace
- Tooltip note: "Leave blank to keep existing credential. Enter a new value to replace."
- "Remove credentials" link button at bottom of form

### Remove Credentials Confirmation

```
┌────────────────────────────────────────────────┐
│  Remove credentials                      [×]    │
├────────────────────────────────────────────────┤
│                                                │
│  ⚠ Are you sure you want to remove             │
│  the stored credentials for                     │
│  "npm Private Registry"?                        │
│                                                │
│  The registry will still be accessible          │
│  but scans requiring authentication will fail. │
│                                                │
│  [ Cancel ]    [ Remove credentials ]          │
│                                (danger btn)     │
└────────────────────────────────────────────────┘
```

### Credential States on Detail View

| State | Badge/Indicator | Actions Available |
|-------|----------------|-------------------|
| **None** | `No Auth` | Set credentials |
| **Basic** | `Basic Auth` + "●●●●●●●●" | Replace, Remove |
| **Token** | `Token Auth` + "●●●●●●●●" | Replace, Remove |
| **Env Var** | `Env Var` + env name | Replace, Remove |

---

## 6. Scan Flow & States

### Trigger Scan

1. User clicks "Scan" on registry card or "Scan now" on detail view
2. Button shows loading state: `<Button variant="secondary" loading>Scanning...</Button>`
3. `POST /api/registries/:id/scan` called
4. On success (202): show success toast `<Alert variant="success">` — "Scan completed. 150 packages found."
5. On error: show error toast `<Alert variant="error">` — "Scan failed: {error}"

### Scan Result Toast

```
┌─────────────────────────────────────────────────────┐
│ ✅ Scan completed                              [×]  │
│                                                     │
│  npm Private Registry — 150 packages found          │
│  Scan took 1.2s                                     │
│                                                     │
│  [ View artifacts ]                                 │
└─────────────────────────────────────────────────────┘
```

### Scan in Progress on Card

When a scan is running:
- Card shows a subtle progress pulse: `border-l-2 border-l-primary-500 animate-pulse`
- Scan button shows `<Button variant="secondary" loading disabled>Scanning...</Button>`
- Package count shows "Scanning..."

### Scan Error on Card

- Error badge replaces package count: `<Badge variant="error">Scan failed</Badge>`
- "Last scanned" shows error timestamp
- Hover tooltip with error message

---

## 7. Type Icons & Badges

### Registry Type Icons

| Type | Icon | Color | Background |
|------|------|-------|------------|
| **npm** | Package box (📦 equivalent SVG) | `text-error-500` | `bg-error-50 dark:bg-error-950` |
| **PyPI** | Python snake (🐍 equivalent SVG) | `text-info-500` | `bg-info-50 dark:bg-info-950` |
| **Maven** | M letter (M equivalent SVG) | `text-warning-500` | `bg-warning-50 dark:bg-warning-950` |
| **Generic** | Cube/box (📦 outline SVG) | `text-neutral-500` | `bg-neutral-50 dark:bg-neutral-950` |

All SVG icons are inline, 24×24px, with `aria-hidden="true"` and `aria-label` on the parent container.

### Status Badges

| State | Badge Variant |
|-------|---------------|
| **Enabled** | `success` — "Enabled" |
| **Disabled** | `neutral` — "Disabled" |
| **Scanning** | `info` with spinner — "Scanning..." |
| **Scan OK** | `success` — "Completed" |
| **Scan Error** | `error` — "Failed" |
| **Never Scanned** | `neutral` — "Not scanned" |

### Card Overflow Menu Items

| Label | Variant | Icon | Action |
|-------|---------|------|--------|
| Edit | default | `Pencil` | Opens edit modal |
| Credentials | default | `Key` | Opens credentials modal |
| Disable | default | `ToggleLeft` | PUT `{enabled: false}` |
| Enable | default | `ToggleRight` | PUT `{enabled: true}` |
| Delete | danger | `Trash2` | Opens delete confirmation |
| View Details | default | `Eye` | Navigate to `#admin/registries/:id` |

---

## 8. Component Mapping

| Wireframe Element | Design System Component | Token/Variant |
|-------------------|------------------------|---------------|
| **Registry card** | `<Card variant="default" padding="md">` | Full-width, vertically stacked |
| **Type icon** | Inline SVG in `h-10 w-10 rounded-lg` | Colored per type scheme |
| **Type badge** | `<Badge variant="info">` | — |
| **Status badge** | `<Badge variant="success">` / `neutral` | — |
| **Page title** | `<h1>` | `text-2xl font-bold text-text-primary` |
| **Section header** | `<h2>` | `text-lg font-semibold text-text-primary` |
| **Search** | `<Input leftIcon={<Search />}>` | `w-72` |
| **Filter select** | `<Select>` (proposed in THE-193) | — |
| **Scan button** | `<Button variant="secondary" size="sm">` | — |
| **Overflow trigger** | `<Button variant="ghost" size="sm">` | Icon: `MoreHorizontal` |
| **Overflow menu** | `<DropdownMenu>` (proposed in THE-193) | — |
| **Create/edit modal** | `<Modal size="md">` (proposed in THE-193) | — |
| **Form inputs** | `<Input>` | Standard variants |
| **Radio group** | New `<RadioGroup>` component — see §9 | — |
| **Toggle** | `<Toggle>` (proposed in THE-193) | — |
| **Delete confirm modal** | `<Modal size="sm">` + danger button | — |
| **Artifact table** | `<Table>` (proposed in THE-193) | 3 columns, no sorting |
| **Pagination** | `<Pagination>` (proposed in THE-193) | — |
| **Toast/Alerts** | `<Alert>` | success, error, warning |
| **Breadcrumb** | Custom inline: `text-sm text-text-secondary` links | `span` separators: `>` |
| **Empty state** | `<Card padding="lg">` centered | `text-center py-16` |
| **Loading skeleton** | `animate-pulse` grey blocks | 3x skeleton row pattern |
| **Error state** | `<Alert variant="error">` inside card | With retry button |

---

## 9. New Component Proposals

### RadioGroup Component

```typescript
interface RadioOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface RadioGroupProps<T extends string> {
  name: string;
  options: RadioOption<T>[];
  value?: T;
  onChange: (value: T) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
}
```

**Styling:**
- Vertical layout (`flex flex-col gap-2`)
- Each option: `flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary-300 cursor-pointer transition-colors`
- Selected: `border-primary-500 bg-primary-50/50 dark:bg-primary-950/50`
- Radio circle: `h-5 w-5 rounded-full border-2 border-border flex-shrink-0 mt-0.5` — filled with `bg-primary-500` when selected
- Label: `text-sm font-medium text-text-primary`
- Description: `text-xs text-text-tertiary`
- Focus: `focus-within:ring-2 focus-within:ring-primary-500`

**Reuse:**
- Registry type selector (this spec)
- Visibility selector (this spec)
- Auth type selector (this spec)
- Permission levels in role editor
- Any single-select from a short list (≤6 items)

---

## 10. Interaction & Flow States

### Create Registry Flow

1. User clicks "Create Registry" on list view
2. Modal opens. Name field auto-focused.
3. User fills form. Inline validation on blur.
4. Submit: `POST /api/organizations/:orgId/registries`
5. On success (201):
   - Modal closes
   - Toast: "Registry created successfully"
   - Registry appears at top of list (optimistic insert)
6. On error (400/404):
   - Server error displayed as `<Alert variant="error">` inside modal
   - Form remains open, fields preserved

### Edit Registry Flow

1. User clicks "Edit" in overflow menu
2. Modal opens with all fields prefilled. Name field auto-focused.
3. User modifies fields. Registry type is read-only (displayed but disabled).
4. Submit: `PUT /api/registries/:id`
5. On success (200):
   - Modal closes
   - Toast: "Registry updated"
   - Card updates in place

### Delete Registry Flow

1. User clicks "Delete" in overflow menu
2. Delete confirmation modal opens
3. User confirms: `DELETE /api/registries/:id`
4. On success (200):
   - Modal closes
   - Toast: "Registry deleted"
   - Card removed from list with animation
5. On error: error displayed inside modal

### Credential Flow

1. User clicks "Credentials" in overflow menu (or "Set" on detail view)
2. Credentials modal opens
3. If existing credentials: show auth type pre-selected, fields show "(unchanged)" placeholder
4. User selects auth type → conditional fields appear
5. Submit: `PUT /api/registries/:id/credentials`
6. On success (200):
   - Modal closes
   - Toast: "Credentials saved"
   - Detail view updates to show auth type + "●●●●●●●●" indicator

### Scan Flow

1. User clicks "Scan now" on card or detail view
2. Button enters loading state (spinner + "Scanning...")
3. `POST /api/registries/:id/scan`
4. On success (202):
   - Button returns to normal state
   - Toast shows scan results
   - Card/detail view updates with scan results (package count, timestamp)
   - If on detail view: artifact table refreshes
5. On error (400/500):
   - Button returns to normal state
   - Error toast appears
   - Card shows error state

---

## 11. Accessibility Checklist

| Criterion | Implementation |
|-----------|---------------|
| **Registry type icons** | `aria-hidden="true"` on icon SVGs, parent has descriptive text |
| **Status badges** | Color is never sole indicator — always paired with text label |
| **Dropdown menus** | `role="menu"`, `aria-expanded` on trigger, `role="menuitem"` on items |
| **Modal dialogs** | Focus trap, `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| **Radio groups** | `role="radiogroup"`, `role="radio"`, `aria-checked` on each option |
| **Form validation** | `aria-invalid`, `aria-describedby` linking to error messages, `role="alert"` |
| **Keyboard nav** | Tab through form fields, Enter activates buttons/menu items, Escape closes modals/menus |
| **Focus management** | First field focused on modal open. Trigger button focused on modal close. |
| **Scan loading** | `aria-live="polite"` region for scan status updates |
| **Contrast** | All text meets WCAG AA. Tokens from existing palette. |
| **Reduced motion** | `prefers-reduced-motion` — instant transitions, no scan animation pulse |
| **Touch targets** | All interactive elements ≥44×44px on mobile |
| **Breadcrumb** | `<nav aria-label="Breadcrumb">` with `aria-current="page"` on current item |

---

## 12. Responsive Behavior

| Viewport | Layout Adaptation |
|----------|-------------------|
| **≥1024px** | Registry list shows full cards side-by-side in 2-column grid. Detail view: 3-column layout (details, auth, scan stacked vertically, artifacts full width). |
| **768-1023px** | Registry list: single column cards. Detail view: single column, sections stack. Modals: `max-w-lg` centered. |
| **<768px** | Registry list: single column. Cards are full-bleed. Modals become full-screen (`m-0 rounded-none`). Overflow menu becomes bottom sheet. Detail sections are collapsible accordion. |

### Mobile Card Behavior

- Registry type icon and name stack vertically at narrow widths
- "Scan" button moves below metadata (not inline with overflow menu)
- Package count and last scanned show on separate line
- Overflow menu trigger stays top-right of card

---

## 13. Icons Required

| Icon | Usage | Previously Required? |
|------|-------|---------------------|
| `Package` | Registries nav icon | NEW |
| `Search` | Search input | Yes (THE-193) |
| `MoreHorizontal` | Overflow menu trigger | Yes (THE-193) |
| `Pencil` | Edit action | NEW |
| `Key` | Credentials action | NEW |
| `ToggleLeft` | Disable action | NEW |
| `ToggleRight` | Enable action | NEW |
| `Trash2` | Delete action | Yes (THE-193) |
| `Eye` | View details | Yes (THE-193) |
| `Plus` | Create button | Yes (THE-193) |
| `X` | Modal close | Yes (THE-193) |
| `Check` | Save confirmation | Yes (THE-193) |
| `AlertTriangle` | Warning dialogs, errors | Yes (THE-193) |
| `Loader2` | Loading spinner | Yes (THE-193) |
| `ArrowUpDown` | Table sort | Yes (THE-193) |
| `ChevronLeft` / `ChevronRight` | Pagination | Yes (THE-193) |

### New Registry-Specific Icons

| Icon | Description | Usage |
|------|-------------|-------|
| `Package` | Box with front flap | Nav icon, type icon (generic fallback) |
| `NpmIcon` | npm logo/box | npm type icon |
| `PyPIIcon` | Python logo | PyPI type icon |
| `MavenIcon` | M letter cube | Maven type icon |

Recommendation: Use simple SVG primitives rather than importing branded logos to avoid trademark concerns and keep bundle size small. For npm, use a package box with a red accent. For PyPI, use a blue snake/ribbon shape. For Maven, use an orange M in a box. For Generic, use a neutral gray cube.

---

## 14. Acceptance Criteria for FrontendArchitect

### Registry List View
- [ ] Card-based layout showing all registries for current org
- [ ] Each card: type icon, name, type badge, URL, status badge, package count, last scanned
- [ ] Search/filter by name, type, status (client-side)
- [ ] "Create Registry" button opens create modal
- [ ] Scan button triggers scan with loading state
- [ ] Overflow menu with Edit, Credentials, Disable/Enable, Delete
- [ ] Empty state, loading skeleton, error state

### Create/Edit Registry Modal
- [ ] Form: name (required), type (radio, defaults to generic), URL, description, visibility radio, enabled toggle
- [ ] Inline validation on blur
- [ ] Type field disabled on edit
- [ ] Submit calls POST/PUT API, optimistic UI update
- [ ] Server error displayed as Alert inside modal

### Delete Confirmation
- [ ] Modal with warning text listing what will be removed
- [ ] Note that artifacts themselves are preserved
- [ ] Danger button to confirm, Cancel to dismiss
- [ ] Success toast, card removed from list

### Registry Detail View
- [ ] Breadcrumb navigation: "Registries > {name}"
- [ ] Details card: type, status, URL, visibility, created/updated, description
- [ ] Credentials card: auth type, masked indicator, set/replace/remove actions
- [ ] Scan card: last scan timestamp, status, package count, scan now button
- [ ] Artifacts table: Name, Type, Added columns with search and pagination
- [ ] All states: loading, empty, error for each section

### Credentials Modal
- [ ] Radio group: No Auth, Basic Auth, Token Auth, Environment Variable
- [ ] Conditional fields based on auth type selection
- [ ] Edit mode shows "(unchanged)" placeholder, requires new value to replace
- [ ] Submit calls PUT API, success updates detail view
- [ ] Remove credentials confirmation flow

### Scan Flow
- [ ] Loading state on scan button (spinner, disabled)
- [ ] Success/error toast on completion
- [ ] Card updates with new package count and timestamp
- [ ] Detail view artifact table refreshes after scan
- [ ] Error state on card if scan fails

### Design System Compliance
- [ ] All tokens from `theme.css` — no hardcoded values
- [ ] Existing components: Card, Button, Input, Badge, Alert
- [ ] Proposed components: Modal, DropdownMenu, Table, Pagination, Select, Toggle (from THE-193)
- [ ] New proposal: RadioGroup (see §9)
- [ ] Dark mode works via existing token system

### Accessibility
- [ ] Type icons: `aria-hidden="true"` with descriptive parent text
- [ ] Modals: focus trap, `role="dialog"`, `aria-labelledby`, Escape to close
- [ ] Dropdown menus: keyboard nav, `aria-expanded`, `role="menu"`
- [ ] Radio groups: `role="radiogroup"`, `aria-checked` on options
- [ ] Forms: `aria-invalid`, `aria-describedby`, `role="alert"` for errors
- [ ] Status: color-independence (icon + text paired with every badge)
- [ ] Touch targets ≥44px on mobile

### Responsive
- [ ] Registry list: 2 columns desktop, single column mobile
- [ ] Modals full-screen on mobile
- [ ] Overflow menu becomes bottom sheet on mobile
- [ ] Detail sections stack vertically on mobile

---

## 15. System-Level Proposals

### New Components Summary

| Component | Priority | Dependencies | Reuse Potential |
|-----------|----------|-------------|-----------------|
| `<RadioGroup>` | Medium | None | Registry type, visibility, auth type, permission levels |

### Token Additions Required

None. All colors, spacing, type, radii, and shadows map to existing tokens.

---

## 16. API Integration Summary

For FrontendArchitect reference, here are all API endpoints consumed by this UI:

| View | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| List | GET | `/api/organizations/:orgId/registries` | Fetch all registries |
| Create | POST | `/api/organizations/:orgId/registries` | Create new registry |
| Detail | GET | `/api/registries/:id` | Get single registry |
| Update | PUT | `/api/registries/:id` | Update registry fields |
| Delete | DELETE | `/api/registries/:id` | Delete registry |
| List Artifacts | GET | `/api/registries/:id/artifacts` | Get registry artifacts |
| Add Artifact | POST | `/api/registries/:id/artifacts` | Link artifact to registry |
| Remove Artifact | DELETE | `/api/registries/:id/artifacts/:artifactId` | Unlink artifact |
| Get Credentials | GET | `/api/registries/:id/credentials` | Get creds (secret masked) |
| Upsert Credentials | PUT | `/api/registries/:id/credentials` | Set/replace creds |
| Delete Credentials | DELETE | `/api/registries/:id/credentials` | Remove creds |
| Scan | POST | `/api/registries/:id/scan` | Trigger scan |

Full API spec in `docs/api-handoff/private-artifact-registries.md`.

---

## 17. UX Quality Checklist (Self-Review)

| Criterion | Status |
|-----------|--------|
| **Visual hierarchy** — Primary action (Scan) is prominent. Secondary (Edit, Credentials) in overflow. Danger (Delete) visually separated. | ✅ |
| **Spacing** — Scale used: `gap-2`, `gap-3`, `gap-4`, `p-3`, `p-6`, `p-8` from spacing tokens. | ✅ |
| **Alignment** — Cards share consistent left/right padding. Form fields align to grid. | ✅ |
| **Type system** — `text-sm`, `text-base`, `text-lg`, `text-2xl` from typography scale. Two weights (medium, semibold, bold). | ✅ |
| **Empty states** — Every view with dynamic content has an empty state. | ✅ |
| **Loading states** — Skeleton cards for list, spinner for buttons. | ✅ |
| **Error states** — Every API call has error handling with retry. | ✅ |
| **Edge cases** — Never-scanned state, disabled registry, missing credentials, 0-artifact scan. | ✅ |
| **Dark mode** — All tokens invert via `theme.css`. No hardcoded colors. | ✅ |
| **Accessibility** — Color-independence, keyboard nav, ARIA, focus management. | ✅ |
| **No dark patterns** — Credential secrets never exposed. Delete is confirm-then-act. Scan is user-initiated. | ✅ |
| **Data minimization** — Only required fields collected. Credential secrets encrypted server-side, never returned. | ✅ |

---

*Document created by UXDesigner (THE-210). Ready for FrontendArchitect handoff. See companion issue THE-211 for implementation.*
