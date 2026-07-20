/**
 * Type definitions for Nexus Features as Code documents (.feature.yaml).
 *
 * FAC (Features as Code) captures product features, their user stories and
 * acceptance criteria, and links each feature back to the requirements it
 * satisfies. This closes the V-Model traceability chain:
 *   Requirements <-> Features <-> Tests <-> Results
 */

/**
 * Metadata for Nexus Features as Code documents
 */
export interface FeatureNexusMetadata {
  schema: 'feature-doc/v1';
  metadata: {
    domain: string;
    version: string;
    source: string;
    author?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

/**
 * A link from a feature back to the requirement (or other artifact) it traces to
 */
export interface FeatureTraceLink {
  type:
    | 'satisfies'
    | 'dependsOn'
    | 'tracesTo'
    | 'refines'
    | 'conflictsWith'
    | 'derivedFrom';
  target: { id: string; documentId: string };
  confidence?: 'high' | 'medium' | 'low';
  description?: string;
}

/**
 * A single acceptance criterion expressed in the Given/When/Then form
 */
export interface AcceptanceCriterion {
  id: string;
  given?: string;
  when?: string;
  then: string;
  description?: string;
}

/**
 * A user story following the Role / Goal / Benefit template
 */
export interface UserStory {
  id: string;
  role: string;
  want: string;
  soThat?: string;
  acceptanceCriteria: AcceptanceCriterion[];
}

/**
 * Lifecycle status of a feature
 */
export type FeatureStatus = 'draft' | 'approved' | 'implemented' | 'deprecated';

/**
 * A single product feature
 */
export interface Feature {
  id: string;
  name: string;
  description: string;
  status?: FeatureStatus;
  userStories: UserStory[];
  traceLinks?: FeatureTraceLink[];
}

/**
 * Complete Nexus Features as Code document structure
 */
export interface FeatureDocument {
  nexus: FeatureNexusMetadata;
  features: Feature[];
}

export interface FeatureLoadResult {
  document: FeatureDocument | null;
  errors: Map<string, string[]>;
  violations?: any[];
}
