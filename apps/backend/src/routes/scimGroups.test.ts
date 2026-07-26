import { describe, it, expect } from 'vitest'
import { AuthDatabase } from '../auth/database'
import { randomUUID } from 'node:crypto'

function freshDb(): AuthDatabase {
  const db = new AuthDatabase(':memory:')
  db.initialize()
  return db
}

describe('SCIM 2.0 Group Endpoints — Database layer', () => {
  describe('createGroup', () => {
    it('creates a group and returns it', () => {
      const db = freshDb()
      const id = randomUUID()
      const group = db.createGroup({ id, displayName: 'Developers' })
      expect(group.id).toBe(id)
      expect(group.display_name).toBe('Developers')
      expect(group.created_at).toBeDefined()
      expect(group.updated_at).toBeDefined()
      db.close()
    })

    it('creates multiple groups with different names', () => {
      const db = freshDb()
      const id1 = randomUUID()
      const id2 = randomUUID()
      db.createGroup({ id: id1, displayName: 'Admins' })
      db.createGroup({ id: id2, displayName: 'Developers' })
      expect(db.listGroups().length).toBe(2)
      db.close()
    })
  })

  describe('findGroupById', () => {
    it('finds a group by id', () => {
      const db = freshDb()
      const id = randomUUID()
      db.createGroup({ id, displayName: 'TestGroup' })
      const found = db.findGroupById(id)
      expect(found).toBeDefined()
      expect(found!.display_name).toBe('TestGroup')
      db.close()
    })

    it('returns undefined for non-existent group', () => {
      const db = freshDb()
      const found = db.findGroupById(randomUUID())
      expect(found).toBeUndefined()
      db.close()
    })
  })

  describe('findGroupByDisplayName', () => {
    it('finds a group by display name', () => {
      const db = freshDb()
      const id = randomUUID()
      db.createGroup({ id, displayName: 'Engineers' })
      const found = db.findGroupByDisplayName('Engineers')
      expect(found).toBeDefined()
      expect(found!.id).toBe(id)
      db.close()
    })

    it('returns undefined for non-existent name', () => {
      const db = freshDb()
      const found = db.findGroupByDisplayName('NonExistent')
      expect(found).toBeUndefined()
      db.close()
    })
  })

  describe('listGroups', () => {
    it('returns all groups ordered by display_name', () => {
      const db = freshDb()
      db.createGroup({ id: randomUUID(), displayName: 'Zebra' })
      db.createGroup({ id: randomUUID(), displayName: 'Alpha' })
      db.createGroup({ id: randomUUID(), displayName: 'Middle' })
      const groups = db.listGroups()
      expect(groups.length).toBe(3)
      expect(groups[0].display_name).toBe('Alpha')
      expect(groups[1].display_name).toBe('Middle')
      expect(groups[2].display_name).toBe('Zebra')
      db.close()
    })

    it('returns empty array when no groups exist', () => {
      const db = freshDb()
      expect(db.listGroups().length).toBe(0)
      db.close()
    })
  })

  describe('updateGroup', () => {
    it('updates displayName', () => {
      const db = freshDb()
      const id = randomUUID()
      db.createGroup({ id, displayName: 'OldName' })
      const updated = db.updateGroup(id, { displayName: 'NewName' })
      expect(updated).toBe(true)
      const found = db.findGroupById(id)
      expect(found!.display_name).toBe('NewName')
      db.close()
    })

    it('returns false when no updates provided', () => {
      const db = freshDb()
      const id = randomUUID()
      db.createGroup({ id, displayName: 'Test' })
      const updated = db.updateGroup(id, {})
      expect(updated).toBe(false)
      db.close()
    })

    it('returns false for non-existent group', () => {
      const db = freshDb()
      const updated = db.updateGroup(randomUUID(), { displayName: 'New' })
      expect(updated).toBe(false)
      db.close()
    })
  })

  describe('deleteGroup', () => {
    it('deletes a group', () => {
      const db = freshDb()
      const id = randomUUID()
      db.createGroup({ id, displayName: 'ToDelete' })
      const deleted = db.deleteGroup(id)
      expect(deleted).toBe(true)
      expect(db.findGroupById(id)).toBeUndefined()
      db.close()
    })

    it('returns false for non-existent group', () => {
      const db = freshDb()
      const deleted = db.deleteGroup(randomUUID())
      expect(deleted).toBe(false)
      db.close()
    })

    it('cascades to group_members', () => {
      const db = freshDb()
      const id = randomUUID()
      const member1 = randomUUID()
      const member2 = randomUUID()
      db.createGroup({ id, displayName: 'WithMembers' })
      db.addGroupMember(id, member1)
      db.addGroupMember(id, member2)
      db.deleteGroup(id)
      expect(db.getGroupMembers(id).length).toBe(0)
      db.close()
    })
  })

  describe('addGroupMember', () => {
    it('adds a member to a group', () => {
      const db = freshDb()
      const groupId = randomUUID()
      const memberId = randomUUID()
      db.createGroup({ id: groupId, displayName: 'Team' })
      const added = db.addGroupMember(groupId, memberId)
      expect(added).toBe(true)
      const members = db.getGroupMembers(groupId)
      expect(members.length).toBe(1)
      expect(members[0].member_id).toBe(memberId)
      expect(members[0].member_type).toBe('User')
      db.close()
    })

    it('uses Insert-or-ignore (no duplicate)', () => {
      const db = freshDb()
      const groupId = randomUUID()
      const memberId = randomUUID()
      db.createGroup({ id: groupId, displayName: 'Team' })
      db.addGroupMember(groupId, memberId)
      const added = db.addGroupMember(groupId, memberId)
      expect(added).toBe(false)
      db.close()
    })

    it('supports custom member_type', () => {
      const db = freshDb()
      const groupId = randomUUID()
      const memberId = randomUUID()
      db.createGroup({ id: groupId, displayName: 'Team' })
      db.addGroupMember(groupId, memberId, 'Group')
      const members = db.getGroupMembers(groupId)
      expect(members[0].member_type).toBe('Group')
      db.close()
    })
  })

  describe('removeGroupMember', () => {
    it('removes a member from a group', () => {
      const db = freshDb()
      const groupId = randomUUID()
      const memberId = randomUUID()
      db.createGroup({ id: groupId, displayName: 'Team' })
      db.addGroupMember(groupId, memberId)
      const removed = db.removeGroupMember(groupId, memberId)
      expect(removed).toBe(true)
      expect(db.getGroupMembers(groupId).length).toBe(0)
      db.close()
    })

    it('returns false for non-existent member', () => {
      const db = freshDb()
      const groupId = randomUUID()
      db.createGroup({ id: groupId, displayName: 'Team' })
      const removed = db.removeGroupMember(groupId, randomUUID())
      expect(removed).toBe(false)
      db.close()
    })
  })

  describe('getGroupMembers', () => {
    it('returns all members of a group', () => {
      const db = freshDb()
      const groupId = randomUUID()
      const member1 = randomUUID()
      const member2 = randomUUID()
      const member3 = randomUUID()
      db.createGroup({ id: groupId, displayName: 'Team' })
      db.addGroupMember(groupId, member1)
      db.addGroupMember(groupId, member2)
      db.addGroupMember(groupId, member3)
      const members = db.getGroupMembers(groupId)
      expect(members.length).toBe(3)
      db.close()
    })

    it('returns empty array for group with no members', () => {
      const db = freshDb()
      const groupId = randomUUID()
      db.createGroup({ id: groupId, displayName: 'EmptyGroup' })
      expect(db.getGroupMembers(groupId).length).toBe(0)
      db.close()
    })
  })

  describe('full group lifecycle', () => {
    it('create → add members → update → delete', () => {
      const db = freshDb()
      const groupId = randomUUID()
      const member1 = randomUUID()
      const member2 = randomUUID()

      // Create
      const group = db.createGroup({ id: groupId, displayName: 'Developers' })
      expect(group.display_name).toBe('Developers')

      // Add members
      db.addGroupMember(groupId, member1)
      db.addGroupMember(groupId, member2)
      expect(db.getGroupMembers(groupId).length).toBe(2)

      // Update
      db.updateGroup(groupId, { displayName: 'Senior Developers' })
      const updated = db.findGroupById(groupId)
      expect(updated!.display_name).toBe('Senior Developers')

      // Delete
      expect(db.deleteGroup(groupId)).toBe(true)
      expect(db.findGroupById(groupId)).toBeUndefined()
      expect(db.getGroupMembers(groupId).length).toBe(0)
      db.close()
    })
  })
})
