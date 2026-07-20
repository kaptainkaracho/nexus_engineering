import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { artifactRegistry } from '../artifacts/repository'
import { OrgDatabase, getOrgDatabase, resetOrgDatabase } from './database'
import { resetOrgStore } from './store'
import { orgRepository } from './repository'

function resetAll() {
  resetOrgDatabase()
  resetOrgStore()
}

function freshDb(): OrgDatabase {
  const db = new OrgDatabase(':memory:')
  db.initialize()
  return db
}

describe('OrgDatabase', () => {
  afterEach(() => {
    resetAll()
  })

  it('creates and finds an organization', () => {
    const db = freshDb()
    const org = db.insertOrganization({
      id: 'org-1',
      name: 'Test Org',
      slug: 'test-org',
      description: 'A test organization',
      ownerId: 'user-1',
      settings: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    expect(org.name).toBe('Test Org')
    expect(org.slug).toBe('test-org')

    const found = db.findOrganizationById('org-1')
    expect(found?.name).toBe('Test Org')

    const bySlug = db.findOrganizationBySlug('test-org')
    expect(bySlug?.id).toBe('org-1')

    db.close()
  })

  it('finds organization by slug', () => {
    const db = freshDb()
    db.insertOrganization({
      id: 'org-2', name: 'Another Org', slug: 'another-org',
      description: null, ownerId: 'user-1', settings: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    const found = db.findOrganizationBySlug('another-org')
    expect(found?.id).toBe('org-2')
    expect(db.findOrganizationBySlug('nonexistent')).toBeUndefined()
    db.close()
  })

  it('prevents duplicate slug via UNIQUE constraint', () => {
    const db = freshDb()
    db.insertOrganization({
      id: 'org-1', name: 'Org', slug: 'same-slug',
      description: null, ownerId: 'user-1', settings: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    expect(() => {
      db.insertOrganization({
        id: 'org-2', name: 'Org 2', slug: 'same-slug',
        description: null, ownerId: 'user-1', settings: null,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      })
    }).toThrow()
    db.close()
  })

  it('lists organizations', () => {
    const db = freshDb()
    expect(db.listOrganizations().length).toBe(0)
    db.insertOrganization({
      id: 'org-1', name: 'Org A', slug: 'org-a',
      description: null, ownerId: 'user-1', settings: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    db.insertOrganization({
      id: 'org-2', name: 'Org B', slug: 'org-b',
      description: null, ownerId: 'user-2', settings: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    expect(db.listOrganizations().length).toBe(2)
    db.close()
  })

  it('lists organizations for a specific user', () => {
    const db = freshDb()
    db.insertOrganization({
      id: 'org-1', name: 'Org A', slug: 'org-a',
      description: null, ownerId: 'user-1', settings: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    db.insertOrganization({
      id: 'org-2', name: 'Org B', slug: 'org-b',
      description: null, ownerId: 'user-2', settings: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    db.insertOrganizationMember({
      id: 'mem-1', organizationId: 'org-1', userId: 'user-1', role: 'org:admin',
      joinedAt: new Date().toISOString(),
    })
    db.insertOrganizationMember({
      id: 'mem-2', organizationId: 'org-2', userId: 'user-1', role: 'org:member',
      joinedAt: new Date().toISOString(),
    })
    const orgs = db.listOrganizationsForUser('user-1')
    expect(orgs.length).toBe(2)
    expect(orgs.map(o => o.id)).toContain('org-1')
    expect(orgs.map(o => o.id)).toContain('org-2')
    db.close()
  })

  it('updates organization fields', () => {
    const db = freshDb()
    db.insertOrganization({
      id: 'org-1', name: 'Old Name', slug: 'old-slug',
      description: 'Old description', ownerId: 'user-1', settings: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    const updated = db.updateOrganization('org-1', { name: 'New Name', description: 'New description' })
    expect(updated?.name).toBe('New Name')
    expect(updated?.description).toBe('New description')

    const found = db.findOrganizationById('org-1')
    expect(found?.name).toBe('New Name')
    db.close()
  })

  it('deletes organization', () => {
    const db = freshDb()
    db.insertOrganization({
      id: 'org-1', name: 'To Delete', slug: 'to-delete',
      description: null, ownerId: 'user-1', settings: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    expect(db.deleteOrganization('org-1')).toBe(true)
    expect(db.findOrganizationById('org-1')).toBeUndefined()
    expect(db.deleteOrganization('nonexistent')).toBe(false)
    db.close()
  })

  it('cascades delete to teams and members', () => {
    const db = freshDb()
    db.insertOrganization({
      id: 'org-1', name: 'Org', slug: 'org',
      description: null, ownerId: 'user-1', settings: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    db.insertTeam({
      id: 'team-1', name: 'Team', description: null, organizationId: 'org-1',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    db.insertOrganizationMember({
      id: 'mem-1', organizationId: 'org-1', userId: 'user-1', role: 'org:admin',
      joinedAt: new Date().toISOString(),
    })
    db.deleteOrganization('org-1')
    expect(db.findOrganizationById('org-1')).toBeUndefined()
    expect(db.findTeamById('team-1')).toBeUndefined()
    expect(db.listOrganizationMembers('org-1').length).toBe(0)
    db.close()
  })
})

describe('OrgRepository', () => {
  beforeEach(() => {
    resetAll()
    getOrgDatabase(':memory:')
  })

  afterEach(() => {
    resetAll()
  })

  it('creates and retrieves an organization', async () => {
    const org = await orgRepository.createOrganization({
      name: 'My Org',
      slug: 'my-org',
      ownerId: 'user-1',
    })
    expect(org.name).toBe('My Org')
    expect(org.slug).toBe('my-org')
    expect(org.id).toMatch(/^org_/)

    const found = await orgRepository.getOrganization(org.id)
    expect(found?.id).toBe(org.id)
  })

  it('gets organization by slug', async () => {
    await orgRepository.createOrganization({
      name: 'Slug Org', slug: 'slug-org', ownerId: 'user-1',
    })
    const found = await orgRepository.getOrganizationBySlug('slug-org')
    expect(found?.name).toBe('Slug Org')
    expect(await orgRepository.getOrganizationBySlug('nonexistent')).toBeUndefined()
  })

  it('lists all organizations', async () => {
    await orgRepository.createOrganization({ name: 'Org A', slug: 'org-a', ownerId: 'user-1' })
    await orgRepository.createOrganization({ name: 'Org B', slug: 'org-b', ownerId: 'user-2' })
    const orgs = await orgRepository.listOrganizations()
    expect(orgs.length).toBe(2)
  })

  it('lists organizations for a user', async () => {
    const org = await orgRepository.createOrganization({ name: 'Org', slug: 'org', ownerId: 'user-1' })
    await orgRepository.addOrganizationMember(org.id, 'user-1', 'admin')
    const orgs = await orgRepository.listOrganizations('user-1')
    expect(orgs.length).toBe(1)
    expect(orgs[0].id).toBe(org.id)
  })

  it('updates an organization', async () => {
    const org = await orgRepository.createOrganization({ name: 'Old', slug: 'old', ownerId: 'user-1' })
    const updated = await orgRepository.updateOrganization(org.id, { name: 'Updated' })
    expect(updated?.name).toBe('Updated')
    const found = await orgRepository.getOrganization(org.id)
    expect(found?.name).toBe('Updated')
  })

  it('deletes an organization', async () => {
    const org = await orgRepository.createOrganization({ name: 'Del', slug: 'del', ownerId: 'user-1' })
    expect(await orgRepository.deleteOrganization(org.id)).toBe(true)
    expect(await orgRepository.getOrganization(org.id)).toBeUndefined()
    expect(await orgRepository.deleteOrganization('nonexistent')).toBe(false)
  })

  it('creates teams within an organization', async () => {
    const org = await orgRepository.createOrganization({ name: 'Org', slug: 'org', ownerId: 'user-1' })
    const team = await orgRepository.createTeam(org.id, { name: 'Dev Team', description: 'Engineering' })
    expect(team.name).toBe('Dev Team')
    expect(team.organizationId).toBe(org.id)
    expect(team.id).toMatch(/^team_/)
  })

  it('lists teams by organization', async () => {
    const org = await orgRepository.createOrganization({ name: 'Org', slug: 'org', ownerId: 'user-1' })
    await orgRepository.createTeam(org.id, { name: 'Team A' })
    await orgRepository.createTeam(org.id, { name: 'Team B' })
    const teams = await orgRepository.listTeamsByOrganization(org.id)
    expect(teams.length).toBe(2)
  })

  it('manages organization members', async () => {
    const org = await orgRepository.createOrganization({ name: 'Org', slug: 'org', ownerId: 'user-1' })
    const member = await orgRepository.addOrganizationMember(org.id, 'user-2', 'org:member')
    expect(member.role).toBe('org:member')
    expect(member.organizationId).toBe(org.id)

    const members = await orgRepository.listOrganizationMembers(org.id)
    expect(members.length).toBe(1)

    const updated = await orgRepository.updateOrganizationMemberRole(org.id, 'user-2', 'org:admin')
    expect(updated?.role).toBe('org:admin')

    expect(await orgRepository.removeOrganizationMember(org.id, 'user-2')).toBe(true)
    expect(await orgRepository.listOrganizationMembers(org.id)).toHaveLength(0)
  })

  it('manages team members', async () => {
    const org = await orgRepository.createOrganization({ name: 'Org', slug: 'org', ownerId: 'user-1' })
    const team = await orgRepository.createTeam(org.id, { name: 'Team' })
    const member = await orgRepository.addTeamMember(team.id, 'user-2', 'member')
    expect(member.role).toBe('member')

    const members = await orgRepository.listTeamMembers(team.id)
    expect(members.length).toBe(1)

    const updated = await orgRepository.updateTeamMemberRole(team.id, 'user-2', 'lead')
    expect(updated?.role).toBe('lead')

    expect(await orgRepository.removeTeamMember(team.id, 'user-2')).toBe(true)
    expect(await orgRepository.listTeamMembers(team.id)).toHaveLength(0)
  })
})

describe('Registry Database', () => {
  afterEach(() => {
    resetAll()
  })

  it('creates and finds a registry with extended fields', () => {
    const db = freshDb()
    const org = db.insertOrganization({
      id: 'org-1', name: 'Org', slug: 'org',
      description: null, ownerId: 'user-1', settings: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })

    const reg = db.insertRegistry({
      id: 'reg-1',
      name: 'npm Registry',
      description: 'Private npm packages',
      organizationId: org.id,
      visibility: 'private',
      allowedRoles: null,
      registryType: 'npm',
      url: 'https://npm.mycompany.com',
      enabled: true,
      createdBy: 'user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    expect(reg.name).toBe('npm Registry')
    expect(reg.visibility).toBe('private')
    expect(reg.registryType).toBe('npm')
    expect(reg.url).toBe('https://npm.mycompany.com')
    expect(reg.enabled).toBe(true)

    const found = db.findRegistryById('reg-1')
    expect(found?.name).toBe('npm Registry')
    expect(found?.organizationId).toBe('org-1')
    expect(found?.registryType).toBe('npm')
    expect(found?.url).toBe('https://npm.mycompany.com')
    expect(found?.enabled).toBe(true)
    db.close()
  })

  it('lists registries by organization with registry type', () => {
    const db = freshDb()
    db.insertOrganization({
      id: 'org-1', name: 'Org', slug: 'org',
      description: null, ownerId: 'user-1', settings: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })

    db.insertRegistry({
      id: 'reg-1', name: 'npm Registry', description: null,
      organizationId: 'org-1', visibility: 'private', allowedRoles: null,
      registryType: 'npm', url: 'https://npm.example.com', enabled: true,
      createdBy: 'user-1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    db.insertRegistry({
      id: 'reg-2', name: 'PyPI Registry', description: null,
      organizationId: 'org-1', visibility: 'team', allowedRoles: ['admin'],
      registryType: 'pypi', url: 'https://pypi.mycompany.com', enabled: false,
      createdBy: 'user-1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })

    const registries = db.listRegistriesByOrganization('org-1')
    expect(registries.length).toBe(2)
    const npm = registries.find(r => r.registryType === 'npm')
    const pypi = registries.find(r => r.registryType === 'pypi')
    expect(npm?.enabled).toBe(true)
    expect(pypi?.enabled).toBe(false)
    expect(pypi?.allowedRoles).toEqual(['admin'])
    db.close()
  })

  it('updates a registry including type and URL', () => {
    const db = freshDb()
    db.insertOrganization({
      id: 'org-1', name: 'Org', slug: 'org',
      description: null, ownerId: 'user-1', settings: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    db.insertRegistry({
      id: 'reg-1', name: 'Old Name', description: 'Old desc',
      organizationId: 'org-1', visibility: 'private', allowedRoles: null,
      registryType: 'generic', url: null, enabled: true,
      createdBy: 'user-1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })

    const updated = db.updateRegistry('reg-1', {
      name: 'New Name',
      visibility: 'organization',
      registryType: 'maven',
      url: 'https://maven.mycompany.com',
      enabled: false,
    })
    expect(updated?.name).toBe('New Name')
    expect(updated?.visibility).toBe('organization')
    expect(updated?.registryType).toBe('maven')
    expect(updated?.url).toBe('https://maven.mycompany.com')
    expect(updated?.enabled).toBe(false)

    const found = db.findRegistryById('reg-1')
    expect(found?.registryType).toBe('maven')
    expect(found?.url).toBe('https://maven.mycompany.com')
    expect(found?.enabled).toBe(false)
    db.close()
  })

  it('deletes a registry', () => {
    const db = freshDb()
    db.insertOrganization({
      id: 'org-1', name: 'Org', slug: 'org',
      description: null, ownerId: 'user-1', settings: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    db.insertRegistry({
      id: 'reg-1', name: 'To Delete', description: null,
      organizationId: 'org-1', visibility: 'private', allowedRoles: null,
      registryType: 'generic', url: null, enabled: true,
      createdBy: 'user-1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })

    expect(db.deleteRegistry('reg-1')).toBe(true)
    expect(db.findRegistryById('reg-1')).toBeUndefined()
    expect(db.deleteRegistry('nonexistent')).toBe(false)
    db.close()
  })

  it('cascades delete from organization to registries', () => {
    const db = freshDb()
    db.insertOrganization({
      id: 'org-1', name: 'Org', slug: 'org',
      description: null, ownerId: 'user-1', settings: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    db.insertRegistry({
      id: 'reg-1', name: 'Registry', description: null,
      organizationId: 'org-1', visibility: 'private', allowedRoles: null,
      registryType: 'generic', url: null, enabled: true,
      createdBy: 'user-1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })

    db.deleteOrganization('org-1')
    expect(db.findRegistryById('reg-1')).toBeUndefined()
    db.close()
  })

  it('manages registry artifacts', () => {
    const db = freshDb()
    db.insertOrganization({
      id: 'org-1', name: 'Org', slug: 'org',
      description: null, ownerId: 'user-1', settings: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    db.insertRegistry({
      id: 'reg-1', name: 'Registry', description: null,
      organizationId: 'org-1', visibility: 'private', allowedRoles: null,
      registryType: 'generic', url: null, enabled: true,
      createdBy: 'user-1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })

    const ra = db.insertRegistryArtifact({
      id: 'ra-1',
      registryId: 'reg-1',
      artifactId: 'art-1',
      addedBy: 'user-1',
      addedAt: new Date().toISOString(),
    })
    expect(ra.registryId).toBe('reg-1')
    expect(ra.artifactId).toBe('art-1')

    const artifacts = db.listRegistryArtifacts('reg-1')
    expect(artifacts.length).toBe(1)

    const found = db.findRegistryArtifact('reg-1', 'art-1')
    expect(found?.id).toBe('ra-1')

    expect(db.deleteRegistryArtifact('reg-1', 'art-1')).toBe(true)
    expect(db.listRegistryArtifacts('reg-1')).toHaveLength(0)
    db.close()
  })

  it('enforces unique registry artifacts constraint', () => {
    const db = freshDb()
    db.insertOrganization({
      id: 'org-1', name: 'Org', slug: 'org',
      description: null, ownerId: 'user-1', settings: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    db.insertRegistry({
      id: 'reg-1', name: 'Registry', description: null,
      organizationId: 'org-1', visibility: 'private', allowedRoles: null,
      registryType: 'generic', url: null, enabled: true,
      createdBy: 'user-1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })

    db.insertRegistryArtifact({
      id: 'ra-1', registryId: 'reg-1', artifactId: 'art-1',
      addedBy: 'user-1', addedAt: new Date().toISOString(),
    })

    expect(() => {
      db.insertRegistryArtifact({
        id: 'ra-2', registryId: 'reg-1', artifactId: 'art-1',
        addedBy: 'user-1', addedAt: new Date().toISOString(),
      })
    }).toThrow()
    db.close()
  })

  it('manages registry credentials', () => {
    const db = freshDb()
    db.insertOrganization({
      id: 'org-1', name: 'Org', slug: 'org',
      description: null, ownerId: 'user-1', settings: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    db.insertRegistry({
      id: 'reg-1', name: 'npm Registry', description: null,
      organizationId: 'org-1', visibility: 'private', allowedRoles: null,
      registryType: 'npm', url: 'https://npm.example.com', enabled: true,
      createdBy: 'user-1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })

    const creds = db.upsertRegistryCredentials({
      id: 'cred-1',
      registryId: 'reg-1',
      authType: 'token',
      username: null,
      secretValue: 'encrypted-token-value',
      envVar: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    expect(creds.authType).toBe('token')
    expect(creds.secretValue).toBe('encrypted-token-value')

    const found = db.findRegistryCredentials('reg-1')
    expect(found?.id).toBe('cred-1')
    expect(found?.authType).toBe('token')

    // Upsert again (same registry_id) should update
    db.upsertRegistryCredentials({
      id: 'cred-1',
      registryId: 'reg-1',
      authType: 'basic',
      username: 'admin',
      secretValue: 'new-password',
      envVar: null,
      createdAt: found!.createdAt,
      updatedAt: new Date().toISOString(),
    })
    const updated = db.findRegistryCredentials('reg-1')
    expect(updated?.authType).toBe('basic')
    expect(updated?.username).toBe('admin')

    expect(db.deleteRegistryCredentials('reg-1')).toBe(true)
    expect(db.findRegistryCredentials('reg-1')).toBeUndefined()
    db.close()
  })

  it('cascades credentials delete with registry', () => {
    const db = freshDb()
    db.insertOrganization({
      id: 'org-1', name: 'Org', slug: 'org',
      description: null, ownerId: 'user-1', settings: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    db.insertRegistry({
      id: 'reg-1', name: 'Registry', description: null,
      organizationId: 'org-1', visibility: 'private', allowedRoles: null,
      registryType: 'npm', url: 'https://npm.example.com', enabled: true,
      createdBy: 'user-1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    db.upsertRegistryCredentials({
      id: 'cred-1', registryId: 'reg-1', authType: 'none',
      username: null, secretValue: null, envVar: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })

    db.deleteRegistry('reg-1')
    expect(db.findRegistryCredentials('reg-1')).toBeUndefined()
    db.close()
  })

  it('defaults to generic registry type', () => {
    const db = freshDb()
    db.insertOrganization({
      id: 'org-1', name: 'Org', slug: 'org',
      description: null, ownerId: 'user-1', settings: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    const reg = db.insertRegistry({
      id: 'reg-1', name: 'Generic', description: null,
      organizationId: 'org-1', visibility: 'private', allowedRoles: null,
      registryType: 'generic', url: null, enabled: true,
      createdBy: 'user-1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
    expect(reg.registryType).toBe('generic')
    db.close()
  })
})

describe('Registry Repository', () => {
  beforeEach(() => {
    resetAll()
    getOrgDatabase(':memory:')
  })

  afterEach(() => {
    resetAll()
  })

  it('creates and retrieves a registry with type and URL', async () => {
    const org = await orgRepository.createOrganization({ name: 'Org', slug: 'org', ownerId: 'user-1' })
    const reg = await orgRepository.createRegistry(org.id, {
      name: 'npm Registry',
      description: 'Private npm packages',
      registryType: 'npm',
      url: 'https://npm.mycompany.com',
      createdBy: 'user-1',
    })
    expect(reg.name).toBe('npm Registry')
    expect(reg.organizationId).toBe(org.id)
    expect(reg.visibility).toBe('private')
    expect(reg.registryType).toBe('npm')
    expect(reg.url).toBe('https://npm.mycompany.com')
    expect(reg.enabled).toBe(true)
    expect(reg.id).toMatch(/^reg_/)

    const found = await orgRepository.getRegistry(reg.id)
    expect(found?.name).toBe('npm Registry')
    expect(found?.registryType).toBe('npm')
    expect(found?.url).toBe('https://npm.mycompany.com')
    expect(found?.enabled).toBe(true)
  })

  it('lists registries by organization with types', async () => {
    const org = await orgRepository.createOrganization({ name: 'Org', slug: 'org', ownerId: 'user-1' })
    await orgRepository.createRegistry(org.id, { name: 'npm Registry', createdBy: 'user-1', registryType: 'npm', url: 'https://npm.example.com' })
    await orgRepository.createRegistry(org.id, { name: 'PyPI Registry', createdBy: 'user-1', visibility: 'team', registryType: 'pypi', url: 'https://pypi.example.com' })

    const registries = await orgRepository.listRegistriesByOrganization(org.id)
    expect(registries.length).toBe(2)
    expect(registries.map(r => r.registryType)).toContain('npm')
    expect(registries.map(r => r.registryType)).toContain('pypi')
  })

  it('updates a registry including type and URL', async () => {
    const org = await orgRepository.createOrganization({ name: 'Org', slug: 'org', ownerId: 'user-1' })
    const reg = await orgRepository.createRegistry(org.id, { name: 'Old', createdBy: 'user-1', registryType: 'generic' })

    const updated = await orgRepository.updateRegistry(reg.id, {
      name: 'Updated',
      visibility: 'organization',
      registryType: 'maven',
      url: 'https://maven.mycompany.com',
      enabled: false,
    })
    expect(updated?.name).toBe('Updated')
    expect(updated?.visibility).toBe('organization')
    expect(updated?.registryType).toBe('maven')
    expect(updated?.url).toBe('https://maven.mycompany.com')
    expect(updated?.enabled).toBe(false)

    const found = await orgRepository.getRegistry(reg.id)
    expect(found?.registryType).toBe('maven')
    expect(found?.url).toBe('https://maven.mycompany.com')
    expect(found?.enabled).toBe(false)
  })

  it('deletes a registry', async () => {
    const org = await orgRepository.createOrganization({ name: 'Org', slug: 'org', ownerId: 'user-1' })
    const reg = await orgRepository.createRegistry(org.id, { name: 'Delete Me', createdBy: 'user-1' })

    expect(await orgRepository.deleteRegistry(reg.id)).toBe(true)
    expect(await orgRepository.getRegistry(reg.id)).toBeUndefined()
    expect(await orgRepository.deleteRegistry('nonexistent')).toBe(false)
  })

  it('manages registry artifacts', async () => {
    const org = await orgRepository.createOrganization({ name: 'Org', slug: 'org', ownerId: 'user-1' })
    const reg = await orgRepository.createRegistry(org.id, { name: 'My Registry', createdBy: 'user-1' })

    const ra = await orgRepository.addArtifactToRegistry(reg.id, 'art-1', 'user-1')
    expect(ra.registryId).toBe(reg.id)
    expect(ra.artifactId).toBe('art-1')
    expect(ra.id).toMatch(/^ra_/)

    const artifacts = await orgRepository.listRegistryArtifacts(reg.id)
    expect(artifacts.length).toBe(1)

    const found = await orgRepository.getRegistryArtifact(reg.id, 'art-1')
    expect(found?.id).toBe(ra.id)

    expect(await orgRepository.removeArtifactFromRegistry(reg.id, 'art-1')).toBe(true)
    expect(await orgRepository.listRegistryArtifacts(reg.id)).toHaveLength(0)
  })

  it('prevents duplicate artifact in registry', async () => {
    const org = await orgRepository.createOrganization({ name: 'Org', slug: 'org', ownerId: 'user-1' })
    const reg = await orgRepository.createRegistry(org.id, { name: 'Registry', createdBy: 'user-1' })

    await orgRepository.addArtifactToRegistry(reg.id, 'art-1', 'user-1')

    await expect(
      orgRepository.addArtifactToRegistry(reg.id, 'art-1', 'user-1')
    ).rejects.toThrow()
  })

  it('manages registry credentials', async () => {
    const org = await orgRepository.createOrganization({ name: 'Org', slug: 'org', ownerId: 'user-1' })
    const reg = await orgRepository.createRegistry(org.id, { name: 'npm Registry', createdBy: 'user-1', registryType: 'npm', url: 'https://npm.example.com' })

    const creds = await orgRepository.upsertRegistryCredentials(reg.id, {
      authType: 'token',
      secretValue: 'npm-token-123',
    })
    expect(creds.authType).toBe('token')
    expect(creds.secretValue).toBe('npm-token-123')
    expect(creds.registryId).toBe(reg.id)

    const found = await orgRepository.getRegistryCredentials(reg.id)
    expect(found?.authType).toBe('token')

    // Upsert with basic auth
    const updated = await orgRepository.upsertRegistryCredentials(reg.id, {
      authType: 'basic',
      username: 'deploy',
      secretValue: 'new-password',
    })
    expect(updated?.authType).toBe('basic')
    expect(updated?.username).toBe('deploy')

    expect(await orgRepository.deleteRegistryCredentials(reg.id)).toBe(true)
    expect(await orgRepository.getRegistryCredentials(reg.id)).toBeUndefined()
  })

  it('uses env var for credentials when authType is env', async () => {
    const org = await orgRepository.createOrganization({ name: 'Org', slug: 'org', ownerId: 'user-1' })
    const reg = await orgRepository.createRegistry(org.id, { name: 'Env Registry', createdBy: 'user-1', registryType: 'npm', url: 'https://npm.example.com' })

    const creds = await orgRepository.upsertRegistryCredentials(reg.id, {
      authType: 'env',
      envVar: 'NPM_REGISTRY_TOKEN',
    })
    expect(creds.authType).toBe('env')
    expect(creds.envVar).toBe('NPM_REGISTRY_TOKEN')
  })
})
