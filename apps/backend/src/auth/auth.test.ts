import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getAuthDatabase, AuthDatabase } from './database'
import { registerUser, loginUser, refreshUserTokens, logoutUser, getCurrentUser, AppError } from './service'

process.env.JWT_SECRET = 'test-secret-do-not-use'

function freshDb(): AuthDatabase {
  const db = new AuthDatabase(':memory:')
  db.initialize()
  return db
}

describe('AuthDatabase', () => {
  it('creates and finds a user', () => {
    const db = freshDb()
    const user = db.createUser({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hash123',
      displayName: 'Test User',
      roleId: 'role_viewer',
    })
    expect(user.email).toBe('test@example.com')
    expect(user.display_name).toBe('Test User')

    const found = db.findUserByEmail('test@example.com')
    expect(found?.id).toBe('user-1')
    db.close()
  })

  it('seeds default roles and permissions', () => {
    const db = freshDb()
    const roles = db.listRoles()
    expect(roles.length).toBe(4)
    expect(roles.map(r => r.name)).toContain('admin')
    expect(roles.map(r => r.name)).toContain('viewer')

    const perms = db.getPermissionsForRole('role_admin')
    expect(perms.length).toBeGreaterThan(0)
    expect(perms.map(p => p.name)).toContain('admin:all')
    db.close()
  })

  it('prevents duplicate email', () => {
    const db = freshDb()
    db.createUser({
      id: 'user-1',
      email: 'dup@example.com',
      passwordHash: 'hash1',
      displayName: null,
      roleId: 'role_viewer',
    })
    expect(() => {
      db.createUser({
        id: 'user-2',
        email: 'dup@example.com',
        passwordHash: 'hash2',
        displayName: null,
        roleId: 'role_viewer',
      })
    }).toThrow()
    db.close()
  })

  it('stores and finds refresh tokens', () => {
    const db = freshDb()
    db.createUser({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hash',
      displayName: null,
      roleId: 'role_viewer',
    })
    db.storeRefreshToken({
      id: 'rt-1',
      userId: 'user-1',
      tokenHash: 'tokenhash123',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    })
    const found = db.findRefreshTokenByHash('tokenhash123')
    expect(found?.user_id).toBe('user-1')
    expect(found?.revoked).toBe(0)

    db.revokeRefreshToken('rt-1')
    const revoked = db.findRefreshTokenByHash('tokenhash123')
    expect(revoked).toBeUndefined()
    db.close()
  })

  it('updates user fields', () => {
    const db = freshDb()
    db.createUser({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hash',
      displayName: 'Old Name',
      roleId: 'role_viewer',
    })
    const updated = db.updateUser('user-1', { displayName: 'New Name' })
    expect(updated).toBe(true)
    const user = db.findUserById('user-1')
    expect(user?.display_name).toBe('New Name')
    db.close()
  })
})

describe('AuthService', () => {
  it('registers a new user', async () => {
    const result = await registerUser('newuser@example.com', 'password123', 'New User')
    expect(result.user.email).toBe('newuser@example.com')
    expect(result.user.roleName).toBe('viewer')
    expect(result.accessToken).toBeTruthy()
    expect(result.refreshToken).toBeTruthy()
  })

  it('rejects duplicate registration', async () => {
    await registerUser('dup@example.com', 'password123')
    await expect(registerUser('dup@example.com', 'password123')).rejects.toThrow(AppError)
  })

  it('rejects short passwords', async () => {
    await expect(registerUser('short@example.com', '1234567')).rejects.toThrow('Password must be at least 8 characters')
  })

  it('rejects invalid emails', async () => {
    await expect(registerUser('notanemail', 'password123')).rejects.toThrow('Invalid email format')
  })

  it('logs in a registered user', async () => {
    await registerUser('login@example.com', 'password123')
    const result = await loginUser('login@example.com', 'password123')
    expect(result.user.email).toBe('login@example.com')
    expect(result.accessToken).toBeTruthy()
    expect(result.refreshToken).toBeTruthy()
  })

  it('rejects invalid password', async () => {
    await registerUser('badpw@example.com', 'password123')
    await expect(loginUser('badpw@example.com', 'wrongpassword')).rejects.toThrow(AppError)
  })

  it('rejects nonexistent email', async () => {
    await expect(loginUser('nobody@example.com', 'password123')).rejects.toThrow(AppError)
  })

  it('refreshes tokens', async () => {
    const registered = await registerUser('refresh@example.com', 'password123')
    const result = await refreshUserTokens(registered.refreshToken)
    expect(result.user.email).toBe('refresh@example.com')
    expect(result.accessToken).toBeTruthy()
    expect(result.refreshToken).toBeTruthy()
    expect(result.refreshToken).not.toBe(registered.refreshToken)
  })

  it('rejects invalid refresh token', async () => {
    await expect(refreshUserTokens('invalidtoken')).rejects.toThrow(AppError)
  })

  it('logs out a user (revokes refresh token)', async () => {
    const registered = await registerUser('logout@example.com', 'password123')
    await logoutUser(registered.refreshToken)
    await expect(refreshUserTokens(registered.refreshToken)).rejects.toThrow(AppError)
  })

  it('gets current user by id', async () => {
    const registered = await registerUser('me@example.com', 'password123')
    const user = getCurrentUser(registered.user.id)
    expect(user).not.toBeNull()
    expect(user!.email).toBe('me@example.com')
  })

  it('returns null for nonexistent user', () => {
    const user = getCurrentUser('nonexistent-id')
    expect(user).toBeNull()
  })
})

describe('OAuthService', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
    process.env.GITHUB_CLIENT_ID = 'test-github-client-id'
    process.env.GITHUB_CLIENT_SECRET = 'test-github-client-secret'
    process.env.OAUTH_CALLBACK_URL = 'http://localhost:3001'
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  it('generates authorization URL for Google', async () => {
    const { getAuthorizationUrl } = await import('./oauth/service')
    const result = getAuthorizationUrl('google')
    expect(result.url).toContain('https://accounts.google.com/o/oauth2/v2/auth')
    expect(result.url).toContain('client_id=test-google-client-id')
    expect(result.url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Foauth%2Fgoogle%2Fcallback')
    expect(result.state).toBeTruthy()
  })

  it('generates authorization URL for GitHub', async () => {
    const { getAuthorizationUrl } = await import('./oauth/service')
    const result = getAuthorizationUrl('github')
    expect(result.url).toContain('https://github.com/login/oauth/authorize')
    expect(result.url).toContain('client_id=test-github-client-id')
    expect(result.state).toBeTruthy()
  })

  it('throws for unsupported provider', async () => {
    const { getAuthorizationUrl } = await import('./oauth/service')
    expect(() => getAuthorizationUrl('twitter')).toThrow(AppError)
  })

  it('throws for unconfigured provider', async () => {
    process.env.GOOGLE_CLIENT_ID = ''
    const { getAuthorizationUrl } = await import('./oauth/service')
    expect(() => getAuthorizationUrl('google')).toThrow(AppError)
  })

  it('registers OAuth account in database', async () => {
    const db = freshDb()
    const { getAuthDatabase } = await import('./database')
    const authDb = getAuthDatabase()

    const user = authDb.createUser({
      id: 'oauth-user-1',
      email: 'oauth@example.com',
      passwordHash: 'hash',
      displayName: 'OAuth User',
      roleId: 'role_viewer',
    })

    const account = authDb.createOAuthAccount({
      id: 'oa-1',
      provider: 'google',
      providerUserId: 'google-123',
      userId: user.id,
      email: 'oauth@example.com',
      displayName: 'OAuth User',
      avatarUrl: 'https://example.com/avatar.png',
    })

    expect(account.provider).toBe('google')
    expect(account.provider_user_id).toBe('google-123')
    expect(account.user_id).toBe(user.id)

    const found = authDb.findOAuthAccount('google', 'google-123')
    expect(found).toBeDefined()
    expect(found!.user_id).toBe(user.id)
  })

  it('links OAuth account to existing user by email', async () => {
    const { handleOAuthCallback } = await import('./oauth/service')
    const db = getAuthDatabase()
    await registerUser('existing@example.com', 'password123', 'Existing')

    const originalFetch = globalThis.fetch
    globalThis.fetch = async (url: string, options?: any) => {
      if (url.includes('oauth2.googleapis.com/token') || url.includes('github.com/login/oauth/access_token')) {
        return new Response(JSON.stringify({ access_token: 'mock-access-token' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }) as any
      }
      if (url.includes('googleapis.com') || url.includes('api.github.com/user/emails')) {
        if (url.includes('/user/emails')) {
          return new Response(JSON.stringify([{ email: 'existing@example.com', primary: true, verified: true }]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }) as any
        }
        return new Response(JSON.stringify({ id: 'google-456', email: 'existing@example.com', name: 'Existing' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }) as any
      }
      if (url.includes('api.github.com/user')) {
        return new Response(JSON.stringify({ id: 789, email: 'existing@example.com', name: 'Existing' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }) as any
      }
      return originalFetch(url, options)
    }

    const result = await handleOAuthCallback('google', 'mock-code')
    expect(result.user.email).toBe('existing@example.com')
    expect(result.isNewUser).toBe(false)

    const account = getAuthDatabase().findOAuthAccount('google', 'google-456')
    expect(account).toBeDefined()
    expect(account!.user_id).toBe(result.user.id)

    globalThis.fetch = originalFetch
  })
})

describe('SAMLService', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
    process.env.SAML_SP_ENTITY_ID = 'nexus-engineering'
    process.env.SAML_ACS_URL = 'http://localhost:3001/api/auth/saml/callback'
    process.env.SAML_ATTR_MAPPING = JSON.stringify({ email: 'email', displayName: 'displayName', role: 'role' })
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  it('generates valid SAML metadata XML', async () => {
    const { generateMetadataXml } = await import('./saml/service')
    const xml = generateMetadataXml()
    expect(xml).toContain('<?xml version="1.0"?>')
    expect(xml).toContain('md:EntityDescriptor')
    expect(xml).toContain('entityID="nexus-engineering"')
    expect(xml).toContain('urn:oasis:names:tc:SAML:2.0:protocol')
    expect(xml).toContain('http://localhost:3001/api/auth/saml/callback')
  })

  it('parses SAML response and extracts attributes', async () => {
    const { handleSamlCallback } = await import('./saml/service')

    const samlXml = `<?xml version="1.0"?>
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
  <saml:Assertion>
    <saml:Subject>
      <saml:NameID>john@example.com</saml:NameID>
    </saml:Subject>
    <saml:AttributeStatement>
      <saml:Attribute Name="email">
        <saml:AttributeValue>john@example.com</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="displayName">
        <saml:AttributeValue>John Doe</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="role">
        <saml:AttributeValue>developer</saml:AttributeValue>
      </saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>`

    const samlResponse = Buffer.from(samlXml).toString('base64')

    const result = await handleSamlCallback(samlResponse)
    expect(result.user.email).toBe('john@example.com')
    expect(result.isNewUser).toBe(true)
    expect(result.accessToken).toBeTruthy()
  })

  it('links SAML user to existing account by email', async () => {
    const { handleSamlCallback } = await import('./saml/service')
    await registerUser('saml-existing@example.com', 'password123', 'Existing SAML')

    const samlXml = `<?xml version="1.0"?>
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
  <saml:Assertion>
    <saml:Subject>
      <saml:NameID>saml-existing@example.com</saml:NameID>
    </saml:Subject>
    <saml:AttributeStatement>
      <saml:Attribute Name="email">
        <saml:AttributeValue>saml-existing@example.com</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="displayName">
        <saml:AttributeValue>Existing SAML</saml:AttributeValue>
      </saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>`

    const samlResponse = Buffer.from(samlXml).toString('base64')
    const result = await handleSamlCallback(samlResponse)
    expect(result.user.email).toBe('saml-existing@example.com')
    expect(result.isNewUser).toBe(false)
  })

  it('rejects SAML response without email', async () => {
    const { handleSamlCallback } = await import('./saml/service')

    const samlXml = `<?xml version="1.0"?>
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
  <saml:Assertion>
    <saml:Subject>
      <saml:NameID></saml:NameID>
    </saml:Subject>
  </saml:Assertion>
</samlp:Response>`

    const samlResponse = Buffer.from(samlXml).toString('base64')
    await expect(handleSamlCallback(samlResponse)).rejects.toThrow(AppError)
  })
})
