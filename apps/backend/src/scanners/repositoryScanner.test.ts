import { scanner } from './repositoryScanner'

async function testScanner() {
  console.log('Testing scanner...')
  
  try {
    // Test scanning current directory (limit depth)
    const report = await scanner.scan('.')
    console.log('Scan completed:', report)
  } catch (error) {
    console.error('Test failed:', error)
    process.exit(1)
  }
}
testScanner()