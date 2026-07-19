import { randomBytes } from 'node:crypto'
import { getAuthDatabase } from '../database'
import { registerUser, getCurrentUser, generateAccessTokenPayload, AppError } from '../service'
import { sign } from '../jwt'

const ACCESS_TOKEN_EXPIRY = '15m'

export interface SamlConfig {
  spEntityId: string
  acsUrl: string
  idpEntityId: string
  idpSsoUrl: string
  idpCert: string
  attrMapping: Record<string, string>
}

function getSamlConfig(): SamlConfig {
  const baseUrl = process.env.SAML_ACS_URL || process.env.OAUTH_CALLBACK_URL || 'http://localhost:3001'
  return {
    spEntityId: process.env.SAML_SP_ENTITY_ID || 'nexus-engineering',
    acsUrl: process.env.SAML_ACS_URL || `${baseUrl}/api/auth/saml/callback`,
    idpEntityId: process.env.SAML_IDP_ENTITY_ID || '',
    idpSsoUrl: process.env.SAML_IDP_SSO_URL || '',
    idpCert: process.env.SAML_IDP_CERT || '',
    attrMapping: parseAttrMapping(process.env.SAML_ATTR_MAPPING),
  }
}

function parseAttrMapping(raw?: string): Record<string, string> {
  if (!raw) {
    return { email: 'email', displayName: 'displayName', role: 'role' }
  }
  try {
    return JSON.parse(raw)
  } catch {
    return { email: 'email', displayName: 'displayName', role: 'role' }
  }
}

export function generateMetadataXml(): string {
  const config = getSamlConfig()
  const now = new Date().toISOString().slice(0, 19) + 'Z'
  const entityId = escapeXml(config.spEntityId)
  const acsUrl = escapeXml(config.acsUrl)

  return `<?xml version="1.0"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${entityId}" validUntil="${now}">
  <md:SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol" AuthnRequestsSigned="false" WantAssertionsSigned="true">
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${acsUrl}" index="0" isDefault="true"/>
  </md:SPSSODescriptor>
</md:EntityDescriptor>`
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function decodeBase64(str: string): string {
  return Buffer.from(str, 'base64').toString('utf-8')
}

function extractXmlContent(xml: string, tagName: string): string {
  const regex = new RegExp(`<[^:]*:${tagName}[^>]*>([^<]*)<\\/[^:]*:${tagName}>`, 'i')
  const match = xml.match(regex)
  return match ? match[1].trim() : ''
}

function extractAttributeValue(xml: string, attributeName: string): string {
  const regex = new RegExp(`<[^:]*:Attribute[^>]*Name=["']${attributeName}["'][^>]*>\\s*<[^:]*:AttributeValue[^>]*>([^<]*)<\\/[^:]*:AttributeValue>`, 'i')
  const match = xml.match(regex)
  if (match) return match[1].trim()

  const regex2 = new RegExp(`<[^:]*:Attribute[^>]*Name=["']?${attributeName}["']?[^>]*>\\s*<[^:]*:AttributeValue[^>]*>([^<]*)<\\/[^:]*:AttributeValue>`, 'i')
  const match2 = xml.match(regex2)
  return match2 ? match2[1].trim() : ''
}

interface SamlAttributes {
  email: string
  displayName: string | null
  role: string | null
}

function parseSamlResponse(samlResponse: string): SamlAttributes {
  const decoded = decodeBase64(samlResponse)
  const config = getSamlConfig()

  if (config.idpCert) {
    validateSignature(decoded, config.idpCert)
  }

  const emailAttr = config.attrMapping.email || 'email'
  const nameAttr = config.attrMapping.displayName || 'displayName'
  const roleAttr = config.attrMapping.role || 'role'

  const subject = extractXmlContent(decoded, 'NameID')
  const email = extractAttributeValue(decoded, emailAttr) || subject
  const displayName = extractAttributeValue(decoded, nameAttr) || null
  const role = extractAttributeValue(decoded, roleAttr) || null

  if (!email) {
    throw new AppError('SAML assertion did not contain an email attribute', 400)
  }

  return { email, displayName: displayName || null, role }
}

function validateSignature(_xml: string, _certPem: string): void {
  // In production, this would verify the XML signature using the IdP's certificate.
  // For now, we accept the assertion as-is when no cert is configured.
  // TODO: Implement XML signature verification with xml-crypto or similar.
}

export async function handleSamlCallback(samlResponse: string): Promise<{ user: any; accessToken: string; refreshToken: string; isNewUser: boolean }> {
  const db = getAuthDatabase()
  const attributes = parseSamlResponse(samlResponse)

  const existingUser = db.findUserByEmail(attributes.email)
  let userId: string

  if (existingUser) {
    userId = existingUser.id
    const user = getCurrentUser(userId)!
    const jwt = await sign(generateAccessTokenPayload(user), { expiresIn: ACCESS_TOKEN_EXPIRY })
    return { user, accessToken: jwt, refreshToken: '', isNewUser: false }
  }

  const result = await registerUser(attributes.email, randomBytes(24).toString('hex'), attributes.displayName || undefined)
  userId = result.user.id

  if (attributes.role) {
    const role = db.findRoleByName(attributes.role.toLowerCase())
    if (role) {
      db.updateUser(userId, { roleId: role.id })
    }
  }

  const user = getCurrentUser(userId)!
  const jwt = await sign(generateAccessTokenPayload(user), { expiresIn: ACCESS_TOKEN_EXPIRY })
  return { user, accessToken: jwt, refreshToken: '', isNewUser: true }
}
