import { createSign, createVerify, generateKeyPairSync, randomBytes } from 'node:crypto'

const ALGORITHM = 'RS256'
const ACCESS_TOKEN_EXPIRY_MS = 15 * 60 * 1000

interface KeyPair {
  privateKey: string
  publicKey: string
}

let keyPair: KeyPair | null = null

function getKeyPair(): KeyPair {
  if (!keyPair) {
    if (process.env.JWT_PRIVATE_KEY && process.env.JWT_PUBLIC_KEY) {
      keyPair = {
        privateKey: process.env.JWT_PRIVATE_KEY,
        publicKey: process.env.JWT_PUBLIC_KEY,
      }
    } else {
      const keys = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      })
      keyPair = { privateKey: keys.privateKey, publicKey: keys.publicKey }
    }
  }
  return keyPair
}

function base64UrlEncode(data: Buffer): string {
  return data.toString('base64url')
}

function base64UrlDecode(str: string): Buffer {
  return Buffer.from(str, 'base64url')
}

export function sign(payload: Record<string, unknown>, options?: { expiresIn?: string }): Promise<string> {
  const { privateKey } = getKeyPair()

  const header = { alg: ALGORITHM, typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)

  let exp: number
  if (options?.expiresIn) {
    const match = options.expiresIn.match(/^(\d+)([smhd])$/)
    if (match) {
      const num = parseInt(match[1])
      const unit = match[2]
      const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 }
      exp = now + num * (multipliers[unit] || 60)
    } else {
      exp = now + Math.floor(ACCESS_TOKEN_EXPIRY_MS / 1000)
    }
  } else {
    exp = now + Math.floor(ACCESS_TOKEN_EXPIRY_MS / 1000)
  }

  const jwtPayload = { ...payload, iat: now, exp, jti: randomBytes(8).toString('hex') }

  const headerStr = base64UrlEncode(Buffer.from(JSON.stringify(header)))
  const payloadStr = base64UrlEncode(Buffer.from(JSON.stringify(jwtPayload)))
  const dataToSign = `${headerStr}.${payloadStr}`

  const signer = createSign('RSA-SHA256')
  signer.update(dataToSign)
  const signature = base64UrlEncode(signer.sign(privateKey))

  return Promise.resolve(`${dataToSign}.${signature}`)
}

export function verify(token: string): Promise<Record<string, unknown>> {
  const { publicKey } = getKeyPair()

  const parts = token.split('.')
  if (parts.length !== 3) {
    return Promise.reject(new Error('Invalid token format'))
  }

  const [headerStr, payloadStr, signatureStr] = parts

  try {
    const verifier = createVerify('RSA-SHA256')
    verifier.update(`${headerStr}.${payloadStr}`)
    const isValid = verifier.verify(publicKey, base64UrlDecode(signatureStr))

    if (!isValid) {
      return Promise.reject(new Error('Invalid token signature'))
    }

    const payload = JSON.parse(base64UrlDecode(payloadStr).toString())

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return Promise.reject(new Error('Token expired'))
    }

    return Promise.resolve(payload)
  } catch (err) {
    return Promise.reject(new Error(`Token verification failed: ${(err as Error).message}`))
  }
}
