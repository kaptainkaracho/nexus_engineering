import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { OrgDatabase, getOrgDatabase, resetOrgDatabase } from './database'
import { orgRepository } from './repository'

function freshDb(): OrgDatabase {
  const db = new OrgDatabase(':memory:')
  db.initialize()
  return db
}

describe('OrgDatabase', () => {
  afterEach(() => {
    resetOrgDatabase()
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
      id: 'mem-1', organizationId: 'org-1', userId: 'user-1', role: 'admin',
      joinedAt: new Date().toISOString(),
    })
    db.insertOrganizationMember({
      id: 'mem-2', organizationId: 'org-2', userId: 'user-1', role: 'member',
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
      id: 'mem-1', organizationId: 'org-1', userId: 'user-1', role: 'admin',
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
    resetOrgDatabase()
    getOrgDatabase(':memory:')
  })

  afterEach(() => {
    resetOrgDatabase()
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
    const member = await orgRepository.addOrganizationMember(org.id, 'user-2', 'member')
    expect(member.role).toBe('member')
    expect(member.organizationId).toBe(org.id)

    const members = await orgRepository.listOrganizationMembers(org.id)
    expect(members.length).toBe(1)

    const updated = await orgRepository.updateOrganizationMemberRole(org.id, 'user-2', 'admin')
    expect(updated?.role).toBe('admin')

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
