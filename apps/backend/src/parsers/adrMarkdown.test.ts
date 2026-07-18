import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { repositoryParser } from './repositoryParser';
import type { FileMetadata as SharedFileMetadata } from '@nexus-engineering/shared';

const TMP = path.join(os.tmpdir(), `adr-markdown-tests-${process.pid}`);

function fixture(name: string, contents: string, detectedType?: 'adr'): SharedFileMetadata {
  const filePath = path.join(TMP, name);
  return {
    filePath,
    relativePath: name,
    size: contents.length,
    contentHash: 'hash',
    contentType: 'text',
    detectedType,
  };
}

const HAPPY = `---
title: Use Markdown-based Architecture Decision Records
date: 2026-01-15
status: accepted
deciders:
  - Alice
  - Bob
---

# Use Markdown-based Architecture Decision Records

## Context
We need a human-readable format for recording architecture decisions.

## Decision
Adopt ADR-*.md as the canonical format for Architecture Decision Records.

## Consequences
All new ADRs use Markdown with YAML frontmatter.

Existing YAML ADRs will be migrated over time.
`;

const MISSING_FRONTMATTER = `# Decision Without Frontmatter

## Context
Context without frontmatter.

## Decision
Decision without frontmatter.

## Consequences
One consequence here.
`;

const MALFORMED = `---
title: "unclosed
date: 2026-01-01
---

# Malformed Frontmatter ADR

## Context
Context recovered despite bad frontmatter.

## Decision
Decision recovered.

## Consequences
Recovered consequence.
`;

const EMPTY = ``;

describe('RepositoryParser ADR-*.md support', () => {
  beforeAll(async () => {
    await fs.mkdir(TMP, { recursive: true });
    await fs.writeFile(path.join(TMP, 'ADR-001-use-markdown-adrs.md'), HAPPY, 'utf-8');
    await fs.writeFile(path.join(TMP, 'ADR-002-no-frontmatter.md'), MISSING_FRONTMATTER, 'utf-8');
    await fs.writeFile(path.join(TMP, 'ADR-003-malformed.md'), MALFORMED, 'utf-8');
    await fs.writeFile(path.join(TMP, 'ADR-004-empty.md'), EMPTY, 'utf-8');
    await fs.writeFile(path.join(TMP, 'ADR-005-no-extension'), HAPPY, 'utf-8');
    await fs.writeFile(
      path.join(TMP, 'ADR-0001.arch.yaml'),
      'title: Existing YAML ADR\nstatus: accepted\ncontext: c\ndecision: d\nconsequences:\n  - x\n',
      'utf-8'
    );
  });

  afterAll(async () => {
    await fs.rm(TMP, { recursive: true, force: true });
  });

  it('happy path: parses frontmatter + body sections into ArchitectureDecision', async () => {
    const result = await repositoryParser.parse(
      [fixture('ADR-001-use-markdown-adrs.md', HAPPY, 'adr')],
      TMP
    );
    expect(result.errors).toHaveLength(0);
    expect(result.documents).toHaveLength(1);

    const doc = result.documents[0];
    expect(doc.detectedType).toBe('adr');
    expect(doc.metadata.title).toBe('Use Markdown-based Architecture Decision Records');
    expect(doc.metadata.status).toBe('accepted');

    const adr = doc.content as any;
    expect(adr.id).toBe('ADR-001-use-markdown-adrs');
    expect(adr.title).toBe('Use Markdown-based Architecture Decision Records');
    expect(adr.date).toBe('2026-01-15');
    expect(adr.status).toBe('accepted');
    expect(adr.deciders).toEqual(['Alice', 'Bob']);
    expect(adr.context).toContain('human-readable format');
    expect(adr.decision).toContain('Adopt ADR-*.md');
    expect(adr.consequences).toHaveLength(2);
    expect(adr.consequences[0]).toContain('All new ADRs');
  });

  it('missing frontmatter: title from # heading, body sections still parsed', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await repositoryParser.parse(
      [fixture('ADR-002-no-frontmatter.md', MISSING_FRONTMATTER, 'adr')],
      TMP
    );
    warn.mockRestore();

    expect(result.errors).toHaveLength(0);
    expect(result.documents).toHaveLength(1);

    const adr = result.documents[0].content as any;
    expect(adr.title).toBe('Decision Without Frontmatter');
    expect(adr.status).toBe('proposed'); // defaulted (no frontmatter status)
    expect(adr.deciders).toEqual([]);
    expect(adr.context).toContain('Context without frontmatter');
    expect(adr.decision).toContain('Decision without frontmatter');
    expect(adr.consequences).toEqual(['One consequence here.']);
  });

  it('malformed YAML frontmatter: degrades gracefully, body still parsed, warning logged', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await repositoryParser.parse(
      [fixture('ADR-003-malformed.md', MALFORMED, 'adr')],
      TMP
    );
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();

    expect(result.errors).toHaveLength(0);
    expect(result.documents).toHaveLength(1);

    const adr = result.documents[0].content as any;
    expect(adr.title).toBe('Malformed Frontmatter ADR'); // recovered from # heading
    expect(adr.context).toContain('recovered despite bad frontmatter');
    expect(adr.decision).toContain('Decision recovered');
    expect(adr.consequences).toEqual(['Recovered consequence.']);
  });

  it('empty file: returns empty decision, no parse error', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await repositoryParser.parse(
      [fixture('ADR-004-empty.md', EMPTY, 'adr')],
      TMP
    );
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();

    expect(result.errors).toHaveLength(0);
    expect(result.documents).toHaveLength(1);

    const adr = result.documents[0].content as any;
    expect(adr.id).toBe('ADR-004-empty');
    expect(adr.title).toBe('');
    expect(adr.status).toBe('proposed');
    expect(adr.consequences).toEqual([]);
  });

  it('no .md extension: not treated as an ADR markdown file', async () => {
    const result = await repositoryParser.parse(
      [fixture('ADR-005-no-extension', HAPPY)],
      TMP
    );
    expect(result.errors).toHaveLength(0);
    expect(result.documents).toHaveLength(1);

    const doc = result.documents[0];
    expect(doc.detectedType).not.toBe('adr');
    expect(typeof doc.content).toBe('string'); // raw markdown, not an ArchitectureDecision
  });

  it('no regression: .arch.yaml and .req.yaml still parsed', async () => {
    const archFile = fixture(
      'ADR-0001.arch.yaml',
      'title: Existing YAML ADR\nstatus: accepted\ncontext: c\ndecision: d\nconsequences:\n  - x\n',
      'adr'
    );
    const reqPath = path.resolve(
      __dirname,
      '../../../../packages/shared/requirements/sample-req-with-traces.req.yaml'
    );
    const reqFile: SharedFileMetadata = {
      filePath: reqPath,
      relativePath: 'sample-req-with-traces.req.yaml',
      size: 1000,
      contentHash: 'hash',
      contentType: 'text',
      detectedType: 'requirement',
    };

    const result = await repositoryParser.parse([archFile, reqFile], '.');
    expect(result.errors).toHaveLength(0);
    expect(result.documents).toHaveLength(2);
    expect(result.documents[0].detectedType).toBe('adr');
    expect(result.documents[1].traceLinks!.length).toBeGreaterThan(0);
  });

  it('integration: real repo sample ADR-001 parses into ArchitectureDecision', async () => {
    const adrPath = path.resolve(
      __dirname,
      '../../../../packages/shared/requirements/decisions/ADR-001-use-markdown-adrs.md'
    );
    const adrFile: SharedFileMetadata = {
      filePath: adrPath,
      relativePath: 'packages/shared/requirements/decisions/ADR-001-use-markdown-adrs.md',
      size: 2200,
      contentHash: 'hash',
      contentType: 'text',
      detectedType: 'adr',
    };

    const result = await repositoryParser.parse([adrFile], '.');
    expect(result.errors).toHaveLength(0);
    expect(result.documents).toHaveLength(1);

    const adr = result.documents[0].content as any;
    expect(adr.id).toBe('ADR-001-use-markdown-adrs');
    expect(adr.title).toContain('Use Markdown ADRs');
    expect(adr.status).toBe('accepted');
    expect(adr.context).toContain('lightweight');
    expect(adr.decision).toContain('adopted ADR-*.md');
    expect(adr.consequences.length).toBeGreaterThan(0);
    expect(adr.supersededBy).toBeUndefined();
  });
});
