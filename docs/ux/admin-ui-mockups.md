# Admin UI Mockups — THE-193

**Owner:** UXDesigner
**Parent:** THE-189 (Sprint 9: Enterprise Phase 2 — Auth + RBAC)
**Depends on:** Backend Auth API (THE-191), Frontend Auth Implementation (THE-192)
**Feeds:** FrontendArchitect (THE-192), Sprint 10 Admin UI

---

## 1. Design Principles Applied

| Lens | Decision |
|------|----------|
| **Cognitive Load** | Sidebar navigation reduces working memory — current section is always visible. Max 6 top-level nav items (within Miller's Law). |
| **Fitts's Law** | Primary actions are top-right (invite member, create role). Danger actions require confirmation in a modal — forgiveness pattern. |
| **Gestalt: Proximity** | Related controls grouped under section headings. Table row actions stay within the row. |
| **Gestalt: Common Region** | Each admin section is a card with a clear header region. Tables have sticky headers. |
| **Hick's Law** | Row action menus use dropdowns (not visible action bars) to avoid choice overload. Default/primary action is always a button. |
| **Doherty Threshold** | Table sorting, search, and pagination are client-side for instant feedback (<400ms). Server calls only for mutations. |
| **Tesler's Law** | Permission management uses toggle switches, not raw ACL editors. Complexity pushed to the system (role templates). |
| **Jakob's Law** | Admin layout follows SaaS conventions: sidebar + top bar + content zone. Users don't need to learn a new mental model. |
| **F-pattern scanning** | Tables are optimized for F-pattern: name/email in first column, status in second, actions last. Key info left-aligned. |
| **Forgiveness** | Destructive actions (remove member, delete role) require modal confirmation. "Undo" option provided within 5s on delete where possible. |
| **Accessibility (WCAG POUR)** | All interactive elements have visible focus rings. Toggle switches have visible labels. Tables have proper scope/headers. |

---

## 2. Admin Layout — Shell

All admin pages share a consistent sidebar + top bar layout, distinct from the main app shell.

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]  Nexus Engineering          [Search]  [Avatar ▼]    │ ← Top bar (h-16)
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│  ○ Admin │  ┌────────────────────────────────────────────┐  │
│    Home  │  │  Page Header                         [Btn] │  │ ← Breadcrumb + page title + primary action
│          │  ├────────────────────────────────────────────┤  │
│  ○ Teams │  │                                            │  │
│  ○ Membe │  │        Content Area                        │  │
│  ○ Roles │  │                                            │  │
│  ○ Audit │  │        (varies by page)                    │  │
│          │  │                                            │  │
│          │  └────────────────────────────────────────────┘  │
│          │                                                  │
├──────────┴──────────────────────────────────────────────────┤
│                     © 2026 Nexus Engineering                │ ← Minimal footer
└─────────────────────────────────────────────────────────────┘
```

### Layout Specs

| Element | Component / Token | Notes |
|---------|------------------|-------|
| **Page bg** | `bg-surface-secondary` | Same as main app |
| **Sidebar** | `w-56 md:w-64 bg-surface-primary border-r border-border` | Fixed on desktop, overlay on mobile |
| **Top bar** | `h-16 bg-surface-primary border-b border-border flex items-center justify-between px-4 md:px-6` | Contains logo, user menu |
| **Content** | `flex-1 overflow-y-auto p-4 md:p-6 lg:p-8` | Scrollable content area |
| **Sidebar nav** | `<Nav variant="vertical">` from design system | Uses existing component |
| **User avatar** | New `<Avatar>` component (proposed) | Fallback to initials |
| **Search** | `<Input leftIcon={<Search />}>` with `w-64` | Client-side table filtering |

### Sidebar Nav Items

```
Admin Home     →  #admin              icon: LayoutDashboard
Teams          →  #admin/teams        icon: Building2
Members        →  #admin/members      icon: Users
Roles          →  #admin/roles        icon: Shield
Audit Log      →  #admin/audit        icon: ScrollText
```

### Mobile Responsive Behavior

| Viewport | Sidebar | Top bar |
|----------|---------|---------|
| **≥1024px** | Visible, pinned (`w-64`) | Full top bar with search |
| **768-1023px** | Collapsible hamburger toggle | Condensed top bar |
| **<768px** | Overlay drawer from left | Icons only, no text labels |

---

## 3. Admin Home / Dashboard

### Route: `#admin`

```
┌────────────────────────────────────────────────────────────┐
│ Admin Home                                    [Last 7 days]│ ← page title + time range filter
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Total    │  │ Active   │  │ Invited  │  │ New (7d) │  │ ← Stat cards in a Grid cols=4
│  │ Members  │  │ Today    │  │ Pending  │  │          │  │
│  │   24     │  │    12    │  │     3    │  │    5     │  │
│  │   ↑ 2    │  │   ↑ 8    │  │   —      │  │   ↑ 5    │  │ ← trend micro-text
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Recent Activity                              [→] │   │ ← Card header with "View All" link
│  │────────────────────────────────────────────────────│   │
│  │  John Doe    joined the team           2 min ago   │   │
│  │  Jane Smith  updated role "Developer"  15 min ago  │   │
│  │  Admin       removed user "bob@..."    1 hour ago  │   │
│  │  Sarah Lee   changed org name          2 hours ago │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Team Overview                               [→] │   │
│  │────────────────────────────────────────────────────│   │
│  │  Engineering          ████████░░░░  12 members    │   │ ← Team name + progress bar + count
│  │  Design               ████░░░░░░░░   5 members    │   │
│  │  Product              ████░░░░░░░░   4 members    │   │
│  │  Operations           ██░░░░░░░░░░   3 members    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Widget Specs

| Widget | Component | Data |
|--------|-----------|------|
| **Stat cards** | `<Card variant="elevated" padding="md">` with icon + number + trend | Aggregate counts from backend |
| **Recent activity** | `<Card>` with scrollable list of `<ActivityRow>` items | Last 20 audit events |
| **Team overview** | `<Card>` with team list + progress bars | Per-team member counts |

### Empty State

When no data exists yet (fresh install):
```
┌────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │            [Shield icon]                              │  │
│  │            No admin data yet                          │  │
│  │            Invite your first team member to           │  │
│  │            get started.                               │  │
│  │                                                      │  │
│  │            [ Invite team member ]                     │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## 4. Members Management

### Route: `#admin/members`

```
┌────────────────────────────────────────────────────────────┐
│ Members                                   [ + Invite ]     │ ← header + primary action
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Search]                                        │   │   │ ← Input with search icon
│  │ [All roles ▼] [All teams ▼]                     │   │   │ ← Filter dropdowns
│  ├─────────────────────────────────────────────────────┤   │
│  │ Name        │ Email            │ Role      │ Status │   │ ← Table header (sticky)
│  ├─────────────────────────────────────────────────────┤   │
│  │ [A] John D  │ john@example.com │ Admin     │ Active │   │ ← Row with avatar, name, email
│  │ [J] Jane Sm │ jane@example.com │ Developer │ Active │   │
│  │ [B] Bob Wil │ bob@example.com  │ Developer │ ░ Inv  │   │ ← Pending invite status
│  │ [S] Sarah L │ sarah@exampl.com │ Viewer    │ Active │   │
│  │ ...                                                  │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ Showing 1-10 of 24                        [1] [2] [3]│   │ ← Pagination controls
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Table Column Specs

| Column | Width | Component | Sortable | Notes |
|--------|-------|-----------|----------|-------|
| Name | `flex-1` (min-w-40) | `<Avatar size="sm">` + name text | Yes | Name + email stacked vertically |
| Email | `w-48` | `text-sm text-text-secondary` | Yes | Truncated with ellipsis |
| Role | `w-32` | `<Badge variant="role">` | Yes | Badge color matches role |
| Status | `w-24` | `<Badge variant="status">` | No | Active / Invited / Disabled |
| Actions | `w-16` | `<DropdownMenu>` | No | Edit, Resend Invite, Remove |

### Row States

| State | Visual |
|-------|--------|
| **Active** | Green dot + "Active" badge |
| **Invited** | Yellow dot + "Invited" badge + "Resend invite" action |
| **Disabled** | Gray dot + "Disabled" badge, row opacity reduced |

### Invite Member Dialog (Modal)

```
┌──────────────────────────────────────────────┐
│  Invite Team Member                    [×]   │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Email address                          │  │
│  │ [ colleague@company.com    ]           │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Role                                    │  │
│  │ [ Select role         ▼ ]               │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  Optional: Send welcome email               │
│  [✓] Send invite email                      │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │           Send invite                  │  │  ← Button variant="primary", fullWidth
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

### Remove Member Confirmation

```
┌──────────────────────────────────────────────┐
│  Remove member                        [×]    │
├──────────────────────────────────────────────┤
│                                              │
│  ⚠ Are you sure you want to remove          │
│  John Doe (john@example.com)?               │
│                                              │
│  This action cannot be undone.               │
│  Their access will be revoked immediately.   │
│                                              │
│  □ Also revoke active sessions               │
│                                              │
│  [ Cancel ]    [ Remove member ]             │
│                              (danger)        │
└──────────────────────────────────────────────┘
```

---

## 5. Roles & Permissions

### Route: `#admin/roles`

```
┌────────────────────────────────────────────────────────────┐
│ Roles & Permissions                     [ + Create Role ]  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌────────────┬───────────────────────────────────────┐    │
│  │ Roles      │  Permission Editor                     │    │ ← Two-column layout
│  │            │                                        │    │
│  │ ○ Admin    │  Permissions for "Developer"           │    │
│  │ ○ Developer│  ┌─────────────────────────────────┐   │    │
│  │ ● Viewer   │  │ Projects                        │   │    │ ← Permission category
│  │            │  │ [✓] View projects                │   │    │
│  │            │  │ [ ] Create projects               │   │    │ ← Toggle/Switch
│  │            │  │ [ ] Edit projects                 │   │    │
│  │            │  │ [ ] Delete projects               │   │    │
│  │            │  ├─────────────────────────────────┤   │    │
│  │            │  │ Team Management                  │   │    │
│  │            │  │ [✓] View members                 │   │    │
│  │            │  │ [ ] Invite members               │   │    │
│  │            │  │ [ ] Remove members               │   │    │
│  │            │  ├─────────────────────────────────┤   │    │
│  │            │  │ Administration                   │   │    │
│  │            │  │ [ ] Manage roles                 │   │    │
│  │            │  │ [ ] View audit log               │   │    │
│  │            │  └─────────────────────────────────┘   │    │
│  │            │                                        │    │
│  │            │  [ Save changes ]  [ Reset to default ]│    │
│  └────────────┴────────────────────────────────────────┘    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Layout Specs

| Zone | Component | Notes |
|------|-----------|-------|
| **Roles list** | Left panel, `w-56`, scrollable list of role cards | Currently selected role highlighted |
| **Role cards** | `<Card variant="outlined" padding="sm">` | Shows role name + member count |
| **Permission groups** | `<Card variant="default">` per category | Category heading + list of toggles |
| **Permission toggle** | New `<Toggle>` component (proposed) | Switch with visible on/off label |
| **Save button** | `<Button variant="primary">` | Enabled only when dirty |
| **Reset button** | `<Button variant="ghost">` | Reverts to saved state |

### Permissions Matrix (System-Defined)

| Resource | View | Create | Edit | Delete |
|----------|------|--------|------|--------|
| Projects | Admin, Developer, Viewer | Admin, Developer | Admin, Developer | Admin |
| Members | Admin, Developer, Viewer | Admin | Admin | Admin |
| Roles | Admin | Admin | Admin | Admin |
| Audit Log | Admin | — | — | — |
| Org Settings | Admin | — | Admin | — |

### Default Roles

| Role | Description | Default Permissions |
|------|-------------|-------------------|
| **Admin** | Full system access | All permissions |
| **Developer** | Day-to-day contributor | View + Create + Edit on Projects and Members |
| **Viewer** | Read-only access | View Projects, View Members |

### Create Role Dialog

```
┌──────────────────────────────────────────────┐
│  Create Role                          [×]    │
├──────────────────────────────────────────────┤
│                                              │
│  Role name                                   │
│  [ ┌──────────────────────────────────┐ ]    │
│  [ | e.g., "Analyst"                 | ]    │
│  [ └──────────────────────────────────┘ ]    │
│                                              │
│  Description                                 │
│  [ ┌──────────────────────────────────┐ ]    │
│  [ | Limited access for reporting     | ]    │
│  [ └──────────────────────────────────┘ ]    │
│                                              │
│  [ Cancel ]    [ Create role ]              │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 6. Organization Settings

### Route: `#admin/settings`

```
┌────────────────────────────────────────────────────────────┐
│ Organization Settings                                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Organization Profile                                │   │ ← Section header
│  │                                                     │   │
│  │  Organization name                                   │   │
│  │  [ Nexus Engineering                    ]           │   │
│  │                                                     │   │
│  │  Slug                                                │   │
│  │  [ nexus-engineering                    ]           │   │
│  │                                                     │   │
│  │  [ Save changes ]                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Security Settings                                   │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ [✓] Require email verification              │    │   │ ← Toggle
│  │  │     New members must verify their email      │    │   │   ← helper text
│  │  └─────────────────────────────────────────────┘    │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ [✓] Enforce two-factor authentication       │    │   │
│  │  │     All members must set up 2FA              │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │                                                     │   │
│  │  Session timeout (minutes)                          │   │
│  │  [ 60 ]                                             │   │
│  │                                                     │   │
│  │  [ Save changes ]                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Danger Zone                                         │   │ ← Red-tinted section
│  │                                                     │   │
│  │  Delete organization                                 │   │
│  │  Permanently delete your organization and all        │   │
│  │  associated data. This action cannot be undone.      │   │
│  │                                                     │   │
│  │  [ Delete organization ] ← Button variant="danger"  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Danger Zone Confirmation

```
┌──────────────────────────────────────────────┐
│  Delete Organization                   [×]    │
├──────────────────────────────────────────────┤
│                                              │
│  ⚠ This action cannot be undone.             │
│                                              │
│  This will permanently delete:               │
│  • All member accounts                       │
│  • All projects and data                     │
│  • All audit logs                            │
│                                              │
│  Type "DELETE" to confirm:                    │
│  [                          ]                │
│                                              │
│  [ Cancel ]    [ Delete organization ]       │
│                              (danger)        │
└──────────────────────────────────────────────┘
```

---

## 7. Audit Log

### Route: `#admin/audit`

```
┌────────────────────────────────────────────────────────────┐
│ Audit Log                      [Export CSV]  [Date Range]  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  [Search events...]  [All actions ▼]  [All members ▼]     │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Timestamp    │ Actor       │ Action   │ Target    │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 2026-07-18   │ John Doe    │ invite   │ jane@...  │   │
│  │ 14:32:01     │ (Admin)     │ member   │           │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 2026-07-18   │ Jane Smith  │ update   │ Developer │   │
│  │ 13:15:00     │ (Developer) │ role     │           │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 2026-07-18   │ System      │ session  │ jane@...  │   │
│  │ 12:00:00     │             │ login    │           │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 2026-07-17   │ Admin       │ remove   │ bob@...   │   │
│  │ 09:45:00     │             │ member   │           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
│  Showing 1-20 of 342 events                  [1] [2] [3]…  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Audit Event Detail (Click to expand or Modal)

```
┌──────────────────────────────────────────────┐
│  Event Details                         [×]    │
├──────────────────────────────────────────────┤
│                                              │
│  Event ID:   aud_7f8a3c2b1d                 │
│  Timestamp:  2026-07-18 14:32:01 UTC         │
│  Actor:      John Doe (j@example.com)        │
│  Action:     member.invite                   │
│  Target:     jane.smith@example.com          │
│  IP:         203.0.113.42                    │
│  User-Agent: Mozilla/5.0 ...                │
│  Changes:                                    │
│    role: "Viewer" → "Developer"              │
│                                              │
│  [ Close ]                                   │
└──────────────────────────────────────────────┘
```

### Action Type Badge Colors

| Action Type | Badge Variant |
|-------------|---------------|
| `member.invite` | `info` |
| `member.join` | `success` |
| `member.remove` | `error` |
| `member.role_change` | `warning` |
| `settings.update` | `neutral` |
| `session.login` | `success` (faint) |
| `session.logout` | `neutral` (faint) |
| `role.create` | `success` |
| `role.update` | `warning` |
| `role.delete` | `error` |

---

## 8. Component Mapping

| Wireframe Element | Design System Component | Token/Variant |
|-------------------|------------------------|---------------|
| Top bar | Custom shell div | `h-16 bg-surface-primary border-b border-border` |
| Sidebar | `<Nav variant="vertical">` | `w-64` |
| Stat card | `<Card variant="elevated" padding="md">` | `shadow-md` |
| Page title | `<h1>` | `text-2xl font-bold text-text-primary` |
| Section header | `<h2>` | `text-lg font-semibold text-text-primary` |
| Table | New `<Table>` component (proposed) | See §9 |
| Table row action | New `<DropdownMenu>` (proposed) | See §9 |
| Toggle/Switch | New `<Toggle>` (proposed) | See §9 |
| Badge (role) | `<Badge variant="custom">` | Extend with role-specific colors |
| Avatar | New `<Avatar>` (proposed) | See §9 |
| Modal/Dialog | New `<Modal>` (proposed) | See §9 |
| Form fields | `<Input>` | Standard variants |
| Primary CTA | `<Button variant="primary">` | — |
| Danger action | `<Button variant="danger">` | — |
| Secondary | `<Button variant="secondary">` | — |
| Ghost | `<Button variant="ghost">` | — |
| Pagination | New `<Pagination>` (proposed) | See §9 |
| Empty state | `<Card padding="lg">` with centered content `text-center py-16` | — |
| Alert banner | `<Alert>` component (from auth proposal, §14) | — |
| Search input | `<Input leftIcon={<Search />}>` | — |
| Filter dropdown | Custom `<select>` or new `<Select>` (proposed) | See §9 |

---

## 9. New Component Proposals

### Table Component (High Priority)

```typescript
interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  sortable?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  loading?: boolean;
  emptyState?: React.ReactNode;
  stickyHeader?: boolean;
}
```

**Styling:**
- Header: `bg-surface-tertiary text-xs font-medium text-text-tertiary uppercase tracking-wide`
- Row: `h-14 border-b border-border hover:bg-surface-tertiary/50 transition-colors`
- Cell padding: `px-4 py-3 text-sm text-text-primary`
- Sort indicator: arrow icon in header
- Sticky header: `sticky top-0 z-10`
- Loading: skeleton rows (3 shimmer lines)
- Empty: `<EmptyState>` slot centered

### Modal Component (High Priority)

```typescript
type ModalSize = 'sm' | 'md' | 'lg';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

**Styling:**
- Backdrop: `fixed inset-0 bg-black/50 z-50`
- Panel: `bg-surface-primary rounded-xl shadow-xl`
- Sizes: sm `max-w-sm`, md `max-w-lg`, lg `max-w-2xl`
- Padding: `p-6`
- Title: `text-lg font-semibold text-text-primary`
- Close button: top-right, `×` icon
- Animation: `transition-opacity` on backdrop, `scale-95→100` on panel
- Focus trap: first focusable element on open
- Escape key: calls `onClose`
- Click outside: calls `onClose`

### Toggle Component (Medium Priority)

```typescript
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}
```

**Styling:**
- Track: `w-10 h-6 rounded-full` — gray when off, `bg-primary-500` when on
- Thumb: `h-5 w-5 rounded-full bg-white shadow-sm` — translates `translate-x-0` / `translate-x-4`
- Focus: `focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`
- Label: `text-sm font-medium text-text-primary` adjacent
- Description: `text-sm text-text-tertiary` below label
- Duration: 200ms ease

### Avatar Component (Medium Priority)

```typescript
type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  src?: string;
  name: string;
  size?: AvatarSize;
  className?: string;
}
```

**Styling:**
- Sizes: sm `h-8 w-8 text-xs`, md `h-10 w-10 text-sm`, lg `h-12 w-12 text-base`
- Border radius: `rounded-full`
- Image: `object-cover`
- Fallback: `bg-primary-500 text-white font-medium` with first initials
- Ring: optional `ring-2 ring-surface-primary` for overlap support

### DropdownMenu Component (Medium Priority)

```typescript
interface DropdownItem {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'start' | 'end';
}
```

**Styling:**
- Trigger button: `ghost` variant, icon-only `h-8 w-8 rounded-lg`
- Menu: `absolute right-0 mt-1 w-48 bg-surface-primary border border-border rounded-lg shadow-lg py-1 z-50`
- Item: `flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-tertiary`
- Danger: `text-error-500 hover:bg-error-50`
- Divider: `border-t border-border my-1`

### Pagination Component (Medium Priority)

```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}
```

**Styling:**
- Container: `flex items-center justify-between`
- Info text: `text-sm text-text-tertiary`
- Buttons: `<Button variant="ghost" size="sm">` for prev/next
- Page numbers: `h-8 w-8 rounded-lg text-sm` — active has `bg-primary-50 text-primary-600 font-medium`
- Ellipsis where needed

### Select Component (Medium Priority)

For filter dropdowns and role selection.

```typescript
interface SelectProps {
  label?: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  fullWidth?: boolean;
}
```

**Styling:**
- Follows `<Input>` visual pattern
- `h-10 rounded-lg border border-border bg-surface-primary px-3 pr-8 text-sm`
- Custom chevron icon, right-aligned
- Focus styles match Input

### Alert Component (From Auth Proposal)

Already specified in `docs/ux/auth-flow-wireframes.md` §14. Reuse same spec — same component serves auth pages and admin UI.

---

## 10. Accessibility Checklist

| Criterion | Implementation |
|-----------|---------------|
| **Sidebar nav** | `<nav aria-label="Admin navigation">`, `aria-current="page"` on active link |
| **Tables** | `<table>` with `<thead>`, `<th scope="col">`, `<tbody>` |
| **Sortable columns** | `aria-sort="ascending"` / `"descending"` / `"none"` |
| **Modal focus** | Focus trap: first element focused on open, Tab wraps within, Escape closes |
| **Modal ARIA** | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` linking to title |
| **Toggle switches** | `role="switch"`, `aria-checked`, visible label |
| **Dropdown menus** | `role="menu"`, `aria-expanded` on trigger, `role="menuitem"` on items |
| **Keyboard nav** | Tab through sidebar items, Enter activates, Escape closes menus/modals |
| **Error announcements** | Inline validation `role="alert"`, `aria-describedby` on form fields |
| **Focus management** | Page title focused on route change. Modal trigger focused on close. |
| **Contrast** | All text meets WCAG AA. Tokens from existing palette tested. |
| **Reduced motion** | `prefers-reduced-motion` query respected — instant transitions |
| **Color independence** | Status never indicated by color alone (icon + text paired with dot) |

---

## 11. Responsive Behavior

| Viewport | Layout Adaptation |
|----------|-------------------|
| **≥1024px (desktop)** | Sidebar pinned (w-64). Content fills remaining width. Table has full columns. |
| **768-1023px (tablet)** | Sidebar collapsible (hamburger). Table shows fewer columns (actions in overflow menu). |
| **<768px (mobile)** | Sidebar as overlay drawer. Roles page stacks vertically (list on top, editor below). Tables scroll horizontally with sticky first column. Modals are full-screen (`m-0 rounded-none`). |

### Mobile Table Behavior

- First column (Name) is sticky with `left-0` and `bg-surface-primary` shadow
- Table container has `overflow-x-auto`
- Column count reduces: hide Email on mobile, hide Timestamp seconds

### Mobile Sidebar

```
┌──────────────────────────────────┐
│ [≡] Nexus Engineering    [Avatar]│ ← Top bar with hamburger
├──────────────────────────────────┤
│                                  │
│  (overlay drawer from left)      │
│  ┌──── overlay ──────────────┐   │
│  │ ○ Admin Home               │   │
│  │ ○ Teams                    │   │
│  │ ● Members                  │   │
│  │ ○ Roles                    │   │
│  │ ○ Audit Log                │   │
│  └────────────────────────────┘   │
│                                  │
│  Content (full width below)      │
│                                  │
└──────────────────────────────────┘
```

---

## 12. Dark Mode

All tokens have dark mode variants defined in `theme.css`. No additional work needed beyond using existing tokens.

| Light Token | Dark Token |
|-------------|------------|
| `bg-surface-primary` (#FFFFFF) | `bg-surface-primary` (#0F172A) |
| `bg-surface-secondary` (#F8FAFC) | `bg-surface-secondary` (#1E293B) |
| `bg-surface-tertiary` (#F1F5F9) | `bg-surface-tertiary` (#334155) |
| `text-text-primary` (#0F172A) | `text-text-primary` (#F8FAFC) |
| `text-text-secondary` (#475569) | `text-text-secondary` (#CBD5E1) |
| `border-border` (#E2E8F0) | `border-border` (#334155) |

---

## 13. Icons Required (from lucide-react)

| Icon | Usage |
|------|-------|
| `LayoutDashboard` | Admin Home nav icon |
| `Building2` | Teams nav icon |
| `Users` | Members nav icon |
| `Shield` | Roles nav icon |
| `ScrollText` | Audit Log nav icon |
| `Search` | Search input left icon |
| `Plus` | "Invite member" / "Create role" button icon |
| `MoreHorizontal` | Row actions dropdown trigger |
| `ChevronDown` | Dropdown indicator, filter select |
| `ChevronLeft` | Pagination prev |
| `ChevronRight` | Pagination next |
| `X` | Modal close, chip remove |
| `Check` | Save confirmation, toggle on state |
| `Mail` | Invite email icon |
| `UserPlus` | Invite member icon |
| `Trash2` | Remove/delete actions |
| `AlertTriangle` | Danger zone, warning dialogs |
| `Info` | Info tooltips |
| `Download` | Export CSV |
| `Calendar` | Date range picker |
| `Filter` | Filter indicator |
| `ArrowUpDown` | Table sort indicator |
| `ArrowUp` | Sort ascending |
| `ArrowDown` | Sort descending |
| `Eye` | View details |
| `EyeOff` | Hidden details |
| `ShieldAlert` | Permission restricted indicator |
| `Loader2` | Loading spinner |

---

## 14. System-Level Proposals

### New Components Summary

| Component | Priority | Dependencies | Reuse Potential |
|-----------|----------|-------------|-----------------|
| `<Table>` | High | None | All list views (members, audit, roles) |
| `<Modal>` | High | None | Invite form, confirmations, details |
| `<Toggle>` | Medium | None | Permission editor, settings |
| `<Avatar>` | Medium | None | User display everywhere |
| `<DropdownMenu>` | Medium | None | Row actions, user menu |
| `<Pagination>` | Medium | `<Button>` | All paginated lists |
| `<Select>` | Medium | None | Filters, role picker |
| `<Alert>` | High (from auth) | None | Auth pages, admin messages |

### Token Additions Required

None. All colors, spacing, type, radii, and shadows map to existing tokens.

### Design System Audit Impact

These components fill real gaps in the current design system. The current component set (Button, Input, Card, Layout, Nav, Badge) covers basic primitives but lacks:
- Data display (Table)
- Overlays (Modal)
- Selection controls (Toggle, Select)
- User representation (Avatar)
- Context menus (DropdownMenu)

These are not admin-only — they will be reused across the product:
- `<Table>` — Discovery dashboard results, artifact lists
- `<Modal>` — Confirmations everywhere
- `<Toggle>` — Feature flags, settings
- `<Avatar>` — User comments, profile display
- `<DropdownMenu>` — Any action list
- `<Select>` — Any dropdown picker

---

## 15. Acceptance Criteria for FrontendArchitect

### Admin Shell
- [ ] Sidebar + top bar layout with responsive behavior
- [ ] Sidebar nav items: Home, Members, Roles, Audit Log
- [ ] Top bar with logo, user avatar, and dropdown menu
- [ ] Mobile: sidebar collapses to overlay drawer
- [ ] Breadcrumbs or page title indicator for current section

### Admin Dashboard
- [ ] Stat cards showing member counts with trends
- [ ] Recent activity feed (last 20 events)
- [ ] Team overview with member counts
- [ ] Empty state for fresh installs

### Members Management
- [ ] Table with Name, Email, Role, Status columns
- [ ] Search/filter by name, role, status
- [ ] Invite member modal with email + role fields
- [ ] Remove member confirmation dialog
- [ ] Table sorting by name, email, role
- [ ] Pagination
- [ ] Row states: Active, Invited, Disabled

### Roles & Permissions
- [ ] Two-column layout: role list + permission editor
- [ ] Default roles: Admin, Developer, Viewer
- [ ] Create role modal with name + description
- [ ] Permission toggles grouped by resource category
- [ ] Save/reset buttons with dirty state tracking

### Organization Settings
- [ ] Name + slug form with save
- [ ] Security settings: email verification, 2FA toggles
- [ ] Session timeout input
- [ ] Danger zone with delete organization flow
- [ ] Type-to-confirm for irreversible actions

### Audit Log
- [ ] Table with Timestamp, Actor, Action, Target columns
- [ ] Search and filter by action type, actor, date range
- [ ] Click-to-expand event detail
- [ ] Export CSV button
- [ ] Pagination

### Design System Compliance
- [ ] All proposed components added to `packages/shared/src/design-system/components/`
- [ ] All new components exported from `packages/shared/src/design-system/components/index.ts`
- [ ] All tokens from `theme.css` — no hardcoded values
- [ ] Dark mode works via existing token system
- [ ] No one-off values: spacing uses scale, colors use palette

### Accessibility
- [ ] Semantically correct HTML: `<nav>`, `<table>`, `<dialog>`, `<button>`
- [ ] All interactive elements keyboard accessible
- [ ] Focus management on modal open/close and route change
- [ ] `aria-current="page"` on active sidebar links
- [ ] Toggle switches use `role="switch"` with `aria-checked`
- [ ] Error announcements with `role="alert"`
- [ ] Contrast ratios meet WCAG AA

### Responsive
- [ ] Sidebar collapses on tablet/mobile
- [ ] Tables horizontally scrollable on mobile
- [ ] Modals become full-screen on mobile
- [ ] Permission editor stacks vertically on mobile
- [ ] Touch targets ≥44px on mobile

---

## 16. Route Protection Integration

These admin routes augment the Route Protection Matrix from `auth-flow-wireframes.md` §8:

| Route | Required Role | Notes |
|-------|---------------|-------|
| `#admin` | Admin | Dashboard/overview |
| `#admin/teams` | Admin | Team management |
| `#admin/members` | Admin | Member management |
| `#admin/roles` | Admin | Role & permission management |
| `#admin/settings` | Admin | Organization settings |
| `#admin/audit` | Admin | Audit log |

Non-admin users who navigate to `#admin/*` should see an **Access Denied** view:

```
┌──────────────────────────────────────────┐
│                                          │
│  [ShieldAlert icon]                      │
│                                          │
│  Access Denied                           │
│  You don't have permission to access     │
│  this section.                           │
│                                          │
│  If you need access, contact your        │
│  organization administrator.             │
│                                          │
│  [ Back to Dashboard ]                   │
│                                          │
└──────────────────────────────────────────┘
```

---

*Document created by UXDesigner. Ready for FrontendArchitect handoff in Sprint 10 (or Sprint 9 if capacity allows).*
