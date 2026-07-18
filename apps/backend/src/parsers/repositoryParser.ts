// Repository Parser Implementation
// Implements file parsing for engineering artifacts with document type detection

import { promises as fs } from 'fs';
import * as path from 'path';
import { randomUUID } from 'node:crypto';
import { promises as fsPromises } from 'fs';
import yaml from 'js-yaml';
import type {
  FileMetadata,
  Document,
  DocumentType,
  FileEntry,
  FileMetadata as SharedFileMetadata,
  Specification,
  SpecReference,
  SpecRequirement,
  SpecStatus,
  SpecPriority,
  SpecRequirementStatus,
  SpecReferenceType,
  ArchitectureDecision,
  ArchitectureDecisionStatus,
} from '@nexus-engineering/shared';

export interface ParseResult {
  documents: ParsedDocument[];
  errors: Array<{ filePath: string; error: string }>;
  parseTimeMs: number;
}

export interface ParsedDocument {
  id: string;
  filePath: string;
  relativePath: string;
  type: DocumentType;
  detectedType?: 'requirement' | 'architectureModel' | 'softwareComponent' | 'testCase' | 'traceLink' | 'spec' | 'adr';
  content: unknown;
  metadata: {
    title?: string;
    language?: string;
    technologies?: string[];
    dependencies?: string[];
    tags?: string[];
    [key: string]: unknown;
  };
  traceLinks?: ParsedTraceLink[];
}

export interface ParsedTraceLink {
  sourceId: string;
  targetId: string;
  targetDocumentId?: string;
  relationshipType: 'satisfies' | 'verifies' | 'tracesTo' | 'dependsOn' | 'refines' | 'conflictsWith';
  confidence: 'high' | 'medium' | 'low';
}

export class RepositoryParser {
  async parse(files: SharedFileMetadata[], rootPath: string): Promise<ParseResult> {
    const startTime = Date.now();
    const documents: ParsedDocument[] = [];
    const errors: Array<{ filePath: string; error: string }> = [];

    for (const fileMetadata of files) {
      try {
        const document = await this.parseFile(fileMetadata, rootPath);
        documents.push(document);
      } catch (error) {
        errors.push({
          filePath: fileMetadata.filePath,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      documents,
      errors,
      parseTimeMs: Date.now() - startTime
    };
  }

  private async parseFile(fileMetadata: SharedFileMetadata, rootPath: string): Promise<ParsedDocument> {
    const { filePath, detectedType } = fileMetadata;
    
    const content = await this.readFileContent(filePath);

    // Specification documents (.spec.yaml) get a structured Specification object
    // built with field/reference validation and graceful degradation on bad data.
    if (this.isSpecificationFile(filePath)) {
      let parsedContent: string | Record<string, unknown>;
      try {
        parsedContent = this.parseContent(filePath, content);
      } catch (error) {
        console.warn(
          `[spec.yaml] ${filePath}: malformed YAML — ${(error as Error).message}`
        );
        throw error;
      }
      const specification = this.buildSpecification(filePath, parsedContent);
      const traceLinks = this.buildSpecTraceLinks(specification);

      return {
        id: randomUUID(),
        filePath,
        relativePath: fileMetadata.relativePath || path.relative(rootPath, filePath),
        type: 'Md',
        detectedType: 'spec',
        content: specification,
        metadata: {
          title: specification.title,
          version: specification.version,
          status: specification.status,
          requirementCount: specification.requirements.length,
        },
        traceLinks,
      };
    }

    // Architecture Decision Records (.arch.yaml) get a structured
    // ArchitectureDecision object with graceful degradation on bad data.
    if (this.isArchitectureDecisionFile(filePath)) {
      let parsedContent: string | Record<string, unknown>;
      try {
        parsedContent = this.parseContent(filePath, content);
      } catch (error) {
        console.warn(
          `[arch.yaml] ${filePath}: malformed YAML — ${(error as Error).message}`
        );
        throw error;
      }
      const decision = this.buildArchitectureDecision(filePath, parsedContent);
      const traceLinks = this.buildAdrTraceLinks(decision, filePath);

      return {
        id: randomUUID(),
        filePath,
        relativePath: fileMetadata.relativePath || path.relative(rootPath, filePath),
        type: 'Md',
        detectedType: 'adr',
        content: decision,
        metadata: {
          title: decision.title,
          status: decision.status,
          decisionCount: 1,
        },
        traceLinks,
      };
    }

    // Architecture Decision Records (ADR-*.md) use Markdown with YAML
    // frontmatter. Body sections (Context/Decision/Consequences) are parsed
    // from the Markdown; malformed frontmatter degrades gracefully.
    if (this.isAdrMarkdownFile(filePath)) {
      const decision = this.buildAdrMarkdownDecision(filePath, content);
      const traceLinks = this.buildAdrTraceLinks(decision, filePath);

      return {
        id: randomUUID(),
        filePath,
        relativePath: fileMetadata.relativePath || path.relative(rootPath, filePath),
        type: 'Md',
        detectedType: 'adr',
        content: decision,
        metadata: {
          title: decision.title,
          status: decision.status,
          decisionCount: 1,
        },
        traceLinks,
      };
    }

    const parsedContent = this.parseContent(filePath, content);
    const extractedType = this.detectContentType(filePath, detectedType, parsedContent);
    const metadata = this.extractMetadata(filePath, parsedContent, extractedType);
    const traceLinks = this.extractTraceLinks(filePath, detectedType, parsedContent);

    return {
      id: randomUUID(),
      filePath,
      relativePath: fileMetadata.relativePath || path.relative(rootPath, filePath),
      type: extractedType,
      detectedType,
      content: parsedContent,
      metadata,
      traceLinks
    };
  }

  private isSpecificationFile(filePath: string): boolean {
    return filePath.toLowerCase().endsWith('.spec.yaml');
  }

  private isArchitectureDecisionFile(filePath: string): boolean {
    return filePath.toLowerCase().endsWith('.arch.yaml');
  }

  private isAdrMarkdownFile(filePath: string): boolean {
    return /^ADR-.*\.md$/i.test(path.basename(filePath));
  }

  private async readFileContent(filePath: string): Promise<string> {
    try {
      return await fsPromises.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${(error as Error).message}`);
    }
  }

  private parseContent(filePath: string, content: string): string | Record<string, unknown> {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case '.json':
        try {
          return JSON.parse(content);
        } catch (error) {
          throw new Error(`JSON parse failed: ${(error as Error).message}`);
        }
      case '.yaml':
      case '.yml':
        try {
          return yaml.load(content) as string | Record<string, unknown>;
        } catch (error) {
          throw new Error(`YAML parse failed: ${(error as Error).message}`);
        }
      case '.ts':
      case '.tsx':
      case '.js':
      case '.jsx':
      case '.md':
        return content;
      case '.xml':
      case '.html':
        return content;
      default:
        return content;
    }
  }

  private detectContentType(
    filePath: string,
    detectedType?: string,
    parsedContent?: string | Record<string, unknown>
  ): DocumentType {
    const ext = path.extname(filePath).toLowerCase();

    if (detectedType) {
      switch (detectedType) {
        case 'requirement':
          return 'Md';
        case 'architectureModel':
          return 'Xml';
        case 'softwareComponent':
          return 'Txt';
        case 'testCase':
          return 'Txt';
        case 'traceLink':
          return 'Txt';
      }
    }

    switch (ext) {
      case '.json':
        return 'Json';
      case '.md':
        return 'Md';
      case '.xml':
        return 'Xml';
      case '.html':
        return 'Html';
      default:
        return 'Txt';
    }
  }

  private extractMetadata(
    filePath: string,
    content: string | Record<string, unknown>,
    type: DocumentType
  ): ParsedDocument['metadata'] {
    const metadata: ParsedDocument['metadata'] = {};
    const ext = path.extname(filePath).toLowerCase();

    if (typeof content === 'object' && content !== null) {
      if ('title' in content) metadata.title = String(content.title);
      if ('description' in content) metadata.description = String(content.description);
      if ('language' in content) metadata.language = String(content.language);
      if ('technologies' in content) metadata.technologies = Array.isArray(content.technologies) ? content.technologies : [];
      if ('dependencies' in content) metadata.dependencies = Array.isArray(content.dependencies) ? content.dependencies : [];
      if ('tags' in content) metadata.tags = Array.isArray(content.tags) ? content.tags : [];
      if ('nexus' in content) {
        const nexusMeta = content.nexus as Record<string, unknown>;
        if (typeof nexusMeta === 'object' && nexusMeta !== null) {
          if ('metadata' in nexusMeta && typeof nexusMeta.metadata === 'object') {
            const metadataObj = nexusMeta.metadata as Record<string, unknown>;
            if ('title' in metadataObj) metadata.title = String(metadataObj.title);
            if ('domain' in metadataObj) metadata.language = String(metadataObj.domain);
          }
        }
      }
    }

    if (ext === '.ts' || ext === '.js' || ext === '.tsx' || ext === '.jsx') {
      metadata.language = ext.slice(1);
      const source = String(content);
      const exportMatch = source.match(/export (?:class|interface|const)\s+(\w+)/);
      if (exportMatch) metadata.title = exportMatch[1];
    }

    if (ext === '.md') {
      const source = String(content);
      const mdTitleMatch = source.match(/^#\s+(.+)$/m);
      if (mdTitleMatch) metadata.title = mdTitleMatch[1];
      const frontmatterMatch = source.match(/^---\s*\n([\s\S]*?)\n---/);
      if (frontmatterMatch) {
        try {
          const frontmatter = yaml.load(frontmatterMatch[1]);
          if (typeof frontmatter === 'object' && frontmatter !== null) {
            if ('title' in frontmatter) metadata.title = String(frontmatter.title);
            if ('language' in frontmatter) metadata.language = String(frontmatter.language);
            if ('technologies' in frontmatter) metadata.technologies = Array.isArray(frontmatter.technologies) ? frontmatter.technologies : [];
          }
        } catch (e) {}
      }
    }

    return metadata;
  }

  private extractTraceLinks(
    filePath: string,
    detectedType?: string,
    content?: string | Record<string, unknown>
  ): ParsedTraceLink[] {
    if (!content || typeof content !== 'object' || content === null) return [];

    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.yaml' || ext === '.yml') {
      if (detectedType === 'requirement' && 'requirements' in content) {
        const requirements = Array.isArray(content.requirements) ? content.requirements : [];
        const traceLinks: ParsedTraceLink[] = [];

        for (const req of requirements) {
          if ('traceLinks' in req && Array.isArray(req.traceLinks)) {
            const sourceId = (req as any).id || (req as any)._id || (req as any).sourceId;
            for (const link of req.traceLinks) {
              if (link.target && link.target.id && link.type) {
                const targetId = link.target.id;
                let confidence: 'high' | 'medium' | 'low' = 'high';
                
                // Handle both string and object confidence formats
                if ('confidence' in link) {
                  if (typeof link.confidence === 'string') {
                    confidence = link.confidence as 'high' | 'medium' | 'low';
                  } else if (typeof link.confidence === 'number') {
                    confidence = link.confidence >= 7 ? 'high' : (link.confidence >= 4 ? 'medium' : 'low');
                  }
                }
                
                // Handle string or object relationshipType
                const relationshipType = typeof link.type === 'string' ? link.type : link.type?.value || 'tracesTo';
                
                traceLinks.push({
                  sourceId,
                  targetId,
                  targetDocumentId: link.target.documentId,
                  relationshipType: relationshipType as ParsedTraceLink['relationshipType'],
                  confidence
                });
              }
            }
          }
        }

        return traceLinks;
      }
    }

    if ((ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx') && detectedType === 'softwareComponent') {
      const contentStr = String(content);
      const traceLinkMatches = contentStr.match(/@(trace)\s*\n\s*sourceId:\s*(\w+),\s*targetId:\s*(\w+)/gi) || [];
      const traceLinks: ParsedTraceLink[] = [];

      for (const match of traceLinkMatches) {
        const lines = match.split('\n');
        const sourceMatch = match.match(/sourceId:\s*(\w+)/);
        const targetMatch = match.match(/targetId:\s*(\w+)/);
        const relationshipMatch = match.match(/relationshipType:\s*(\w+)/);
        const confidenceMatch = match.match(/confidence:\s*(\w+)/);

        if (sourceMatch && targetMatch) {
          traceLinks.push({
            sourceId: sourceMatch[1],
            targetId: targetMatch[1],
            relationshipType: (relationshipMatch?.[1] as any) || 'tracesTo',
            confidence: (confidenceMatch?.[1] as any) || 'high'
          });
        }
      }

      return traceLinks;
    }

    if (ext === '.md' || ext === '.txt') {
      const contentStr = String(content);
      const refMatches = contentStr.match(/(REF|REQ)-\d+/gi) || [];
      const reqMatches = contentStr.match(/reqId:\s*(\w+)/gi) || [];
      const traceLinks: ParsedTraceLink[] = [];

      for (let i = 0; i < refMatches.length && i < reqMatches.length; i++) {
        traceLinks.push({
          sourceId: refMatches[i],
          targetId: reqMatches[i].split(':')[1].trim(),
          relationshipType: 'tracesTo',
          confidence: 'medium'
        });
      }

      return traceLinks;
    }

    return [];
  }

  // --- Specification documents (.spec.yaml) -------------------------------------

  private buildSpecification(
    filePath: string,
    parsedContent: string | Record<string, unknown>
  ): Specification {
    if (!parsedContent || typeof parsedContent !== 'object') {
      console.warn(
        `[spec.yaml] ${filePath}: empty or non-object content — returning empty specification`
      );
      return { title: '', version: '', status: 'draft', requirements: [] };
    }

    const raw = parsedContent as Record<string, unknown>;

    const title = typeof raw.title === 'string' ? raw.title : '';
    if (!title) {
      console.warn(`[spec.yaml] ${filePath}: missing required field "title"`);
    }

    const version = typeof raw.version === 'string' ? raw.version : '';
    if (!version) {
      console.warn(`[spec.yaml] ${filePath}: missing required field "version"`);
    }

    const status = this.coerceSpecStatus(raw.status, filePath);
    const requirements = this.buildSpecRequirements(raw.requirements, filePath);

    return { title, version, status, requirements };
  }

  private coerceSpecStatus(value: unknown, filePath: string): SpecStatus {
    const allowed: SpecStatus[] = ['draft', 'active', 'deprecated'];
    if (typeof value === 'string' && (allowed as string[]).includes(value)) {
      return value as SpecStatus;
    }
    if (value !== undefined && value !== null) {
      console.warn(
        `[spec.yaml] ${filePath}: invalid status "${String(value)}" — defaulting to "draft"`
      );
    }
    return 'draft';
  }

  private buildSpecRequirements(
    value: unknown,
    filePath: string
  ): SpecRequirement[] {
    if (!Array.isArray(value)) {
      if (value !== undefined && value !== null) {
        console.warn(`[spec.yaml] ${filePath}: "requirements" is not an array — ignoring`);
      }
      return [];
    }

    const requirements: SpecRequirement[] = [];

    for (const [idx, item] of value.entries()) {
      if (!item || typeof item !== 'object') {
        console.warn(`[spec.yaml] ${filePath}: requirement #${idx} is not an object — skipping`);
        continue;
      }
      const req = item as Record<string, unknown>;

      const id = typeof req.id === 'string' ? req.id : '';
      if (!id) {
        console.warn(`[spec.yaml] ${filePath}: requirement #${idx} missing "id" — skipping`);
        continue;
      }

      const title = typeof req.title === 'string' ? req.title : '';
      const priority = this.coerceSpecPriority(req.priority, filePath, id);
      const status = this.coerceSpecRequirementStatus(req.status, filePath, id);
      const references = this.buildSpecReferences(req.references, filePath, id);

      requirements.push({ id, title, priority, status, references });
    }

    return requirements;
  }

  private coerceSpecPriority(value: unknown, filePath: string, reqId: string): SpecPriority {
    const allowed: SpecPriority[] = ['P0', 'P1', 'P2', 'P3'];
    if (typeof value === 'string' && (allowed as string[]).includes(value)) {
      return value as SpecPriority;
    }
    if (value !== undefined && value !== null) {
      console.warn(
        `[spec.yaml] ${filePath}: requirement ${reqId} invalid priority "${String(value)}" — defaulting to "P3"`
      );
    }
    return 'P3';
  }

  private coerceSpecRequirementStatus(
    value: unknown,
    filePath: string,
    reqId: string
  ): SpecRequirementStatus {
    const allowed: SpecRequirementStatus[] = ['proposed', 'approved', 'implemented', 'verified'];
    if (typeof value === 'string' && (allowed as string[]).includes(value)) {
      return value as SpecRequirementStatus;
    }
    if (value !== undefined && value !== null) {
      console.warn(
        `[spec.yaml] ${filePath}: requirement ${reqId} invalid status "${String(value)}" — defaulting to "proposed"`
      );
    }
    return 'proposed';
  }

  private buildSpecReferences(
    value: unknown,
    filePath: string,
    reqId: string
  ): SpecReference[] {
    if (!Array.isArray(value)) {
      if (value !== undefined && value !== null) {
        console.warn(`[spec.yaml] ${filePath}: requirement ${reqId} "references" is not an array`);
      }
      return [];
    }

    const references: SpecReference[] = [];

    for (const [idx, item] of value.entries()) {
      if (!item || typeof item !== 'object') {
        console.warn(
          `[spec.yaml] ${filePath}: requirement ${reqId} reference #${idx} is not an object — skipping`
        );
        continue;
      }
      const ref = item as Record<string, unknown>;
      const type = typeof ref.type === 'string' ? ref.type : '';
      const id = typeof ref.id === 'string' ? ref.id : '';

      const allowedTypes: SpecReferenceType[] = ['req', 'arch', 'test'];
      if (!(allowedTypes as string[]).includes(type)) {
        console.warn(
          `[spec.yaml] ${filePath}: requirement ${reqId} reference #${idx} invalid type "${type}" — skipping`
        );
        continue;
      }
      if (!id) {
        console.warn(
          `[spec.yaml] ${filePath}: requirement ${reqId} reference #${idx} missing "id" — skipping`
        );
        continue;
      }

      references.push({ type: type as SpecReferenceType, id });
    }

    return references;
  }

  private buildSpecTraceLinks(specification: Specification): ParsedTraceLink[] {
    const traceLinks: ParsedTraceLink[] = [];

    for (const req of specification.requirements) {
      for (const ref of req.references) {
        traceLinks.push({
          sourceId: req.id,
          targetId: ref.id,
          relationshipType: ref.type === 'test' ? 'verifies' : 'tracesTo',
          confidence: 'high',
        });
      }
    }

    return traceLinks;
  }

  // --- Architecture Decision Records (.arch.yaml) -------------------------------

  private buildArchitectureDecision(
    filePath: string,
    parsedContent: string | Record<string, unknown>
  ): ArchitectureDecision {
    if (!parsedContent || typeof parsedContent !== 'object') {
      console.warn(
        `[arch.yaml] ${filePath}: empty or non-object content — returning empty decision`
      );
      return this.emptyArchitectureDecision();
    }

    const raw = parsedContent as Record<string, unknown>;

    const title = typeof raw.title === 'string' ? raw.title : '';
    if (!title) {
      console.warn(`[arch.yaml] ${filePath}: missing required field "title"`);
    }

    const status = this.coerceArchitectureDecisionStatus(raw.status, filePath);
    const context = typeof raw.context === 'string' ? raw.context : '';
    const decision = typeof raw.decision === 'string' ? raw.decision : '';
    const consequences = this.buildConsequences(raw.consequences, filePath);

    // Optional fields not in the base spec but allowed for forward-compat.
    const date = typeof raw.date === 'string' ? raw.date : '';
    const deciders = Array.isArray(raw.deciders)
      ? (raw.deciders as unknown[])
          .map((d) => (typeof d === 'string' ? d : String(d)))
          .filter(Boolean)
      : [];
    const supersededBy =
      typeof raw.superseded_by === 'string' && raw.superseded_by.trim()
        ? raw.superseded_by.trim()
        : undefined;

    return {
      id: title ? title : path.basename(filePath, '.arch.yaml'),
      title,
      date,
      status,
      deciders,
      context,
      decision,
      consequences,
      ...(supersededBy ? { supersededBy } : {}),
    };
  }

  private emptyArchitectureDecision(): ArchitectureDecision {
    return {
      id: '',
      title: '',
      date: '',
      status: 'proposed',
      deciders: [],
      context: '',
      decision: '',
      consequences: [],
    };
  }

  private coerceArchitectureDecisionStatus(
    value: unknown,
    filePath: string
  ): ArchitectureDecisionStatus {
    const allowed: ArchitectureDecisionStatus[] = [
      'proposed',
      'accepted',
      'deprecated',
      'superseded',
    ];
    if (typeof value === 'string' && (allowed as string[]).includes(value)) {
      return value as ArchitectureDecisionStatus;
    }
    if (value !== undefined && value !== null) {
      console.warn(
        `[arch.yaml] ${filePath}: invalid status "${String(value)}" — defaulting to "proposed"`
      );
    }
    return 'proposed';
  }

  private buildConsequences(value: unknown, filePath: string): string[] {
    if (!Array.isArray(value)) {
      if (value !== undefined && value !== null) {
        console.warn(
          `[arch.yaml] ${filePath}: "consequences" is not an array — ignoring`
        );
      }
      return [];
    }

    const consequences: string[] = [];
    for (const [idx, item] of value.entries()) {
      if (typeof item !== 'string') {
        console.warn(
          `[arch.yaml] ${filePath}: consequence #${idx} is not a string — skipping`
        );
        continue;
      }
      if (item.trim()) {
        consequences.push(item);
      }
    }
    return consequences;
  }

  private buildAdrTraceLinks(
    decision: ArchitectureDecision,
    filePath: string
  ): ParsedTraceLink[] {
    if (!decision.supersededBy) return [];

    return [
      {
        sourceId: decision.id || path.basename(filePath, '.arch.yaml'),
        targetId: decision.supersededBy,
        relationshipType: 'tracesTo',
        confidence: 'high',
      },
    ];
  }

  // --- Architecture Decision Records (ADR-*.md) ---------------------------------

  private buildAdrMarkdownDecision(
    filePath: string,
    content: string
  ): ArchitectureDecision {
    const { frontmatter, body } = this.splitAdrMarkdown(content, filePath);
    const hasFrontmatterTitle = Boolean(
      typeof frontmatter.title === 'string' && frontmatter.title.trim()
    );
    const sections = this.parseAdrMarkdownBody(body, hasFrontmatterTitle);

    const title =
      (typeof frontmatter.title === 'string' && frontmatter.title.trim()) ||
      sections.title ||
      '';
    if (!title) {
      console.warn(`[ADR-*.md] ${filePath}: missing title (frontmatter or # heading)`);
    }

    const status = this.coerceArchitectureDecisionStatus(frontmatter.status, filePath);

    const dateRaw = frontmatter.date;
    const date =
      dateRaw instanceof Date
        ? dateRaw.toISOString().slice(0, 10)
        : typeof dateRaw === 'string'
          ? dateRaw
          : dateRaw != null
            ? String(dateRaw)
            : '';

    const deciders = Array.isArray(frontmatter.deciders)
      ? (frontmatter.deciders as unknown[])
          .map((d) => (typeof d === 'string' ? d : String(d)))
          .filter(Boolean)
      : [];

    const supersededBy =
      (typeof frontmatter.superseded_by === 'string' && frontmatter.superseded_by.trim()) ||
      (typeof frontmatter.supersededBy === 'string' && frontmatter.supersededBy.trim()) ||
      undefined;

    const id = path.basename(filePath, '.md');

    return {
      id,
      title,
      date,
      status,
      deciders,
      context: sections.context,
      decision: sections.decision,
      consequences: this.splitAdrConsequences(sections.consequences),
      ...(supersededBy ? { supersededBy } : {}),
    };
  }

  /**
   * Split an ADR markdown document into its YAML frontmatter object and the
   * remaining Markdown body. Malformed frontmatter is logged and degraded to an
   * empty object so the body can still be parsed.
   */
  private splitAdrMarkdown(
    content: string,
    filePath: string
  ): { frontmatter: Record<string, unknown>; body: string } {
    const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
    if (!match) {
      return { frontmatter: {}, body: content };
    }

    const frontmatterRaw = match[1];
    const body = match[2] ?? '';

    try {
      const parsed = yaml.load(frontmatterRaw);
      if (parsed && typeof parsed === 'object') {
        return { frontmatter: parsed as Record<string, unknown>, body };
      }
      console.warn(`[ADR-*.md] ${filePath}: frontmatter is not a mapping — ignoring`);
      return { frontmatter: {}, body };
    } catch (error) {
      console.warn(
        `[ADR-*.md] ${filePath}: malformed YAML frontmatter — ${(error as Error).message}`
      );
      return { frontmatter: {}, body };
    }
  }

  /**
   * Parse the Markdown body of an ADR into its titled sections. Captures the
   * `## Context` / `## Decision` / `## Consequences` sections (tolerating H1 or
   * H2 markers and case). When the document has no frontmatter title, the first
   * heading doubles as the document title (buildAdrMarkdownDecision prefers the
   * frontmatter title when present, so section extraction is unaffected).
   */
  private parseAdrMarkdownBody(
    body: string,
    hasFrontmatterTitle: boolean
  ): {
    title?: string;
    context: string;
    decision: string;
    consequences: string;
  } {
    const parts = body.split(/^#{1,2}\s+(.+?)\s*$/m);
    let title: string | undefined;
    let titleAssigned = false;
    const sections: Record<string, string> = {};

    for (let i = 1; i < parts.length; i += 2) {
      const heading = (parts[i] ?? '').trim();
      const sectionBody = (parts[i + 1] ?? '').trim();
      const lower = heading.toLowerCase();

      // Without a frontmatter title, the first heading is the document title.
      if (!hasFrontmatterTitle && !titleAssigned) {
        title = heading;
        titleAssigned = true;
        continue;
      }

      if (lower.includes('context')) sections.context = sectionBody;
      else if (lower.includes('decision')) sections.decision = sectionBody;
      else if (lower.includes('consequences')) sections.consequences = sectionBody;
      else if (!titleAssigned) {
        title = heading;
        titleAssigned = true;
      }
    }

    // Prose before the first heading becomes the title when no heading exists.
    const before = (parts[0] ?? '').trim();
    if (before && !titleAssigned) {
      title = before.split('\n')[0];
    }

    return {
      title,
      context: sections.context ?? '',
      decision: sections.decision ?? '',
      consequences: sections.consequences ?? '',
    };
  }

  /**
   * Split the Consequences section text into an array of items. Markdown
   * bullet lists (`-`/`*` items) become individual entries with their markers
   * stripped; prose blocks are kept intact. Mirrors the list-array semantics
   * of the `.arch.yaml` decision parser.
   */
  private splitAdrConsequences(text: string): string[] {
    const blocks = text
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter(Boolean);

    const out: string[] = [];
    for (const block of blocks) {
      const lines = block.split('\n');
      const isList = lines.length > 0 && lines.every((l) => /^[-*]\s+/.test(l.trim()));

      if (isList) {
        for (const line of lines) {
          const item = line.trim().replace(/^[-*]\s+/, '').trim();
          if (item) out.push(item);
        }
      } else {
        out.push(block);
      }
    }

    return out;
  }
}

export const repositoryParser = new RepositoryParser();