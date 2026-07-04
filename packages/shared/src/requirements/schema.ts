import type { RequirementSchema } from '../types';

/**
 * JSON Schema for validating requirement documents (.req.yaml files)
 */
export const reqDocSchema: any = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    nexus: {
      type: 'object',
      properties: {
        schema: { 
          type: 'string', 
          enum: ['req-doc/v1'] 
        },
        metadata: {
          type: 'object',
          properties: {
            domain: { type: 'string' },
            version: { type: 'string' },
            source: { type: 'string' }
          },
          required: ['domain', 'version', 'source']
        }
      },
      required: ['schema', 'metadata']
    },
    requirements: {
      type: 'array',
      items: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { 
            type: 'string',
            enum: ['functional', 'non-functional', 'system', 'user'] 
          },
          title: { type: 'string' },
          description: { type: 'string' },
          priority: { 
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'] 
          },
          status: { 
            type: 'string',
            enum: ['proposed', 'approved', 'rejected', 'implemented', 'verified'] 
          },
          tags: {
            type: 'array',
            items: { type: 'string' }
          },
          traceLinks: {
            type: 'array',
            items: {
              $schema: 'http://json-schema.org/draft-07/schema#',
              type: 'object',
              properties: {
                type: { 
                  type: 'string',
                  enum: ['verifies', 'satisfies', 'dependsOn', 'tracesTo', 'refines', 'conflictsWith'] 
                },
                target: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    documentId: { type: 'string' }
                  },
                  required: ['id', 'documentId']
                },
                confidence: { 
                  type: 'string',
                  enum: ['high', 'medium', 'low'] 
                },
                description: { type: 'string' }
              },
              required: ['type', 'target']
            }
          }
        },
        required: ['id', 'type', 'title', 'description', 'priority', 'status']
      }
    }
  },
  required: ['nexus', 'requirements']
};

/**
 * Re-export the individual requirement schema for reuse
 */
export type { RequirementSchema };