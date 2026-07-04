import { repositoryScanner } from './repositoryScanner.ts';

async function runTests() {
  let passed = 0;
  let failed = 0;

  console.log('🧪 Running RepositoryReader Unit Tests');
  console.log('='.repeat(50));

  try {
    // Test 1: Basic scan functionality
    console.log('\n✓ Test 1: Basic scan of current directory');
    const result = await repositoryScanner.scan('.');
    
    // Verify ScanResult structure
    if (!result.report) throw new Error('ScanResult missing report');
    if (!result.files || !Array.isArray(result.files)) throw new Error('ScanResult missing files array');
    
    console.log(`  Found ${result.report.filesFound} files`);
    console.log(`  Scanned in ${result.report.scanTimeMs.toFixed(2)}ms`);
    passed++;

    // Test 2: File metadata extraction with content hash
    console.log('\n✓ Test 2: File metadata extraction');
    const metadata = await repositoryScanner.getFileMetadata(__filename);
    
    if (!metadata) throw new Error('getFileMetadata returned null');
    
    // Verify FileMetadata structure
    const requiredFields = [
      'filePath', 'relativePath', 'contentType', 
      'fileSizeBytes', 'lastModified', 'contentHash', 'extension'
    ];
    
    for (const field of requiredFields) {
      if (!(field in metadata)) throw new Error(`FileMetadata missing ${field}`);
    }
    
    console.log(`  Path: ${metadata.relativePath}`);
    console.log(`  Type: ${metadata.contentType}`);
    console.log(`  Size: ${metadata.fileSizeBytes} bytes`);
    console.log(`  Hash: ${metadata.contentHash.substring(0, 16)}...`);
    passed++;

    // Test 3: Streaming with pattern matching
    console.log('\n✓ Test 3: Async file streaming');
    const streamedFiles = [];
    
    for await (const fileEntry of repositoryScanner.streamFiles(['**/*.ts'])) {
      streamedFiles.push(fileEntry);
      
      // Verify FileEntry structure
      if (!fileEntry.relativePath) throw new Error('FileEntry missing relativePath');
      if (!fileEntry.contentType) throw new Error('FileEntry missing contentType');
      if (typeof fileEntry.fileSizeBytes !== 'number') throw new Error('FileEntry: fileSizeBytes not a number');
      if (typeof fileEntry.isBinary !== 'boolean') throw new Error('FileEntry: isBinary not a boolean');
    }
    
    console.log(`  Streamed ${streamedFiles.length} TypeScript files`);
    passed++;

    // Test 4: Content hash consistency (scan vs getFileMetadata)
    console.log('\n✓ Test 4: Content hash consistency');
    const scanDir = '.';
    const fullScan = await repositoryScanner.scan(scanDir);
    
    if (fullScan.files.length > 0) {
      const firstFile = fullScan.files[0];
      const directMetadata = await repositoryScanner.getFileMetadata(firstFile.filePath);
      
      if (!directMetadata) throw new Error('Could not get metadata for first file');
      
      console.log(`  Comparing hashes for: ${firstFile.relativePath}`);
      if (firstFile.contentHash !== directMetadata.contentHash) {
        throw new Error('Content hash mismatch between scan and getFileMetadata');
      }
      console.log('  ✓ Content hashes match');
    } else {
      console.log('  ⚠️  No files found in current directory (skipping hash check)');
    }
    passed++;

    // Test 5: ScanReport structure validation
    console.log('\n✓ Test 5: ScanReport structure validation');
    const scanData = await repositoryScanner.scan('.');
    
    if (typeof scanData.report.filesFound !== 'number') throw new Error('filesFound not a number');
    if (typeof scanData.report.directoriesScanned !== 'number') throw new Error('directoriesScanned not a number');
    if (typeof scanData.report.scanTimeMs !== 'number') throw new Error('scanTimeMs not a number');
    
    if (!(scanData.report.startDate instanceof Date)) throw new Error('startDate not a Date');
    if (!(scanData.report.endDate instanceof Date)) throw new Error('endDate not a Date');
    
    // Verify endDate > startDate
    if (scanData.report.endDate <= scanData.report.startDate) {
      throw new Error('ScanReport: endDate should be after startDate');
    }
    
    console.log(`  Timestamps valid: ${scanData.report.startDate.toISOString()} → ${scanData.report.endDate.toISOString()}`);
    passed++;

    // Test 6: YAML/Markdown detection (if present)
    console.log('\n✓ Test 6: File type classification');
    const allFiles = await repositoryScanner.scan('.');
    
    const extensionsFound = new Set(allFiles.files.map(f => f.extension.toLowerCase()));
    const extensionStats = {};
    
    Array.from(extensionsFound).forEach(ext => {
      extensionStats[ext] = allFiles.files.filter(f => f.extension.toLowerCase() === ext).length;
    });
    
    console.log('  File types found:');
    for (const [ext, count] of Object.entries(extensionStats)) {
      if (['.ts', '.js', '.json', '.md', '.yaml', '.yml'].includes(ext.toLowerCase())) {
        console.log(`    ${ext.padEnd(8)}: ${count} files`);
      }
    }
    passed++;

    // Test 7: Performance check (scan should complete quickly)
    console.log('\n✓ Test 7: Performance validation');
    const start = performance.now();
    await repositoryScanner.scan('.');
    const elapsed = performance.now() - start;
    
    if (elapsed > 1000) {
      console.warn(`  ⚠️  Scan took ${elapsed.toFixed(2)}ms (slow)`);
    } else {
      console.log(`  ✓ Scan completed in ${elapsed.toFixed(2)}ms`);
    }
    passed++;

  } catch (error) {
    console.error('\n✗ Test failed:', error);
    console.error(error.stack);
    failed++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed with unhandled error:', error);
  process.exit(1);
});