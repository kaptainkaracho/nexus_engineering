import { repositoryScanner } from './repositoryScanner'

async function testScanner() {
  console.log('Testing scanner...')
  
  try {
    // Test scanning current directory with default options
    const result = await repositoryScanner.scan('.')
    console.log('Scan result:', result)
    console.log('Files found:', result.report.filesFound)
    console.log('Scan time:', result.report.scanTimeMs, 'ms')
    
    // Test getFileMetadata
    const metadata = await repositoryScanner.getFileMetadata(__filename)
    console.log('File metadata:', metadata)
    
    // Test streaming files
    console.log('\nStreaming files...')
    for await (const file of repositoryScanner.streamFiles(['**/*.ts', '**/*.js'])) {
      console.log(`Found: ${file.relativePath} (${file.contentType})`)
    }
    
    console.log('\nAll tests passed!')
  } catch (error) {
    console.error('Test failed:', error)
    process.exit(1)
  }
}

testScanner()