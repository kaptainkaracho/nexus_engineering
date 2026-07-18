import * as path from 'path';
import { fileURLToPath } from 'url';
import { repositoryParser } from './repositoryParser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runTests() {
  let passed = 0;
  let failed = 0;

  console.log('🧪 Running Repository Parser Unit Tests');
  console.log('='.repeat(50));

  try {
    // Test 1: Parse .req.yaml file with trace links
    console.log('\n✓ Test 1: Parse requirement YAML file with trace links');
    const yamlFiles = [
      {
        filePath: path.resolve(__dirname, '../../../../packages/shared/requirements/sample-req-with-traces.req.yaml'),
        relativePath: 'packages/shared/requirements/sample-req-with-traces.req.yaml',
        size: 1000,
        contentHash: 'hash',
        contentType: 'text' as const,
        detectedType: 'requirement' as const
      }
    ];
    
    const result1 = await repositoryParser.parse(yamlFiles, '.');
    
    if (!result1.documents || result1.documents.length === 0) {
      throw new Error('Parser should have found at least one document in the requirement file');
    }
    
    const doc1 = result1.documents[0];
    if (!doc1.id) throw new Error('Document should have an ID');
    if (doc1.detectedType !== 'requirement') throw new Error('Document detectedType should be "requirement"');
    if (doc1.type !== 'Md') throw new Error('Requirement YAML should be parsed as Md type');
    // Title may come from nexus.metadata.domain or individual requirements
    
    if (!doc1.traceLinks || doc1.traceLinks.length === 0) {
      throw new Error('Document should have extracted trace links');
    }
    
    const traceLink = doc1.traceLinks[0];
    if (!traceLink.sourceId) throw new Error('Trace link should have sourceId');
    if (!traceLink.targetId) throw new Error('Trace link should have targetId');
    if (!traceLink.relationshipType) throw new Error('Trace link should have relationshipType');
    if (!traceLink.confidence) throw new Error('Trace link should have confidence');
    
    console.log(`  ✓ Parsed requirement document with title: ${doc1.metadata.title}`);
    console.log(`  ✓ Extracted ${doc1.traceLinks.length} trace links`);
    passed++;

    // Test 2: Parse TypeScript file
    console.log('\n✓ Test 2: Parse TypeScript file to software component');
    const tsFiles = [
      {
        filePath: __filename,
        relativePath: __filename,
        size: 1000,
        contentHash: 'hash',
        contentType: 'text' as const,
        detectedType: 'softwareComponent' as const
      }
    ];
    
    const result2 = await repositoryParser.parse(tsFiles, '.');
    
    if (!result2.documents || result2.documents.length === 0) {
      throw new Error('Parser should have found a document in the TypeScript file');
    }
    
    const doc2 = result2.documents[0];
    if (!doc2.id) throw new Error('Document should have an ID');
    if (doc2.detectedType !== 'softwareComponent') throw new Error('Document detectedType should be "softwareComponent"');
    if (doc2.type !== 'Txt') throw new Error('TypeScript file should be parsed as Txt type');
    if (doc2.content === null || doc2.content === undefined) throw new Error('Document should have content');
    if (typeof doc2.content !== 'string') throw new Error('TypeScript content should be string');
    if (doc2.traceLinks && doc2.traceLinks.length > 0) {
      throw new Error('TypeScript file should not have trace links');
    }
    
    console.log(`  ✓ Parsed TypeScript document with content length: ${String(doc2.content).length}`);
    passed++;

    // Test 3: Parse JSON file
    console.log('\n✓ Test 3: Parse JSON file to document');
    const jsonFiles = [
      {
        filePath: './package.json',
        relativePath: './package.json',
        size: 1000,
        contentHash: 'hash',
        contentType: 'text' as const,
        detectedType: undefined
      }
    ];
    
    const result3 = await repositoryParser.parse(jsonFiles, '.');
    
    if (!result3.documents || result3.documents.length === 0) {
      throw new Error('Parser should have found a document in the JSON file');
    }
    
    const doc3 = result3.documents[0];
    if (!doc3.id) throw new Error('Document should have an ID');
    if (doc3.detectedType) throw new Error('JSON file detectedType should be undefined when not provided');
    if (doc3.type !== 'Json') throw new Error('JSON file should be parsed as Json type');
    if (typeof doc3.content !== 'object') throw new Error('JSON content should be object');
    
    const keys = Array.isArray(doc3.content)
      ? doc3.content.join(', ')
      : typeof doc3.content === 'object' && doc3.content !== null
        ? Object.keys(doc3.content).join(', ')
        : 'object';
    console.log(`  ✓ Parsed JSON document with keys: ${keys}`);
    passed++;

    // Test 4: Parse with invalid file (should error gracefully)
    console.log('\n✓ Test 4: Handle invalid files gracefully');
    const invalidFiles = [
      {
        filePath: '/nonexistent/file.txt',
        relativePath: '/nonexistent/file.txt',
        size: 0,
        contentHash: 'hash',
        contentType: 'text' as const,
        detectedType: undefined
      }
    ];
    
    const result4 = await repositoryParser.parse(invalidFiles, '.');
    
    if (!result4.documents || result4.documents.length > 0) {
      throw new Error('Parser should not create documents for invalid files');
    }
    
    if (!result4.errors || result4.errors.length === 0) {
      throw new Error('Parser should have recorded errors for invalid files');
    }
    
    const error = result4.errors[0];
    if (!error.filePath) throw new Error('Error should have filePath');
    if (!error.error) throw new Error('Error should have error message');
    
    console.log(`  ✓ Parser gracefully handled invalid file with error: ${error.error}`);
    passed++;

    // Test 5: Empty file list
    console.log('\n✓ Test 5: Handle empty file list');
    const result5 = await repositoryParser.parse([], '.');
    
    if (!result5.documents || result5.documents.length !== 0) {
      throw new Error('Parser should return empty documents list for empty input');
    }
    
    if (result5.errors && result5.errors.length > 0) {
      throw new Error('Parser should not produce errors for empty file list');
    }
    
    if (typeof result5.parseTimeMs !== 'number' || result5.parseTimeMs < 0) {
      throw new Error('Parse time should be a positive number');
    }
    
    console.log(`  ✓ Parsed empty file list (time: ${result5.parseTimeMs}ms)`);
    passed++;

    // Test 6: Performance check (parse should complete quickly)
    console.log('\n✓ Test 6: Performance validation');
    const files = [
      {
        filePath: __filename,
        relativePath: __filename,
        size: 1000,
        contentHash: 'hash',
        contentType: 'text' as const,
        detectedType: 'softwareComponent' as const
      }
    ];
    
    const start = performance.now();
    await repositoryParser.parse(files, '.');
    const elapsed = performance.now() - start;

    if (elapsed > 1000) {
      console.warn(`  ⚠️  Parse took ${elapsed.toFixed(2)}ms (slow)`);
    } else {
      console.log(`  ✓ Parse completed in ${elapsed.toFixed(2)}ms`);
    }
    passed++;

  } catch (error) {
    console.error('\n✗ Test failed:', error);
    console.error(error instanceof Error ? error.stack : String(error));
    failed++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Test suite failed with unhandled error:', error);
  process.exit(1);
});