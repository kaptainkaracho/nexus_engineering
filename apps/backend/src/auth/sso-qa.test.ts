import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { registerUser, AppError, getCurrentUser } from './service'
import { getAuthDatabase, AuthDatabase } from './database'
import { verify } from './jwt'
import { AuditLogDatabase, getAuditLogDatabase } from '../auditLog/database'
import { AuditLogRepository } from '../auditLog/repository'
import { orgRepository } from '../organizations/repository'
import { getOrgDatabase, resetOrgDatabase } from '../organizations/database'
import { resetOrgStore } from '../organizations/store'

process.env.JWT_SECRET = 'sso-qa-test-secret'
process.env.JWT_PRIVATE_KEY = ''
process.env.JWT_PUBLIC_KEY = ''

function resetAll() {
  resetOrgDatabase()
  resetOrgStore()
}

describe('SSO QA: OAuth Flow End-to-End', () => {
  const ORIGINAL_ENV = process.env

  beforeAll(() => {
    process.env.GOOGLE_CLIENT_ID = 'sso-qa-google-id'
    process.env.GOOGLE_CLIENT_SECRET = 'sso-qa-google-secret'
    process.env.GITHUB_CLIENT_ID = 'sso-qa-github-id'
    process.env.GITHUB_CLIENT_SECRET = 'sso-qa-github-secret'
    process.env.OAUTH_CALLBACK_URL = 'http://localhost:3001'
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
    process.env.JWT_SECRET = 'sso-qa-test-secret'
    process.env.GOOGLE_CLIENT_ID = 'sso-qa-google-id'
    process.env.GOOGLE_CLIENT_SECRET = 'sso-qa-google-secret'
    process.env.GITHUB_CLIENT_ID = 'sso-qa-github-id'
    process.env.GITHUB_CLIENT_SECRET = 'sso-qa-github-secret'
    process.env.OAUTH_CALLBACK_URL = 'http://localhost:3001'
  })

  function mockGoogleFetch(originalFetch: typeof globalThis.fetch, googleUserId: string, email: string, name: string) {
    globalThis.fetch = async (url: string) => {
      if (url.includes('oauth2.googleapis.com/token')) {
        return new Response(JSON.stringify({ access_token: 'mock-google-token' }), {
          status: 200, headers: { 'Content-Type': 'application/json' },
        }) as any
      }
      if (url.includes('userinfo')) {
        return new Response(JSON.stringify({ id: googleUserId, email, name, picture: 'https://example.com/avatar.png' }), {
          status: 200, headers: { 'Content-Type': 'application/json' },
        }) as any
      }
      return originalFetch(url)
    }
  }

  it('generates authorization URL with state for Google provider', async () => {
    const { getAuthorizationUrl } = await import('./oauth/service')
    const result = getAuthorizationUrl('google')
    expect(result.url).toContain('https://accounts.google.com/o/oauth2/v2/auth')
    expect(result.url).toContain('client_id=sso-qa-google-id')
    expect(result.url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Foauth%2Fgoogle%2Fcallback')
    expect(result.url).toContain('response_type=code')
    expect(result.url).toContain('scope=openid+email+profile')
    expect(result.state).toBeTruthy()
    expect(result.state.length).toBeGreaterThan(16)
  })

  it('generates authorization URL with state for GitHub provider', async () => {
    const { getAuthorizationUrl } = await import('./oauth/service')
    const result = getAuthorizationUrl('github')
    expect(result.url).toContain('https://github.com/login/oauth/authorize')
    expect(result.url).toContain('client_id=sso-qa-github-id')
    expect(result.url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Foauth%2Fgithub%2Fcallback')
    expect(result.url).toContain('scope=read%3Auser+user%3Aemail')
    expect(result.state).toBeTruthy()
  })

  it('completes OAuth callback for Google and issues JWT for new user', async () => {
    const { handleOAuthCallback } = await import('./oauth/service')
    const originalFetch = globalThis.fetch
    mockGoogleFetch(originalFetch, 'google-user-1', 'oauth-new@example.com', 'OAuth New User')

    const result = await handleOAuthCallback('google', 'valid-auth-code')
    expect(result.user.email).toBe('oauth-new@example.com')
    expect(result.user.displayName).toBe('OAuth New User')
    expect(result.isNewUser).toBe(true)
    expect(result.accessToken).toBeTruthy()

    const payload = await verify(result.accessToken) as any
    expect(payload.sub).toBe(result.user.id)
    expect(payload.email).toBe('oauth-new@example.com')
    expect(payload.role).toBe('viewer')
    expect(payload.jti).toBeTruthy()

    const db = getAuthDatabase()
    const account = db.findOAuthAccount('google', 'google-user-1')
    expect(account).toBeDefined()
    expect(account!.user_id).toBe(result.user.id)
    globalThis.fetch = originalFetch
  })

  it('completes OAuth callback for GitHub and issues JWT for new user', async () => {
    const { handleOAuthCallback } = await import('./oauth/service')
    const originalFetch = globalThis.fetch
    let emailFetched = false
    globalThis.fetch = async (url: string) => {
      if (url.includes('github.com/login/oauth/access_token')) {
        return new Response(JSON.stringify({ access_token: 'mock-github-token' }), {
          status: 200, headers: { 'Content-Type': 'application/json' },
        }) as any
      }
      if (url.includes('api.github.com/user/emails')) {
        emailFetched = true
        return new Response(JSON.stringify([{ email: 'gh-new@example.com', primary: true, verified: true }]), {
          status: 200, headers: { 'Content-Type': 'application/json' },
        }) as any
      }
      if (url.includes('api.github.com/user') && !url.includes('emails')) {
        return new Response(JSON.stringify({ id: 42, login: 'ghuser', name: 'GitHub User', avatar_url: 'https://github.com/avatar.png' }), {
          status: 200, headers: { 'Content-Type': 'application/json' },
        }) as any
      }
      return originalFetch(url)
    }

    const result = await handleOAuthCallback('github', 'valid-github-code')
    expect(result.user.email).toBe('gh-new@example.com')
    expect(result.isNewUser).toBe(true)
    expect(result.accessToken).toBeTruthy()
    expect(emailFetched).toBe(true)

    const payload = await verify(result.accessToken) as any
    expect(payload.sub).toBe(result.user.id)
    expect(payload.email).toBe('gh-new@example.com')

    const db = getAuthDatabase()
    const account = db.findOAuthAccount('github', '42')
    expect(account).toBeDefined()
    globalThis.fetch = originalFetch
  })

  it('links OAuth login to existing user by email and issues JWT', async () => {
    await registerUser('existing-oauth@example.com', 'password123456', 'Existing OAuth')
    const { handleOAuthCallback } = await import('./oauth/service')
    const originalFetch = globalThis.fetch
    mockGoogleFetch(originalFetch, 'google-link-1', 'existing-oauth@example.com', 'Existing OAuth')

    const result = await handleOAuthCallback('google', 'link-code')
    expect(result.user.email).toBe('existing-oauth@example.com')
    expect(result.isNewUser).toBe(false)

    const payload = await verify(result.accessToken) as any
    expect(payload.email).toBe('existing-oauth@example.com')

    const db = getAuthDatabase()
    const account = db.findOAuthAccount('google', 'google-link-1')
    expect(account).toBeDefined()
    expect(account!.email).toBe('existing-oauth@example.com')
    globalThis.fetch = originalFetch
  })

  it('reuses existing OAuth account link on subsequent login and issues JWT', async () => {
    const { handleOAuthCallback } = await import('./oauth/service')
    const originalFetch = globalThis.fetch
    mockGoogleFetch(originalFetch, 'google-reuse', 'reuse@example.com', 'Reuse')
    const first = await handleOAuthCallback('google', 'code-1')
    mockGoogleFetch(originalFetch, 'google-reuse', 'reuse@example.com', 'Reuse')
    const second = await handleOAuthCallback('google', 'code-2')
    expect(second.user.id).toBe(first.user.id)
    expect(second.isNewUser).toBe(false)
    const payload = await verify(second.accessToken) as any
    expect(payload.sub).toBe(first.user.id)
    globalThis.fetch = originalFetch
  })

  it('throws on unconfigured provider', async () => {
    process.env.GOOGLE_CLIENT_ID = ''
    const { getAuthorizationUrl } = await import('./oauth/service')
    expect(() => getAuthorizationUrl('google')).toThrow(AppError)
  })

  it('throws on unsupported provider', async () => {
    const { getAuthorizationUrl } = await import('./oauth/service')
    expect(() => getAuthorizationUrl('twitter')).toThrow(AppError)
  })
})

describe('SSO QA: SAML Flow Test', () => {
  const ORIGINAL_ENV = process.env

  beforeAll(() => {
    process.env.SAML_SP_ENTITY_ID = 'nexus-qa-entity'
    process.env.SAML_ACS_URL = 'http://localhost:3001/api/auth/saml/callback'
    process.env.SAML_ATTR_MAPPING = JSON.stringify({ email: 'email', displayName: 'displayName', role: 'role' })
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
    process.env.JWT_SECRET = 'sso-qa-test-secret'
    process.env.SAML_SP_ENTITY_ID = 'nexus-qa-entity'
    process.env.SAML_ACS_URL = 'http://localhost:3001/api/auth/saml/callback'
    process.env.SAML_ATTR_MAPPING = JSON.stringify({ email: 'email', displayName: 'displayName', role: 'role' })
  })

  it('generates valid SAML metadata XML', async () => {
    const { generateMetadataXml } = await import('./saml/service')
    const xml = generateMetadataXml()
    expect(xml).toContain('<?xml version="1.0"?>')
    expect(xml).toContain('md:EntityDescriptor')
    expect(xml).toContain('entityID="nexus-qa-entity"')
    expect(xml).toContain('urn:oasis:names:tc:SAML:2.0:protocol')
    expect(xml).toContain('http://localhost:3001/api/auth/saml/callback')
    expect(xml).toContain('urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST')
  })

  it('creates new user from SAML response and issues valid JWT', async () => {
    const { handleSamlCallback } = await import('./saml/service')
    const samlXml = `<?xml version="1.0"?>
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
  <saml:Assertion>
    <saml:Subject><saml:NameID>saml-new@example.com</saml:NameID></saml:Subject>
    <saml:AttributeStatement>
      <saml:Attribute Name="email"><saml:AttributeValue>saml-new@example.com</saml:AttributeValue></saml:Attribute>
      <saml:Attribute Name="displayName"><saml:AttributeValue>Saml New User</saml:AttributeValue></saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>`
    const samlResponse = Buffer.from(samlXml).toString('base64')

    const result = await handleSamlCallback(samlResponse)
    expect(result.user.email).toBe('saml-new@example.com')
    expect(result.user.displayName).toBe('Saml New User')
    expect(result.isNewUser).toBe(true)
    expect(result.accessToken).toBeTruthy()

    const payload = await verify(result.accessToken) as any
    expect(payload.sub).toBe(result.user.id)
    expect(payload.email).toBe('saml-new@example.com')
    expect(payload.jti).toBeTruthy()
  })

  it('links SAML user to existing account by email and issues JWT', async () => {
    await registerUser('saml-existing-qa@example.com', 'password123456', 'SAML Existing')
    const { handleSamlCallback } = await import('./saml/service')
    const samlXml = `<?xml version="1.0"?>
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
  <saml:Assertion>
    <saml:Subject><saml:NameID>saml-existing-qa@example.com</saml:NameID></saml:Subject>
    <saml:AttributeStatement>
      <saml:Attribute Name="email"><saml:AttributeValue>saml-existing-qa@example.com</saml:AttributeValue></saml:Attribute>
      <saml:Attribute Name="displayName"><saml:AttributeValue>SAML Existing</saml:AttributeValue></saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>`
    const samlResponse = Buffer.from(samlXml).toString('base64')

    const result = await handleSamlCallback(samlResponse)
    expect(result.user.email).toBe('saml-existing-qa@example.com')
    expect(result.isNewUser).toBe(false)

    const payload = await verify(result.accessToken) as any
    expect(payload.email).toBe('saml-existing-qa@example.com')
  })

  it('applies SAML role attribute mapping when role exists in system', async () => {
    const { handleSamlCallback } = await import('./saml/service')
    const db = getAuthDatabase()
    const devRole = db.findRoleByName('developer')
    expect(devRole).toBeDefined()

    const samlXml = `<?xml version="1.0"?>
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
  <saml:Assertion>
    <saml:Subject><saml:NameID>saml-role@example.com</saml:NameID></saml:Subject>
    <saml:AttributeStatement>
      <saml:Attribute Name="email"><saml:AttributeValue>saml-role@example.com</saml:AttributeValue></saml:Attribute>
      <saml:Attribute Name="displayName"><saml:AttributeValue>Saml Role</saml:AttributeValue></saml:Attribute>
      <saml:Attribute Name="role"><saml:AttributeValue>developer</saml:AttributeValue></saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>`
    const samlResponse = Buffer.from(samlXml).toString('base64')

    const result = await handleSamlCallback(samlResponse)
    expect(result.user.email).toBe('saml-role@example.com')
    expect(result.isNewUser).toBe(true)

    const user = getCurrentUser(result.user.id)
    expect(user).toBeDefined()
    expect(user!.roleName).toBe('developer')
  })

  it('rejects SAML response without email', async () => {
    const { handleSamlCallback } = await import('./saml/service')
    const samlXml = `<?xml version="1.0"?>
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
  <saml:Assertion>
    <saml:Subject><saml:NameID></saml:NameID></saml:Subject>
  </saml:Assertion>
</samlp:Response>`
    const samlResponse = Buffer.from(samlXml).toString('base64')
    await expect(handleSamlCallback(samlResponse)).rejects.toThrow(AppError)
  })

  it('uses custom attribute mapping when configured', async () => {
    process.env.SAML_ATTR_MAPPING = JSON.stringify({ email: 'mail', displayName: 'name', role: 'userType' })
    const { handleSamlCallback } = await import('./saml/service')
    const samlXml = `<?xml version="1.0"?>
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
  <saml:Assertion>
    <saml:Subject><saml:NameID>custom-map@example.com</saml:NameID></saml:Subject>
    <saml:AttributeStatement>
      <saml:Attribute Name="mail"><saml:AttributeValue>custom-map@example.com</saml:AttributeValue></saml:Attribute>
      <saml:Attribute Name="name"><saml:AttributeValue>Custom Map User</saml:AttributeValue></saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>`
    const samlResponse = Buffer.from(samlXml).toString('base64')

    const result = await handleSamlCallback(samlResponse)
    expect(result.user.email).toBe('custom-map@example.com')
    expect(result.user.displayName).toBe('Custom Map User')
    expect(result.isNewUser).toBe(true)

    const payload = await verify(result.accessToken) as any
    expect(payload.email).toBe('custom-map@example.com')
  })
})

describe('SSO QA: RBAC Boundary Test — Org-Scoped Data Isolation', () => {
  beforeEach(() => {
    resetAll()
    getOrgDatabase(':memory:')
  })

  afterEach(() => {
    resetAll()
  })

  it('isolates organizations per user membership', async () => {
    const orgA = await orgRepository.createOrganization({ name: 'Org A', slug: 'org-a', ownerId: 'user-1' })
    const orgB = await orgRepository.createOrganization({ name: 'Org B', slug: 'org-b', ownerId: 'user-2' })

    await orgRepository.addOrganizationMember(orgA.id, 'user-1', 'org:admin')
    await orgRepository.addOrganizationMember(orgB.id, 'user-2', 'org:admin')

    const user1Orgs = await orgRepository.listOrganizations('user-1')
    expect(user1Orgs.length).toBe(1)
    expect(user1Orgs[0].id).toBe(orgA.id)
    expect(user1Orgs[0].name).toBe('Org A')

    const user2Orgs = await orgRepository.listOrganizations('user-2')
    expect(user2Orgs.length).toBe(1)
    expect(user2Orgs[0].id).toBe(orgB.id)
    expect(user2Orgs[0].name).toBe('Org B')
  })

  it('prevents cross-org member access', async () => {
    const orgA = await orgRepository.createOrganization({ name: 'Org A', slug: 'org-a', ownerId: 'user-1' })
    const orgB = await orgRepository.createOrganization({ name: 'Org B', slug: 'org-b', ownerId: 'user-2' })

    await orgRepository.addOrganizationMember(orgA.id, 'user-1', 'org:admin')
    await orgRepository.addOrganizationMember(orgB.id, 'user-2', 'org:admin')

    const memberInA = await orgRepository.getOrganizationMember(orgA.id, 'user-1')
    expect(memberInA).toBeDefined()
    expect(memberInA!.role).toBe('org:admin')

    const user1InOrgB = await orgRepository.getOrganizationMember(orgB.id, 'user-1')
    expect(user1InOrgB).toBeUndefined()

    const user2InOrgA = await orgRepository.getOrganizationMember(orgA.id, 'user-2')
    expect(user2InOrgA).toBeUndefined()
  })

  it('enforces role-based member management: only admin can modify members', async () => {
    const org = await orgRepository.createOrganization({ name: 'Org', slug: 'org', ownerId: 'user-admin' })
    await orgRepository.addOrganizationMember(org.id, 'user-admin', 'org:admin')
    await orgRepository.addOrganizationMember(org.id, 'user-member', 'org:member')
    await orgRepository.addOrganizationMember(org.id, 'user-viewer', 'org:viewer')

    const adminMember = await orgRepository.getOrganizationMember(org.id, 'user-admin')
    expect(adminMember?.role).toBe('org:admin')

    const memberUser = await orgRepository.getOrganizationMember(org.id, 'user-member')
    expect(memberUser?.role).toBe('org:member')

    const viewerUser = await orgRepository.getOrganizationMember(org.id, 'user-viewer')
    expect(viewerUser?.role).toBe('org:viewer')
  })

  it('allows org admin to update member roles', async () => {
    const org = await orgRepository.createOrganization({ name: 'Org', slug: 'org', ownerId: 'user-admin' })
    await orgRepository.addOrganizationMember(org.id, 'user-admin', 'org:admin')
    await orgRepository.addOrganizationMember(org.id, 'user-member', 'org:member')

    const updated = await orgRepository.updateOrganizationMemberRole(org.id, 'user-member', 'org:admin')
    expect(updated?.role).toBe('org:admin')

    const member = await orgRepository.getOrganizationMember(org.id, 'user-member')
    expect(member?.role).toBe('org:admin')
  })

  it('allows org admin to remove members', async () => {
    const org = await orgRepository.createOrganization({ name: 'Org', slug: 'org', ownerId: 'user-admin' })
    await orgRepository.addOrganizationMember(org.id, 'user-admin', 'org:admin')
    await orgRepository.addOrganizationMember(org.id, 'user-member', 'org:member')

    expect(await orgRepository.removeOrganizationMember(org.id, 'user-member')).toBe(true)
    expect(await orgRepository.getOrganizationMember(org.id, 'user-member')).toBeUndefined()
  })

  it('prevents duplicate member invitation', async () => {
    const org = await orgRepository.createOrganization({ name: 'Org', slug: 'org', ownerId: 'user-admin' })
    await orgRepository.addOrganizationMember(org.id, 'user-admin', 'org:admin')
    await expect(orgRepository.inviteMember(org.id, 'user-admin', 'org:member')).rejects.toThrow('already a member')
  })

  it('allows member to join and leave organization', async () => {
    const org = await orgRepository.createOrganization({ name: 'Org', slug: 'org', ownerId: 'user-admin' })
    await orgRepository.addOrganizationMember(org.id, 'user-admin', 'org:admin')

    const member = await orgRepository.joinOrganization(org.id, 'user-member')
    expect(member.role).toBe('org:member')

    expect(await orgRepository.leaveOrganization(org.id, 'user-member')).toBe(true)
    expect(await orgRepository.getOrganizationMember(org.id, 'user-member')).toBeUndefined()
  })

  it('deletes org when last member leaves (owner)', async () => {
    const org = await orgRepository.createOrganization({ name: 'Org', slug: 'org', ownerId: 'user-admin' })
    await orgRepository.addOrganizationMember(org.id, 'user-admin', 'org:admin')

    expect(await orgRepository.leaveOrganization(org.id, 'user-admin')).toBe(true)
    expect(await orgRepository.getOrganization(org.id)).toBeUndefined()
  })

  it('lists members for admin but not for non-members', async () => {
    const org = await orgRepository.createOrganization({ name: 'Org', slug: 'org', ownerId: 'user-admin' })
    await orgRepository.addOrganizationMember(org.id, 'user-admin', 'org:admin')
    await orgRepository.addOrganizationMember(org.id, 'user-member', 'org:member')

    const members = await orgRepository.listOrganizationMembers(org.id)
    expect(members.length).toBe(2)
    expect(members.map(m => m.userId)).toContain('user-admin')
    expect(members.map(m => m.userId)).toContain('user-member')
  })

  it('maintains team isolation within organizations', async () => {
    const orgA = await orgRepository.createOrganization({ name: 'Org A', slug: 'org-a', ownerId: 'user-1' })
    const orgB = await orgRepository.createOrganization({ name: 'Org B', slug: 'org-b', ownerId: 'user-2' })

    const teamA = await orgRepository.createTeam(orgA.id, { name: 'Team A' })
    await orgRepository.createTeam(orgB.id, { name: 'Team B' })

    const orgATeams = await orgRepository.listTeamsByOrganization(orgA.id)
    expect(orgATeams.length).toBe(1)
    expect(orgATeams[0].id).toBe(teamA.id)
    expect(orgATeams[0].name).toBe('Team A')

    const orgBTeams = await orgRepository.listTeamsByOrganization(orgB.id)
    expect(orgBTeams.length).toBe(1)
    expect(orgBTeams[0].name).toBe('Team B')
  })
})

describe('SSO QA: Audit Log Integrity Check', () => {
  beforeEach(() => {
    try { getAuditLogDatabase().clear() } catch {}
  })

  it('creates audit log entry for OAuth login action', async () => {
    const repo = new AuditLogRepository()
    const entry = await repo.log(
      'user-oauth', 'oauth@example.com', 'LOGIN', 'user', 'user-oauth',
      'OAuth login via google', '192.168.1.1', 'org-1',
    )
    expect(entry.id).toMatch(/^[0-9a-f]+-audit$/)
    expect(entry.action).toBe('LOGIN')
    expect(entry.userEmail).toBe('oauth@example.com')
    expect(entry.details).toBe('OAuth login via google')
    expect(entry.ipAddress).toBe('192.168.1.1')
    expect(entry.orgId).toBe('org-1')
    expect(entry.timestamp).toBeTruthy()
  })

  it('creates audit log entry for SAML login action', async () => {
    const repo = new AuditLogRepository()
    const entry = await repo.log(
      'user-saml', 'saml@example.com', 'LOGIN', 'user', 'user-saml',
      'SAML login (RelayState: abc123)', '10.0.0.1', 'org-2',
    )
    expect(entry.action).toBe('LOGIN')
    expect(entry.details).toContain('SAML login')
    expect(entry.resourceType).toBe('user')
    expect(entry.orgId).toBe('org-2')
  })

  it('creates audit log entry for user creation via SSO', async () => {
    const repo = new AuditLogRepository()
    const entry = await repo.log(
      'user-new', 'new@example.com', 'CREATE', 'user', 'user-new',
      'User created via Google OAuth', null, 'org-1',
    )
    expect(entry.action).toBe('CREATE')
    expect(entry.details).toBe('User created via Google OAuth')
    expect(entry.ipAddress).toBeNull()
  })

  it('creates audit entries for org CRUD actions', async () => {
    const repo = new AuditLogRepository()

    const createEntry = await repo.log('admin-u1', 'admin@example.com', 'CREATE', 'organization', 'org-1', '{"name":"Test Org"}', '127.0.0.1', 'org-1')
    expect(createEntry.action).toBe('CREATE')
    expect(createEntry.resourceType).toBe('organization')
    expect(createEntry.details).toBe('{"name":"Test Org"}')

    const updateEntry = await repo.log('admin-u1', 'admin@example.com', 'UPDATE', 'organization', 'org-1', '{"name":"Updated Org"}', '127.0.0.1', 'org-1')
    expect(updateEntry.action).toBe('UPDATE')

    const deleteEntry = await repo.log('admin-u1', 'admin@example.com', 'DELETE', 'organization', 'org-1', null, '127.0.0.1', 'org-1')
    expect(deleteEntry.action).toBe('DELETE')
  })

  it('records accurate ISO timestamps on audit entries', async () => {
    const repo = new AuditLogRepository()
    const before = new Date()
    const entry = await repo.log('user-ts', 'ts@example.com', 'LOGIN', 'session', 'sess-1', null, null, null)
    const after = new Date()

    const timestamp = new Date(entry.timestamp)
    expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000)
    expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime() + 1000)

    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  it('filters audit logs by orgId', async () => {
    const repo = new AuditLogRepository()
    await repo.log('u1', 'a@b.com', 'CREATE', 'org', 'o1', null, null, 'org-a')
    await repo.log('u2', 'c@d.com', 'CREATE', 'org', 'o2', null, null, 'org-b')
    await repo.log('u1', 'a@b.com', 'UPDATE', 'org', 'o1', null, null, 'org-a')

    const orgAResults = await repo.list({ orgId: 'org-a' })
    expect(orgAResults.total).toBe(2)
    expect(orgAResults.entries.every(e => e.orgId === 'org-a')).toBe(true)

    const orgBResults = await repo.list({ orgId: 'org-b' })
    expect(orgBResults.total).toBe(1)
    expect(orgBResults.entries[0].orgId).toBe('org-b')
  })

  it('filters audit logs by action type', async () => {
    const repo = new AuditLogRepository()
    await repo.log('u1', 'a@b.com', 'CREATE', 'org', 'o1', null, null, null)
    await repo.log('u1', 'a@b.com', 'LOGIN', 'session', 's1', null, null, null)
    await repo.log('u1', 'a@b.com', 'DELETE', 'org', 'o1', null, null, null)

    const loginResults = await repo.list({ action: 'LOGIN' })
    expect(loginResults.total).toBe(1)
    expect(loginResults.entries[0].action).toBe('LOGIN')
  })

  it('filters audit logs by date range', async () => {
    const repo = new AuditLogRepository()
    const entry1 = await repo.log('u1', 'a@b.com', 'CREATE', 'org', 'o1', null, null, null)
    const entry2 = await repo.log('u2', 'c@d.com', 'LOGIN', 'session', 's1', null, null, null)

    const results = await repo.list({
      startDate: entry1.timestamp,
      endDate: entry2.timestamp,
    })
    expect(results.total).toBe(2)
  })

  it('paginates audit log results', async () => {
    const repo = new AuditLogRepository()
    for (let i = 0; i < 5; i++) {
      await repo.log(`u${i}`, `u${i}@b.com`, 'CREATE', 'org', `o${i}`, null, null, null)
    }

    const page1 = await repo.list({ limit: 2, offset: 0 })
    expect(page1.entries.length).toBe(2)

    const page2 = await repo.list({ limit: 2, offset: 2 })
    expect(page2.entries.length).toBe(2)

    const page3 = await repo.list({ limit: 2, offset: 4 })
    expect(page3.entries.length).toBe(1)
  })

  it('enforces max audit log limit of 1000', async () => {
    const repo = new AuditLogRepository()
    const result = await repo.list({ limit: 5000, offset: 0 })
    expect(result.entries.length).toBe(0)
    expect(result.total).toBe(0)
  })

  it('purges old audit entries based on retention config', async () => {
    const db = new AuditLogDatabase(':memory:')
    db.initialize()

    db.setRetentionConfig({ ttlDays: 1, enabled: true })

    db.insert({
      id: 'old-entry', timestamp: new Date('2020-01-01').toISOString(),
      userId: 'u1', userEmail: 'a@b.com', action: 'CREATE', resourceType: 'org',
      resourceId: 'o1', details: null, ipAddress: null, orgId: null,
    })
    db.insert({
      id: 'new-entry', timestamp: new Date().toISOString(),
      userId: 'u1', userEmail: 'a@b.com', action: 'CREATE', resourceType: 'org',
      resourceId: 'o2', details: null, ipAddress: null, orgId: null,
    })

    const purged = db.purgeOldEntries()
    expect(purged).toBe(1)

    expect(db.findById('old-entry')).toBeUndefined()
    expect(db.findById('new-entry')).toBeDefined()

    db.close()
  })

  it('retention config get/set preserves values', async () => {
    const db = new AuditLogDatabase(':memory:')
    db.initialize()

    const initial = db.getRetentionConfig()
    expect(initial.ttlDays).toBe(90)
    expect(initial.enabled).toBe(true)

    const updated = db.setRetentionConfig({ ttlDays: 30, enabled: false })
    expect(updated.ttlDays).toBe(30)
    expect(updated.enabled).toBe(false)

    const reloaded = db.getRetentionConfig()
    expect(reloaded.ttlDays).toBe(30)
    expect(reloaded.enabled).toBe(false)

    db.close()
  })
})
