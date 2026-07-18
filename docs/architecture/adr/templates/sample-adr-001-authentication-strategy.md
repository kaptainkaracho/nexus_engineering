# ADR-001: Authentication Strategy

**Status:** Accepted  
**Date:** 2026-07-18  
**Deciders:** CTO, SecurityEngineer, BackendArchitect  
**Issue:** THE-191

---

## Context

Nexus needs to implement user authentication to secure the API and provide personalized experiences. The system must support:

1. Email/password authentication for primary login
2. OAuth2 integration for social login (Google, GitHub)
3. JWT-based session management
4. Role-based access control (RBAC)

The current codebase uses Fastify for the backend and React for the frontend. We need a solution that:
- Integrates well with the existing tech stack
- Follows security best practices
- Is maintainable and well-documented
- Supports future authentication methods

## Decision

We will implement a **layered authentication architecture** with:

1. **Auth Service Layer** (`packages/auth/`)
   - Centralized authentication logic
   - Support for multiple providers (email, OAuth2)
   - JWT token generation and validation
   - Session management

2. **Auth Middleware** (Fastify plugin)
   - Route protection
   - Token validation
   - User context injection

3. **Auth Hooks** (React)
   - Client-side session management
   - Protected route components
   - Authentication state

### Implementation Details

- **Passwords:** bcrypt with configurable rounds (default: 12)
- **JWT:** RS256 algorithm, 15-minute access tokens, 7-day refresh tokens
- **OAuth2:** Passport.js with strategy pattern
- **Session Store:** Redis with TTL matching token expiry

## Consequences

### Positive

- **Separation of concerns:** Auth logic is isolated and testable
- **Extensibility:** New providers can be added without changing core logic
- **Security:** Centralized security policies and token management
- **Developer experience:** Clear API for route protection and user context

### Negative

- **Complexity:** Additional service layer increases initial setup time
- **Dependencies:** Adds Passport.js and Redis as dependencies
- **Learning curve:** Team needs to understand the layered architecture

### Neutral

- **Existing code:** Some routes may need refactoring to use new middleware
- **Documentation:** Requires comprehensive API documentation
- **Testing:** Needs integration tests for all auth flows

## Alternatives Considered

### Option 1: NextAuth.js

**Pros:**
- Built-in support for multiple providers
- Handles JWT and session management
- Good TypeScript support

**Cons:**
- Tightly coupled to Next.js (we use React with Vite)
- Limited customization for advanced use cases
- Adds significant bundle size

**Why not chosen:** Framework mismatch and limited customization options.

### Option 2: Firebase Authentication

**Pros:**
- Managed service, reduces operational overhead
- Built-in OAuth2 providers
- Good security features

**Cons:**
- Vendor lock-in
- Limited control over token structure
- Cost at scale

**Why not chosen:** Preference for self-hosted solution and full control.

### Option 3: Custom Implementation

**Pros:**
- Full control over implementation
- No external dependencies
- Tailored to exact requirements

**Cons:**
- High security risk if not implemented correctly
- Significant development and maintenance overhead
- Need to stay updated on security best practices

**Why not chosen:** Security risk and maintenance burden too high.

## Related Decisions

- ADR-002: RBAC Data Model (pending)
- ADR-003: Session Management Strategy (pending)

## Notes

- **Security Review:** This ADR should be reviewed by SecurityEngineer before implementation
- **Performance:** JWT validation should be cached to reduce database hits
- **Monitoring:** Auth failures should be logged and monitored for suspicious activity
- **Migration:** Existing users will need a migration path if changing from current auth system

---

## References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices RFC](https://datatracker.ietf.org/doc/html/rfc8725)
- [Passport.js Documentation](https://www.passportjs.org/docs/)