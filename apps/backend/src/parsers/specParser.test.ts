import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { repositoryParser } from './repositoryParser';
import type { FileMetadata as SharedFileMetadata } from '@nexus-engineering/shared';

const TMP = path.join(os.tmpdir(), `spec-parser-tests-${process.pid}`);

function fixture(name: string, contents: string): SharedFileMetadata {
  const filePath = path.join(TMP, name);
  return {
    filePath,
    relativePath: name,
    size: contents.length,
    contentHash: 'hash',
    contentType: 'text',
    detectedType: 'spec',
  };
}

const HAPPY = `title: Authentication Specification
version: 1.2.0
status: active
requirements:
  - id: AUTH-001
    title: User Login
    priority: P0
    status: implemented
    references:
      - type: req
        id: REQ-LOGIN
      - type: test
        id: TC-LOGIN
  - id: AUTH-002
    title: Logout
    priority: P1
    status: approved
    references:
      - type: arch
        id: ADR-AUTH
`;

const MISSING_FIELDS = `status: retired
requirements:
  - id: AUTH-001
    title: User Login
    priority: P9
    status: weird
`;

const MALFORMED = `title: "unclosed
requirements: [ this is : not : valid yaml ::
`;

const EMPTY = ``;

const INVALID_REFS = `title: Spec
version: 0.1.0
status: draft
requirements:
  - id: R1
    title: One
    priority: P2
    status: proposed
    references:
      - type: bogus
        id: X1
      - type: req
      - type: test
        id: OK-1
`;

describe('RepositoryParser .spec.yaml support', () => {
  beforeAll(async () => {
    await fs.mkdir(TMP, { recursive: true });
    await fs.writeFile(path.join(TMP, 'happy.spec.yaml'), HAPPY, 'utf-8');
    await fs.writeFile(path.join(TMP, 'missing.spec.yaml'), MISSING_FIELDS, 'utf-8');
    await fs.writeFile(path.join(TMP, 'malformed.spec.yaml'), MALFORMED, 'utf-8');
    await fs.writeFile(path.join(TMP, 'empty.spec.yaml'), EMPTY, 'utf-8');
    await fs.writeFile(path.join(TMP, 'invalidrefs.spec.yaml'), INVALID_REFS, 'utf-8');
  });

  afterAll(async () => {
    await fs.rm(TMP, { recursive: true, force: true });
  });

  it('happy path: parses all fields and references', async () => {
    const result = await repositoryParser.parse([fixture('happy.spec.yaml', HAPPY)], TMP);
    expect(result.errors).toHaveLength(0);
    expect(result.documents).toHaveLength(1);

    const doc = result.documents[0];
    expect(doc.detectedType).toBe('spec');
    expect(doc.metadata.title).toBe('Authentication Specification');
    expect(doc.metadata.version).toBe('1.2.0');
    expect(doc.metadata.status).toBe('active');

    const spec = doc.content as any;
    expect(spec.title).toBe('Authentication Specification');
    expect(spec.status).toBe('active');
    expect(spec.requirements).toHaveLength(2);

    const [r1] = spec.requirements;
    expect(r1.id).toBe('AUTH-001');
    expect(r1.priority).toBe('P0');
    expect(r1.status).toBe('implemented');
    expect(r1.references).toEqual([
      { type: 'req', id: 'REQ-LOGIN' },
      { type: 'test', id: 'TC-LOGIN' },
    ]);

    // trace links derived from valid references
    expect(doc.traceLinks).toHaveLength(3);
    expect(doc.traceLinks!.some((l) => l.sourceId === 'AUTH-001' && l.targetId === 'TC-LOGIN' && l.relationshipType === 'verifies')).toBe(true);
    expect(doc.traceLinks!.some((l) => l.targetId === 'ADR-AUTH' && l.relationshipType === 'tracesTo')).toBe(true);
  });

  it('missing fields: degrades gracefully with warnings and defaults', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await repositoryParser.parse([fixture('missing.spec.yaml', MISSING_FIELDS)], TMP);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();

    expect(result.errors).toHaveLength(0);
    expect(result.documents).toHaveLength(1);

    const spec = result.documents[0].content as any;
    expect(spec.title).toBe('');
    expect(spec.version).toBe('');
    expect(spec.status).toBe('draft'); // invalid status defaulted
    expect(spec.requirements[0].priority).toBe('P3'); // invalid priority defaulted
    expect(spec.requirements[0].status).toBe('proposed'); // invalid status defaulted
  });

  it('malformed YAML: recorded as error without crashing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await repositoryParser.parse([fixture('malformed.spec.yaml', MALFORMED)], TMP);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();

    expect(result.documents).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].filePath).toContain('malformed.spec.yaml');
  });

  it('empty file: returns empty specification with warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await repositoryParser.parse([fixture('empty.spec.yaml', EMPTY)], TMP);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();

    expect(result.errors).toHaveLength(0);
    expect(result.documents).toHaveLength(1);
    const spec = result.documents[0].content as any;
    expect(spec.title).toBe('');
    expect(spec.requirements).toEqual([]);
  });

  it('invalid references: skips bad refs, keeps valid ones', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await repositoryParser.parse([fixture('invalidrefs.spec.yaml', INVALID_REFS)], TMP);
    warn.mockRestore();

    expect(result.errors).toHaveLength(0);
    const doc = result.documents[0];
    const spec = doc.content as any;

    // Only the valid "test -> OK-1" reference survives
    expect(spec.requirements[0].references).toEqual([{ type: 'test', id: 'OK-1' }]);
    expect(doc.traceLinks).toHaveLength(1);
    expect(doc.traceLinks![0]).toMatchObject({ sourceId: 'R1', targetId: 'OK-1', relationshipType: 'verifies' });
  });

  it('no regression: .req.yaml still parsed with trace links', async () => {
    const reqPath = path.resolve(__dirname, '../../../../packages/shared/requirements/sample-req-with-traces.req.yaml');
    const reqFile: SharedFileMetadata = {
      filePath: reqPath,
      relativePath: 'sample-req-with-traces.req.yaml',
      size: 1000,
      contentHash: 'hash',
      contentType: 'text',
      detectedType: 'requirement',
    };
    const result = await repositoryParser.parse([reqFile], '.');
    expect(result.errors).toHaveLength(0);
    expect(result.documents[0].traceLinks!.length).toBeGreaterThan(0);
  });
});
