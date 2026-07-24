import { randomBytes } from 'node:crypto'
import { getAuthDatabase } from '../database'
import { registerUser, getCurrentUser, generateAccessTokenPayload, AppError } from '../service'
import { sign } from '../jwt'

interface OAuthProviderConfig {
  clientId: string
  clientSecret: string
  authorizeUrl: string
  tokenUrl: string
  userInfoUrl: string
  scope: string
}

type ProviderName = 'google' | 'github'

const ACCESS_TOKEN_EXPIRY = '15m'

const PROVIDER_META: Record<ProviderName, Omit<OAuthProviderConfig, 'clientId' | 'clientSecret'>> = {
  google: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scope: 'openid email profile',
  },
  github: {
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scope: 'read:user user:email',
  },
}

function getCallbackUrl(provider: ProviderName): string {
  const baseUrl = process.env.OAUTH_CALLBACK_URL || 'http://localhost:3001'
  return `${baseUrl}/api/auth/oauth/${provider}/callback`
}

function getProviderConfig(provider: string): OAuthProviderConfig {
  const meta = PROVIDER_META[provider as ProviderName]
  if (!meta) {
    throw new AppError(`Unsupported OAuth provider: ${provider}`, 400)
  }
  const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`] || ''
  const clientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`] || ''
  if (!clientId || !clientSecret) {
    throw new AppError(`OAuth provider '${provider}' is not configured. Set ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET environment variables.`, 500)
  }
  return { clientId, clientSecret, ...meta }
}

export function getAuthorizationUrl(provider: string): { url: string; state: string } {
  const config = getProviderConfig(provider)
  const state = randomBytes(16).toString('hex')
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: getCallbackUrl(provider as ProviderName),
    response_type: 'code',
    scope: config.scope,
    state,
  })
  return { url: `${config.authorizeUrl}?${params.toString()}`, state }
}

export async function handleOAuthCallback(
  provider: string,
  code: string,
): Promise<{ user: any; accessToken: string; refreshToken: string; isNewUser: boolean }> {
  const config = getProviderConfig(provider)
  const db = getAuthDatabase()

  const tokenResponse = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: getCallbackUrl(provider as ProviderName),
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text()
    throw new AppError(`OAuth token exchange failed: ${errorBody}`, 401)
  }

  const tokenData: any = await tokenResponse.json()

  if (tokenData.error) {
    throw new AppError(`OAuth error: ${tokenData.error}`, 401)
  }

  const accessToken = tokenData.access_token
  if (!accessToken) {
    throw new AppError('No access token in OAuth response', 401)
  }

  const userInfoResponse = await fetch(config.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })

  if (!userInfoResponse.ok) {
    throw new AppError('Failed to fetch OAuth user info', 401)
  }

  const userInfo: any = await userInfoResponse.json()

  let providerUserId: string
  let email: string
  let displayName: string | null
  let avatarUrl: string | null

  if (provider === 'google') {
    providerUserId = userInfo.id
    email = userInfo.email
    displayName = userInfo.name || null
    avatarUrl = userInfo.picture || null
  } else if (provider === 'github') {
    providerUserId = String(userInfo.id)
    email = userInfo.email || await fetchGitHubPrimaryEmail(accessToken)
    displayName = userInfo.name || userInfo.login || null
    avatarUrl = userInfo.avatar_url || null
  } else {
    throw new AppError(`Unsupported provider: ${provider}`, 400)
  }

  if (!email) {
    throw new AppError(`Email not provided by ${provider}. Ensure email scope is granted.`, 400)
  }

  const existingAccount = db.findOAuthAccount(provider, providerUserId)

  if (existingAccount) {
    const user = getCurrentUser(existingAccount.user_id)
    if (!user) {
      throw new AppError('Linked user not found', 404)
    }
    const jwt = await sign(generateAccessTokenPayload(user), { expiresIn: ACCESS_TOKEN_EXPIRY })
    return { user, accessToken: jwt, refreshToken: '', isNewUser: false }
  }

  const existingUser = db.findUserByEmail(email)
  let userId: string

  if (existingUser) {
    userId = existingUser.id
    db.createOAuthAccount({
      id: randomBytes(12).toString('hex'),
      provider,
      providerUserId,
      userId,
      email,
      displayName,
      avatarUrl,
    })
    const user = getCurrentUser(userId)!
    const jwt = await sign(generateAccessTokenPayload(user), { expiresIn: ACCESS_TOKEN_EXPIRY })
    return { user, accessToken: jwt, refreshToken: '', isNewUser: false }
  }

  const result = await registerUser(email, randomBytes(24).toString('hex'), displayName || undefined)
  userId = result.user.id

  db.createOAuthAccount({
    id: randomBytes(12).toString('hex'),
    provider,
    providerUserId,
    userId,
    email,
    displayName,
    avatarUrl,
  })

  const user = getCurrentUser(userId)!
  const jwt = await sign(generateAccessTokenPayload(user), { expiresIn: ACCESS_TOKEN_EXPIRY })
  return { user, accessToken: jwt, refreshToken: '', isNewUser: true }
}

async function fetchGitHubPrimaryEmail(accessToken: string): Promise<string> {
  const res = await fetch('https://api.github.com/user/emails', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) return ''
  const emails: any[] = await res.json()
  const primary = emails.find(e => e.primary && e.verified)
  return primary?.email || emails[0]?.email || ''
}
