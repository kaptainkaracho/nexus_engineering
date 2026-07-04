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
  detectedType?: 'requirement' | 'architectureModel' | 'softwareComponent' | 'testCase' | 'traceLink';
  content: string | Record<string, unknown>;
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
          return yaml.load(content);
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
      if ('description' in content) metadata.title = String(content.description);
      if ('language' in content) metadata.language = String(content.language);
      if ('technologies' in content) metadata.technologies = Array.isArray(content.technologies) ? content.technologies : [];
      if ('dependencies' in content) metadata.dependencies = Array.isArray(content.dependencies) ? content.dependencies : [];
      if ('tags' in content) metadata.tags = Array.isArray(content.tags) ? content.tags : [];
      if ('nexus' in content) {
        metadata.title = String(content.nexus.metadata.title || '');
        metadata.language = String(content.nexus.metadata.domain || '');
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
            for (const link of req.traceLinks) {
              if (link.target && link.target.id && link.type) {
                traceLinks.push({
                  sourceId: req.id,
                  targetId: link.target.id,
                  targetDocumentId: link.target.documentId,
                  relationshipType: link.type,
                  confidence: link.confidence || 'high'
                });
              }
            }
          }
        }

        return traceLinks;
      }
    }

    return [];
  }
}

export const repositoryParser = new RepositoryParser();