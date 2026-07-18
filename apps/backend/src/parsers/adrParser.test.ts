import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { repositoryParser } from './repositoryParser';
import type { FileMetadata as SharedFileMetadata } from '@nexus-engineering/shared';

const TMP = path.join(os.tmpdir(), `adr-parser-tests-${process.pid}`);

function fixture(name: string, contents: string): SharedFileMetadata {
  const filePath = path.join(TMP, name);
  return {
    filePath,
    relativePath: name,
    size: contents.length,
    contentHash: 'hash',
    contentType: 'text',
    detectedType: 'adr',
  };
}

const HAPPY = `title: Use YAML-based Architecture Decision Records
status: accepted
context: |
  We need a structured format for recording architecture decisions.
  Markdown frontmatter was initially used but pure YAML is better.
decision: |
  Adopt .arch.yaml as the format for Architecture Decision Records.
consequences:
  - All new ADRs must use .arch.yaml format
  - Existing markdown ADRs will be migrated over time
  - CI validation can be added for .arch.yaml files
superseded_by: ADR-0001
`;

const MINIMAL = `title: Minimal ADR
status: proposed
context: Some context.
decision: Some decision.
consequences:
  - one
`;

const MISSING_FIELDS = `status: retired
context: Only context.
decision: Only decision.
`;

const MALFORMED = `title: "unclosed
consequences: [ this is : not : valid yaml ::
`;

const EMPTY = ``;

describe('RepositoryParser .arch.yaml support', () => {
  beforeAll(async () => {
    await fs.mkdir(TMP, { recursive: true });
    await fs.writeFile(path.join(TMP, 'happy.arch.yaml'), HAPPY, 'utf-8');
    await fs.writeFile(path.join(TMP, 'minimal.arch.yaml'), MINIMAL, 'utf-8');
    await fs.writeFile(path.join(TMP, 'missing.arch.yaml'), MISSING_FIELDS, 'utf-8');
    await fs.writeFile(path.join(TMP, 'malformed.arch.yaml'), MALFORMED, 'utf-8');
    await fs.writeFile(path.join(TMP, 'empty.arch.yaml'), EMPTY, 'utf-8');
  });

  afterAll(async () => {
    await fs.rm(TMP, { recursive: true, force: true });
  });

  it('happy path: parses all fields into ArchitectureDecision', async () => {
    const result = await repositoryParser.parse([fixture('happy.arch.yaml', HAPPY)], TMP);
    expect(result.errors).toHaveLength(0);
    expect(result.documents).toHaveLength(1);

    const doc = result.documents[0];
    expect(doc.detectedType).toBe('adr');
    expect(doc.metadata.title).toBe('Use YAML-based Architecture Decision Records');
    expect(doc.metadata.status).toBe('accepted');

    const adr = doc.content as any;
    expect(adr.title).toBe('Use YAML-based Architecture Decision Records');
    expect(adr.status).toBe('accepted');
    expect(adr.context).toContain('structured format');
    expect(adr.decision).toContain('Adopt .arch.yaml');
    expect(adr.consequences).toHaveLength(3);
    expect(adr.consequences[0]).toBe('All new ADRs must use .arch.yaml format');
    expect(adr.supersededBy).toBe('ADR-0001');

    // superseded_by produces a trace link
    expect(doc.traceLinks).toHaveLength(1);
    expect(doc.traceLinks![0]).toMatchObject({
      sourceId: 'Use YAML-based Architecture Decision Records',
      targetId: 'ADR-0001',
      relationshipType: 'tracesTo',
    });
  });

  it('minimal file: defaults applied, no warnings for valid data', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await repositoryParser.parse([fixture('minimal.arch.yaml', MINIMAL)], TMP);
    warn.mockRestore();

    expect(result.errors).toHaveLength(0);
    expect(result.documents).toHaveLength(1);

    const adr = result.documents[0].content as any;
    expect(adr.title).toBe('Minimal ADR');
    expect(adr.status).toBe('proposed');
    expect(adr.consequences).toEqual(['one']);
    expect(adr.supersededBy).toBeUndefined();
    expect(adr.deciders).toEqual([]);
    expect(adr.date).toBe('');
  });

  it('missing fields: degrades gracefully with warnings and defaults', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await repositoryParser.parse([fixture('missing.arch.yaml', MISSING_FIELDS)], TMP);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();

    expect(result.errors).toHaveLength(0);
    expect(result.documents).toHaveLength(1);

    const adr = result.documents[0].content as any;
    expect(adr.title).toBe(''); // missing title warned
    expect(adr.status).toBe('proposed'); // invalid status defaulted
    expect(adr.consequences).toEqual([]); // missing consequences defaulted
  });

  it('malformed YAML: recorded as error without crashing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await repositoryParser.parse([fixture('malformed.arch.yaml', MALFORMED)], TMP);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();

    expect(result.documents).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].filePath).toContain('malformed.arch.yaml');
  });

  it('empty file: returns empty decision with warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await repositoryParser.parse([fixture('empty.arch.yaml', EMPTY)], TMP);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();

    expect(result.errors).toHaveLength(0);
    expect(result.documents).toHaveLength(1);
    const adr = result.documents[0].content as any;
    expect(adr.title).toBe('');
    expect(adr.status).toBe('proposed');
    expect(adr.consequences).toEqual([]);
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
