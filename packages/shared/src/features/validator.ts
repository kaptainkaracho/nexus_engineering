import type { FeatureDocument } from './format';

const VALID_STATUSES = new Set(['draft', 'approved', 'implemented', 'deprecated']);

const VALID_TRACE_TYPES = new Set([
  'satisfies',
  'dependsOn',
  'tracesTo',
  'refines',
  'conflictsWith',
  'derivedFrom',
]);

/**
 * Validates the logical consistency of a FAC document beyond structural schema.
 */
export function validateFeatures(doc: FeatureDocument): Map<string, string[]> {
  const errors = new Map<string, string[]>();

  if (!doc.features || doc.features.length === 0) return errors;

  const seenFeatureIds = new Set<string>();

  for (const feature of doc.features) {
    const featureErrors: string[] = [];

    if (seenFeatureIds.has(feature.id)) {
      featureErrors.push(`Duplicate feature id '${feature.id}'`);
    }
    seenFeatureIds.add(feature.id);

    if (feature.status && !VALID_STATUSES.has(feature.status)) {
      featureErrors.push(`Invalid status '${feature.status}'`);
    }

    if (!feature.userStories || feature.userStories.length === 0) {
      featureErrors.push(`Feature '${feature.id}' has no user stories`);
    }

    const seenStoryIds = new Set<string>();
    for (const story of feature.userStories || []) {
      if (seenStoryIds.has(story.id)) {
        featureErrors.push(`Duplicate user story id '${story.id}' in feature '${feature.id}'`);
      }
      seenStoryIds.add(story.id);

      if (!story.acceptanceCriteria || story.acceptanceCriteria.length === 0) {
        featureErrors.push(`User story '${story.id}' has no acceptance criteria`);
      }

      const seenACIds = new Set<string>();
      for (const ac of story.acceptanceCriteria || []) {
        if (seenACIds.has(ac.id)) {
          featureErrors.push(`Duplicate acceptance criterion id '${ac.id}' in story '${story.id}'`);
        }
        seenACIds.add(ac.id);

        if (!ac.then && !ac.description) {
          featureErrors.push(`Acceptance criterion '${ac.id}' requires 'then' or 'description'`);
        }
      }
    }

    for (const link of feature.traceLinks || []) {
      if (!VALID_TRACE_TYPES.has(link.type)) {
        featureErrors.push(`Invalid trace link type '${link.type}' in feature '${feature.id}'`);
      }
      if (!link.target?.id || !link.target?.documentId) {
        featureErrors.push(`Trace link in feature '${feature.id}' has incomplete target`);
      }
    }

    if (featureErrors.length > 0) {
      errors.set(feature.id, featureErrors);
    }
  }

  return errors;
}

export interface FeatureDocumentValidationResult {
  valid: boolean;
  errors?: Map<string, string[]>;
}

/**
 * Complete validation pipeline for a Features as Code document.
 */
export async function validateFeatureDocument(
  doc: FeatureDocument,
): Promise<FeatureDocumentValidationResult> {
  const errors = new Map<string, string[]>();

  try {
    if (!doc.nexus || !doc.features) {
      return {
        valid: false,
        errors: new Map([['document', ['Invalid feature document structure']]]),
      };
    }

    const featureErrors = validateFeatures(doc);
    for (const [key, errorList] of featureErrors.entries()) {
      errors.set(key, errorList);
    }

    return {
      valid: errors.size === 0,
      ...(errors.size > 0 && { errors }),
    };
  } catch (error) {
    return {
      valid: false,
      errors: new Map([['document', ['Failed to validate feature document: ' + (error as Error).message]]]),
    };
  }
}

export type { FeatureDocument };
