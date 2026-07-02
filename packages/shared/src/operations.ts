import { BaseEntity } from './types';

// Engineering document types for artifact scanning
export type DocumentType = 'Txt' | 'Json' | 'Xml' | 'Html' | 'Md';

export interface Document extends BaseEntity {
  path: string;
  content: string | Record<string, unknown>;
  type: DocumentType;
}

export interface DocumentOperation {
  repositoryPath?: string;
  documents?: Document[];
  error?: string;
}

export interface RepositoryDocumentOperation extends DocumentOperation {
  repositoryPath: string;
  documents: Document[];
}

export interface Operation {
  type: 'createRepository' | 'scanRepository' | 'updateRepository';
  data?: RepositoryDocumentOperation;
}