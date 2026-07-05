import { GraphBuilder, type TraceabilityGraph } from './graphBuilder'

// Simple integration test
const mockLink = {
  id: 'link-1',
  version: '1.0',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sourceId: 'req-1',
  sourceType: 'requirement',
  targetId: 'test-1',
  targetType: 'testCase',
  relationshipType: 'verifies',
  confidence: 'high',
  description: 'Test link'
}

const builder = new GraphBuilder([mockLink])
const graph = builder.buildGraph()

if (graph.nodes.length !== 2) throw new Error('Expected 2 nodes')
if (graph.edges.length !== 1) throw new Error('Expected 1 edge')

if (graph.nodes[0].id !== 'req-1' || graph.nodes[1].id !== 'test-1') throw new Error('Wrong nodes')
if (graph.edges[0].sourceId !== 'req-1' || graph.edges[0].targetId !== 'test-1') throw new Error('Wrong edge')

const filteredGraph = builder.filterBySourceType(['requirement']).buildGraph()
if (filteredGraph.edges.length !== 1) throw new Error('Filter failed')

const sortedGraph = builder.sortByConfidence().buildGraph()
if (sortedGraph.edges[0].confidence !== 'high') throw new Error('Sort failed')

console.log('All tests passed!')