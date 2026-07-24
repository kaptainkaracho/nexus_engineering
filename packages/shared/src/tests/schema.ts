export const testDocSchema: any = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    nexus: {
      type: 'object',
      properties: {
        schema: {
          type: 'string',
          enum: ['test-doc/v1'],
        },
        metadata: {
          type: 'object',
          properties: {
            domain: { type: 'string' },
            version: { type: 'string' },
            source: { type: 'string' },
          },
          required: ['domain', 'version', 'source'],
        },
      },
      required: ['schema', 'metadata'],
    },
    suites: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          domain: { type: 'string' },
          cases: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                type: {
                  type: 'string',
                  enum: ['unit', 'integration', 'e2e', 'performance', 'security', 'usability'],
                },
                priority: {
                  type: 'string',
                  enum: ['low', 'medium', 'high', 'critical'],
                },
                description: { type: 'string' },
                traceLinks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: {
                        type: 'string',
                        enum: ['verifies', 'satisfies', 'dependsOn', 'tracesTo', 'refines', 'conflictsWith'],
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
                scenario: {
                  type: 'object',
                  properties: {
                    given: { type: 'string' },
                    when: { type: 'string' },
                    then: { type: 'string' },
                  },
                  required: ['given', 'when', 'then'],
                },
                acceptanceCriteria: {
                  type: 'array',
                  items: { type: 'string' },
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                },
                automated: { type: 'boolean' },
                steps: {
                  type: 'array',
                  items: { type: 'string' },
                },
                expectedResult: { type: 'string' },
              },
              required: ['id', 'title', 'type', 'priority'],
            },
          },
        },
        required: ['id', 'name', 'cases'],
      },
    },
  },
  required: ['nexus', 'suites'],
};
