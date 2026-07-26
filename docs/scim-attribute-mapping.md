# SCIM 2.0 Attribute Mapping — Nexus Engineering Platform

> **Version:** 1.0  
> **Date:** 2026-07-26  
> **Author:** BackendArchitect  
> **RFC Reference:** [RFC 7643](https://datatracker.ietf.org/doc/html/rfc7643), [RFC 7644](https://datatracker.ietf.org/doc/html/rfc7644)

---

## 1. Overview

This document maps Nexus internal data model entities to SCIM 2.0 schema types. Nexus uses two core SCIM resource types:

- **`User`** — `urn:ietf:params:scim:schemas:core:2.0:User`
- **`Group`** — `urn:ietf:params:scim:schemas:core:2.0:Group`

Custom extensions add Nexus-specific attributes (org role, traceability permissions, SSO metadata).

---

## 2. SCIM Core 2.0 — User Schema

### 2.1 Standard Attribute Mapping

| SCIM Path | SCIM Type | Required | Nexus Internal Field | Nexus Type | Notes |
|-----------|-----------|----------|---------------------|------------|-------|
| `id` | `string` | Yes | `users.id` | `TEXT` | SCIM resource identifier |
| `userName` | `string` | Yes | `users.email` | `TEXT` | SCIM standard: `userName` maps to user's email in Nexus |
| `name` | `complex` | No | derived | — | Composite of `display_name` |
| `name.formatted` | `string` | No | `users.display_name` | `TEXT \| NULL` | Full display name |
| `name.familyName` | `string` | No | derived | `string` | Surname extracted from `display_name` |
| `name.givenName` | `string` | No | derived | `string` | Given name extracted from `display_name` |
| `displayName` | `string` | No | `users.display_name` | `TEXT \| NULL` | Alias; same as `name.formatted` |
| `nickName` | `string` | No | — | — | Not used in Nexus; always `null` |
| `profileUrl` | `string` | No | — | — | Not used; always `null` |
| `emails` | `complex[]` | No | `users.email` | `TEXT` | Primary email in `primary: true` entry. Supports multi-valued. |
| `emails[type]` | `string` | No | — | `string` | Values: `work` (default), `home`, `other` |
| `emails.primary` | `boolean` | No | — | `boolean` | Always `true` for the `work` entry |
| `emails.value` | `string` | No | `users.email` | `TEXT` | The email address |
| `active` | `boolean` | No | `users.is_active` | `INTEGER` | `1 → true`, `0 → false`. SCIM convention: deactivated users get `active: false` |
| `roles` | `string[]` | No | `roles.name` (via `users.role_id`) | `TEXT` | System-level roles: `admin`, `developer`, `viewer`, `analyst` |
| `groups` | `complex[]` | No | `organization_members` + `team_members` | — | Multi-valued. Each entry: `{display, value, $ref}` |
| `groups[$ref]` | `string` | No | — | `string` | `/api/scim/Groups/{groupId}` |
| `groups[value]` | `string` | No | — | `string` | Group ID |
| `groups[display]` | `string` | No | — | `string` | Group name |
| `title` | `string` | No | — | — | Not used; always `null` |
| `userType` | `string` | No | `users.role_id` → role name | `TEXT` | Maps to system role name |
| `preferredLanguage` | `string` | No | — | — | Not used; always `null` |
| `locale` | `string` | No | — | — | Not used; always `null` |
| `timezone` | `string` | No | — | — | Not used; always `null` |
| `photos` | `complex[]` | No | `oauth_accounts.avatar_url` | — | OAuth-provided avatar photos |
| `photos[value]` | `string` | No | — | `string` | Avatar URL |
| `photos[type]` | `string` | No | — | `string` | `photo` |
| `photos[primary]` | `boolean` | No | — | `boolean` | `true` for most recent |
| `photos[height]` | `integer` | No | — | `integer` | Avatar image height (px) |
| `photos[width]` | `integer` | No | — | `integer` | Avatar image width (px) |
| `pictures` | `complex[]` | No | (alias of `photos`) | — | Alias for `photos` |
| `urn:ietf:params:scim:schemas:core:2.0:User:meta` | — | — | auto-generated | — | See §4 |

### 2.2 Nexus Custom Extensions

| Extension URI | SCIM Path | Nexus Field | Type | Description |
|--------------|-----------|-------------|------|-------------|
| `urn:nexus:params:scim:schemas:extension:org:1.0:User` | `urn:nexus:orgId` | `organization_members.organization_id` | `string` | Organization the user belongs to |
| `urn:nexus:params:scim:schemas:extension:org:1.0:User` | `urn:nexus:orgRole` | `organization_members.role` | `string` | Org-level role: `org:admin`, `org:member`, `org:viewer` |
| `urn:nexus:params:scim:schemas:extension:trace:1.0:User` | `urn:nexus:tracePermissions` | `permissions.name` (via role) | `string[]` | Resource-level traceability permissions derived from role |
| `urn:nexus:params:scim:schemas:extension:sso:1.0:User` | `urn:nexus:ssoprovider` | `oauth_accounts.provider` | `string \| null` | Identity provider: `saml`, `google`, `github`, etc. |
| `urn:nexus:params:scim:schemas:extension:sso:1.0:User` | `urn:nexus:ssouserId` | `oauth_accounts.provider_user_id` | `string \| null` | Provider-specific user ID |
| `urn:nexus:params:scim:schemas:extension:sso:1.0:User` | `urn:nexus:ssoproviderEmail` | `oauth_accounts.email` | `string \| null` | Email from SSO provider |

### 2.3 SCIM User to Nexus User — Transform

**SCIM → Nexus (write):**
```
userName (SCIM)    → users.email
displayName        → users.display_name
active             → users.is_active
roles[0]           → users.role_id (lookup role by name)
urn:nexus:orgId    → organization_members.organization_id
urn:nexus:orgRole  → organization_members.role
urn:nexus:ssoprovider → oauth_accounts.provider
urn:nexus:ssouserId   → oauth_accounts.provider_user_id
```

**Nexus → SCIM (read):**
```
users.email        → userName, emails[0].value
users.display_name → displayName, name.formatted
users.is_active    → active
roles.name         → roles[0]
users.created_at   → meta.created
users.updated_at   → meta.lastModified
```

---

## 3. SCIM Core 2.0 — Group Schema

### 3.1 Standard Attribute Mapping

| SCIM Path | SCIM Type | Required | Nexus Internal Field | Nexus Type | Notes |
|-----------|-----------|----------|---------------------|------------|-------|
| `id` | `string` | Yes | `teams.id` | `TEXT` | SCIM resource identifier |
| `displayName` | `string` | Yes | `teams.name` | `TEXT` | Group name |
| `members` | `complex[]` | No | `team_members.user_id` | — | Members of the team/group |
| `members[$ref]` | `string` | No | — | `string` | `/api/scim/Users/{userId}` |
| `members[value]` | `string` | No | — | `string` | User ID |
| `members[type]` | `string` | No | — | `string` | `User` |
| `members[display]` | `string` | No | — | `string` | User's `display_name` or `email` |
| `description` | `string` | No | `teams.description` | `TEXT \| NULL` | Group description |
| `urn:ietf:params:scim:schemas:core:2.0:Group:meta` | — | — | auto-generated | — | See §4 |

### 3.2 Group to Nexus Mapping

**SCIM Group ↔ Nexus entity:**
- SCIM `Group` maps to Nexus `Team` (scoped to an `Organization`)
- `Group.members` maps to `TeamMember` entries
- `Group.displayName` maps to `Team.name`

---

## 4. SCIM Meta Schema

Every SCIM resource includes a `meta` object:

| SCIM Path | Nexus Source | Notes |
|-----------|-------------|-------|
| `meta.resourceType` | — | `"User"` or `"Group"` |
| `meta.created` | `users.created_at` / `teams.created_at` | ISO 8601 timestamp |
| `meta.lastModified` | `users.updated_at` / `teams.updated_at` | ISO 8601 timestamp |
| `meta.location` | — | `https://{host}/api/scim/{ResourceType}/{id}` |
| `meta.version` | — | ETag-style version (opaque string) |

---

## 5. SCIM Filter Mapping

SCIM filter expressions → SQL WHERE clauses:

| SCIM Filter | SQL WHERE | Example |
|-------------|-----------|---------|
| `userName eq "jdoe@example.com"` | `email = ?` | Exact match |
| `userName sw "john"` | `email LIKE 'john%'` | Starts with |
| `userName ew "@example.com"` | `email LIKE '%@example.com'` | Ends with |
| `userName co "john"` | `email LIKE '%john%'` | Contains |
| `active eq true` | `is_active = 1` | Activation |
| `meta.lastModified gt "2024-01-01T00:00:00Z"` | `updated_at > ?` | Changed after |
| `roles any (value eq "admin")` | `role_id IN (SELECT id FROM roles WHERE name = 'admin')` | Role filter |
| `groups[value] eq "{groupId}"` | `organization_id = ?` | Org membership |
| `displayName co "John"` | `display_name LIKE '%John%'` | Name contains |

**Compound filters:**
- `filter=userName eq "jdoe" and active eq true` → `WHERE email = ? AND is_active = 1`
- `filter=userName pr` → `WHERE email IS NOT NULL AND email != ''` (present)
- `filter=userName sw "john" or userName sw "jane"` → `WHERE email LIKE 'john%' OR email LIKE 'jane%'`

### 5.1 Supported Filter Operators

| Operator | SCIM | SQL | Supported |
|----------|------|-----|-----------|
| Equals | `eq` | `=`, `IN` | Yes |
| Not Equals | `ne` | `!=` | Yes |
| Greater/Less than | `gt`, `ge`, `lt`, `le` | `>`, `>=`, `<`, `<=` | Yes |
| Starts/Ends/Contains | `sw`, `ew`, `co` | `LIKE` | Yes |
| Present | `pr` | `IS NOT NULL AND != ''` | Yes |
| Any (multi-valued) | `any` | `EXISTS` / `IN` | Yes |
| Logical | `and`, `or`, `not` | `AND`, `OR`, `NOT` | Yes |

---

## 6. SCIM Pagination

Nexus uses SCIM 2.0 standard pagination parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `startIndex` | `integer` | `1` | 1-based page number |
| `count` | `integer` | `10` | Max results per page (max: 100) |

Response envelope includes `totalResults` and `itemsPerPage`:

```json
{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
  "totalResults": 150,
  "itemsPerPage": 10,
  "startIndex": 1,
  "Resources": [...]
}
```

SQL mapping:
```sql
LIMIT {count} OFFSET ({startIndex} - 1)
```

---

## 7. SCIM Patch Schema

For `PATCH /api/scim/Users/{id}`, Nexus supports the SCIM 2.0 PatchOp:

```json
{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
  "Operations": [
    {
      "op": "add",
      "path": "urn:nexus:orgRole",
      "value": "org:admin"
    },
    {
      "op": "remove",
      "path": "roles[value eq \"viewer\"]"
    },
    {
      "op": "replace",
      "path": "userName",
      "value": "newemail@example.com"
    }
  ]
}
```

| Operation | SQL | Notes |
|-----------|-----|-------|
| `add` | `INSERT` / `UPDATE SET col = col || ?` | Add to multi-valued or set single |
| `remove` | `DELETE` / `UPDATE SET col = NULL` | Remove from multi-valued or null |
| `replace` | `UPDATE SET col = ?` | Replace entire value |

---

## 8. SCIM Error Responses

All SCIM error responses follow RFC 7644 Section 3.6:

```json
{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:Error"],
  "scimType": "uniquename",
  "detail": "A user with this email already exists.",
  "status": "409"
}
```

| HTTP Status | SCIM Type | Nexus Equivalent |
|------------|-----------|-----------------|
| 400 | `invalidFilter` | Bad query parameter |
| 401 | — | No / invalid auth header |
| 403 | `accessDenied` | Insufficient permissions |
| 404 | `noTarget` | Resource not found |
| 405 | `methodNotAllowed` | Unsupported HTTP method |
| 409 | `uniquename` | Duplicate `userName` (email) |
| 409 | `mutability` | Attempt to modify immutable field |
| 409 | `syntax` | Invalid SCIM filter syntax |
| 412 | `preconditionFailed` | `If-Match` header mismatch |
| 429 | — | Rate limited |

---

## 9. SCIM Attribute Mutability

| SCIM Path | Read-Only | Required | Multi-valued | Patchable |
|-----------|-----------|----------|-------------|-----------|
| `id` | Yes | Yes | No | No |
| `userName` | No | Yes | No | Yes |
| `displayName` | No | No | No | Yes |
| `name` | No | No | No | Yes |
| `emails` | No | No | Yes | Yes |
| `active` | No | No | No | Yes |
| `roles` | No | No | Yes | Yes |
| `groups` | No | No | Yes | Yes |
| `meta` | Yes | Yes | No | No |
| `urn:nexus:orgRole` | No | No | No | Yes |
| `urn:nexus:tracePermissions` | Yes | No | Yes | No |
| `urn:nexus:ssoprovider` | Yes | No | No | No |
| `urn:nexus:ssouserId` | Yes | No | No | No |

---

## 10. Entity Relationship Summary

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  User (SCIM)  │       │ Organization  │       │   Team/Group  │
│              │       │              │       │              │
│ userName     │──────>│ id             │<──────│ id           │
│ displayName  │       │ name           │       │ displayName  │
│ active       │       │ slug           │       │ description  │
│ roles        │       │ settings       │       │ members[]    │
│ emails       │       │ owner_id       │       │              │
│ meta         │       │              │       └──────────────┘
└──────────────┘       │              │              │
      │                │  ┌─────────┐ │              │
      │                │  │ members │ │              │
      │                │  │ ┌─────┐ │ │              │
      │                │  │ │role │ │ │              │
      │                │  │ └─────┘ │ │              │
      └────────────────│────────────│┘              └──────────┐
                       │            │                          │
                       │            │                          │
                       v            v                          v
                 ┌──────────┐  ┌──────────┐           ┌──────────┐
                 │  Role    │  │Permission│           │ TeamMember│
                 │          │  │          │           │          │
                 │ name     │  │ name     │           │ userId   │
                 │ id       │  │ resource  │           │ teamId   │
                 │ desc     │  │ action   │           │ role     │
                 └──────────┘  └──────────┘           └──────────┘
```
