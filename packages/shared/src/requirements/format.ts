import { Requirement } from '../types';

/**
 * Metadata for Nexus requirement documents
 */
export interface NexusMetadata {
  schema: 'req-doc/v1';
  domain: string;
  version: string;
  source: string;
}

/**
 * Complete Nexus requirement document structure
 */
export interface NexusDocument {
  nexus: NexusMetadata;
  requirements: Requirement[];
}