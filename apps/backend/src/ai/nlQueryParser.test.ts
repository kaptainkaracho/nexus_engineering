import { describe, it, expect } from 'vitest'
import { NLQueryParser } from './nlQueryParser'

const parser = new NLQueryParser()

describe('NLQueryParser.classifyIntent', () => {
  it('classifies requirement queries', () => {
    expect(parser.parse('Show me all untested requirements in the auth module').intent).toBe('requirement_query')
    expect(parser.parse('List requirements with gaps').intent).toBe('requirement_query')
  })

  it('classifies feature queries', () => {
    expect(parser.parse('Which features are linked to auth?').intent).toBe('feature_query')
  })

  it('classifies ADR queries', () => {
    expect(parser.parse('Which ADRs are linked to the RBAC implementation?').intent).toBe('adr_query')
  })

  it('classifies impact queries from "affected"/"changes to"', () => {
    expect(parser.parse('What is impacted by changes to login.ts?').intent).toBe('impact_query')
    expect(parser.parse('What features are affected by changes to login.ts?').intent).toBe('impact_query')
  })

  it('defaults to test query when no artifact keyword is present', () => {
    expect(parser.parse('show me everything').intent).toBe('test_query')
  })
})

describe('NLQueryParser.entity extraction', () => {
  it('extracts module from "in the <module>"', () => {
    const parsed = parser.parse('untested requirements in the auth module')
    expect(parsed.entityFilters.module).toBe('auth')
  })

  it('extracts module from "linked to the <module> implementation"', () => {
    const parsed = parser.parse('Which ADRs are linked to the RBAC implementation?')
    expect(parsed.entityFilters.module).toBe('RBAC')
  })

  it('extracts file from "changes to <file>"', () => {
    const parsed = parser.parse('What is affected by changes to login.ts?')
    expect(parsed.entityFilters.file).toBe('login.ts')
  })

  it('extracts a bare source file token as file', () => {
    const parsed = parser.parse('impact of auth.service.ts')
    expect(parsed.entityFilters.file).toBe('auth.service.ts')
  })

  it('extracts status keywords', () => {
    expect(parser.parse('untested requirements').entityFilters.status).toBe('untested')
    expect(parser.parse('orphan artifacts').entityFilters.status).toBe('orphan')
    expect(parser.parse('stale links').entityFilters.status).toBe('stale')
    expect(parser.parse('linked features').entityFilters.status).toBe('linked')
  })

  it('preserves raw query', () => {
    const raw = 'Show me all untested requirements in the auth module'
    expect(parser.parse(raw).rawQuery).toBe(raw)
  })
})
