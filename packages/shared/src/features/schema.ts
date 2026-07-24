/**
 * JSON Schema for validating Features as Code documents (.feature.yaml files).
 *
 * FAC (Features as Code) records product features, their user stories and
 * acceptance criteria, and links each feature back to the requirements it
 * satisfies. The schema version is `feature-doc/v1`.
 */
export const featureDocSchema: any = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    nexus: {
      type: 'object',
      properties: {
        schema: {
          type: 'string',
          enum: ['feature-doc/v1'],
        },
        metadata: {
          type: 'object',
          properties: {
            domain: { type: 'string' },
            version: { type: 'string' },
            source: { type: 'string' },
            author: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
          required: ['domain', 'version', 'source'],
        },
      },
      required: ['schema', 'metadata'],
    },
    features: {
      type: 'array',
      items: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          status: {
            type: 'string',
            enum: ['draft', 'approved', 'implemented', 'deprecated'],
          },
          userStories: {
            type: 'array',
            items: {
              $schema: 'http://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                id: { type: 'string' },
                role: { type: 'string' },
                want: { type: 'string' },
                soThat: { type: 'string' },
                acceptanceCriteria: {
                  type: 'array',
                  items: {
                    $schema: 'http://json-schema.org/draft-07/schema#',
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      given: { type: 'string' },
                      when: { type: 'string' },
                      then: { type: 'string' },
                      description: { type: 'string' },
                    },
                    required: ['id', 'then'],
                  },
                },
              },
              required: ['id', 'role', 'want', 'acceptanceCriteria'],
            },
          },
          traceLinks: {
            type: 'array',
            items: {
              $schema: 'http://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: [
                    'satisfies',
                    'dependsOn',
                    'tracesTo',
                    'refines',
                    'conflictsWith',
                    'derivedFrom',
                  ],
                },
                target: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    documentId: { type: 'string' },
                  },
                  required: ['id', 'documentId'],
                },
                confidence: {
                  type: 'string',
                  enum: ['high', 'medium', 'low'],
                },
                description: { type: 'string' },
              },
              required: ['type', 'target'],
            },
          },
        },
        required: ['id', 'name', 'description', 'userStories'],
      },
    },
  },
  required: ['nexus', 'features'],
};

/**
 * Re-export the individual feature schema type for reuse
 */
export type { FeatureDocument } from './format';
