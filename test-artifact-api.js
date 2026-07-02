// Test script for verifying the Artifact API implementation
import fs from 'fs'
import path from 'path'

// Add a .gitignore to ignore test log files
const gitignoreContent = `
# Test logs
*.log

test-results/
`;

fs.writeFileSync('.gitignore', gitignoreContent, 'utf8')

// Create test results directory
if (!fs.existsSync('test-results')) {
  fs.mkdirSync('test-results')
}

// Test results will be written here
const testResults = {
  startTime: new Date().toISOString(),
  tests: [],
  passed: 0,
  failed: 0
}

// Write test script for the artifact API
const testScript = `
#!/usr/bin/env node

// Test the Artifact API endpoints
// This script tests the complete artifact management functionality

const http = require('http')
const fs = require('fs')
const path = require('path')

const BASE_URL = 'http://localhost:3001'

// Helper functions
function makeRequest(method, url, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const options = {
      method,
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonData
          })
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          })
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    if (body) {
      req.write(JSON.stringify(body))
    }
    req.end()
  })
}

async function runTests() {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  }

  try {
    // Test 1: Check server health
    console.log('Test 1: Checking server health...')
    try {
      const health = await makeRequest('GET', `${BASE_URL}/health`)
      if (health.statusCode === 200 && health.body.status === 'ok') {
        results.tests.push({ name: 'Health Check', passed: true })
        results.passed++
        console.log('✓ Health check passed')
      } else {
        results.tests.push({ name: 'Health Check', passed: false, error: 'Invalid response' })
        results.failed++
        console.log('✗ Health check failed')
      }
    } catch (error) {
      results.tests.push({ name: 'Health Check', passed: false, error: error.message })
      results.failed++
      console.log('✗ Health check failed:', error.message)
    }

    // Test 2: List repositories
    console.log('\nTest 2: Listing repositories...')
    try {
      const repos = await makeRequest('GET', `${BASE_URL}/api/v1/artifacts/repositories`)
      if (repos.statusCode === 200 && Array.isArray(repos.body.data)) {
        results.tests.push({ name: 'List Repositories', passed: true })
        results.passed++
        console.log('✓ List repositories passed')
      } else {
        results.tests.push({ name: 'List Repositories', passed: false, error: 'Invalid response' })
        results.failed++
        console.log('✗ List repositories failed')
      }
    } catch (error) {
      results.tests.push({ name: 'List Repositories', passed: false, error: error.message })
      results.failed++
      console.log('✗ List repositories failed:', error.message)
    }

    // Test 3: Add artifacts (create a test artifact)
    console.log('\nTest 3: Adding test artifacts...')
    const testArtifact = {
      repositoryPath: '/test/repo',
      documents: [
        {
          id: 'test-artifact-1',
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          source: 'scanner',
          path: '/test/repo/file1.json',
          content: { test: 'artifact1' },
          type: 'Json'
        },
        {
          id: 'test-artifact-2',
          version: '2.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          source: 'scanner',
          path: '/test/repo/file2.md',
          content: 'Test artifact content',
          type: 'Md'
        }
      ]
    }

    try {
      const addResponse = await makeRequest('POST', `${BASE_URL}/api/v1/artifacts`, testArtifact)
      if (addResponse.statusCode === 201 && addResponse.body.success) {
        results.tests.push({ name: 'Add Artifacts', passed: true })
        results.passed++
        console.log('✓ Add artifacts passed')

        // Store the artifact ID for later tests
        const artifactId = testArtifact.documents[0].id

        // Test 4: Get artifacts by ID
        console.log('\nTest 4: Getting artifact by ID...')
        try {
          const getResponse = await makeRequest('GET', `${BASE_URL}/api/v1/artifacts/${artifactId}`)
          if (getResponse.statusCode === 200 && getResponse.body.success && getResponse.body.data.id === artifactId) {
            results.tests.push({ name: 'Get Artifact by ID', passed: true })
            results.passed++
            console.log('✓ Get artifact by ID passed')
          } else {
            results.tests.push({ name: 'Get Artifact by ID', passed: false, error: 'Invalid response' })
            results.failed++
            console.log('✗ Get artifact by ID failed')
          }
        } catch (error) {
          results.tests.push({ name: 'Get Artifact by ID', passed: false, error: error.message })
          results.failed++
          console.log('✗ Get artifact by ID failed:', error.message)
        }

        // Test 5: List repositories again (should have 1 now)
        console.log('\nTest 5: Listing repositories after adding artifact...')
        try {
          const repos = await makeRequest('GET', `${BASE_URL}/api/v1/artifacts/repositories`)
          if (repos.statusCode === 200 && repos.body.data.length >= 1) {
            results.tests.push({ name: 'List Repositories After Add', passed: true })
            results.passed++
            console.log('✓ List repositories after add passed')
          } else {
            results.tests.push({ name: 'List Repositories After Add', passed: false, error: 'Invalid response' })
            results.failed++
            console.log('✗ List repositories after add failed')
          }
        } catch (error) {
          results.tests.push({ name: 'List Repositories After Add', passed: false, error: error.message })
          results.failed++
          console.log('✗ List repositories after add failed:', error.message)
        }

        // Test 6: Get artifacts for specific repository
        console.log('\nTest 6: Getting artifacts for specific repository...')
        try {
          const repoArtifacts = await makeRequest('GET', `${BASE_URL}/api/v1/artifacts/repositories/${testArtifact.repositoryPath}`)
          if (repoArtifacts.statusCode === 200 && repoArtifacts.body.success) {
            results.tests.push({ name: 'Get Repository Artifacts', passed: true })
            results.passed++
            console.log('✓ Get repository artifacts passed')
          } else {
            results.tests.push({ name: 'Get Repository Artifacts', passed: false, error: 'Invalid response' })
            results.failed++
            console.log('✗ Get repository artifacts failed')
          }
        } catch (error) {
          results.tests.push({ name: 'Get Repository Artifacts', passed: false, error: error.message })
          results.failed++
          console.log('✗ Get repository artifacts failed:', error.message)
        }

        // Test 7: Update artifact
        console.log('\nTest 7: Updating artifact...')
        const updateArtifact = {
          repositoryPath: testArtifact.repositoryPath,
          documents: [
            {
              ...testArtifact.documents[0],
              content: { updated: true, version: '2.0.0' }
            }
          ]
        }

        try {
          const updateResponse = await makeRequest('PUT', `${BASE_URL}/api/v1/artifacts/${artifactId}`, updateArtifact)
          if (updateResponse.statusCode === 200 && updateResponse.body.success) {
            results.tests.push({ name: 'Update Artifact', passed: true })
            results.passed++
            console.log('✓ Update artifact passed')
          } else {
            results.tests.push({ name: 'Update Artifact', passed: false, error: 'Invalid response' })
            results.failed++
            console.log('✗ Update artifact failed')
          }
        } catch (error) {
          results.tests.push({ name: 'Update Artifact', passed: false, error: error.message })
          results.failed++
          console.log('✗ Update artifact failed:', error.message)
        }

        // Test 8: Delete artifact
        console.log('\nTest 8: Deleting artifact...')
        try {
          const deleteResponse = await makeRequest('DELETE', `${BASE_URL}/api/v1/artifacts/${artifactId}`)
          if (deleteResponse.statusCode === 200 && deleteResponse.body.success) {
            results.tests.push({ name: 'Delete Artifact', passed: true })
            results.passed++
            console.log('✓ Delete artifact passed')
          } else {
            results.tests.push({ name: 'Delete Artifact', passed: false, error: 'Invalid response' })
            results.failed++
            console.log('✗ Delete artifact failed')
          }
        } catch (error) {
          results.tests.push({ name: 'Delete Artifact', passed: false, error: error.message })
          results.failed++
          console.log('✗ Delete artifact failed:', error.message)
        }
      } else {
        results.tests.push({ name: 'Add Artifacts', passed: false, error: 'Invalid response' })
        results.failed++
        console.log('✗ Add artifacts failed')
      }
    } catch (error) {
      results.tests.push({ name: 'Add Artifacts', passed: false, error: error.message })
      results.failed++
      console.log('✗ Add artifacts failed:', error.message)
    }

    // Test 9: Clean up by clearing all artifacts
    console.log('\nTest 9: Clearing all artifacts...')
    try {
      const clearResponse = await makeRequest('DELETE', `${BASE_URL}/api/v1/artifacts?repositoryPath=/test/repo`)
      if (clearResponse.statusCode === 200 && clearResponse.body.success) {
        results.tests.push({ name: 'Clear All Artifacts', passed: true })
        results.passed++
        console.log('✓ Clear all artifacts passed')
      } else {
        results.tests.push({ name: 'Clear All Artifacts', passed: false, error: 'Invalid response' })
        results.failed++
        console.log('✗ Clear all artifacts failed')
      }
    } catch (error) {
      results.tests.push({ name: 'Clear All Artifacts', passed: false, error: error.message })
      results.failed++
      console.log('✗ Clear all artifacts failed:', error.message)
    }

    // Write results to file
    const resultsPath = path.join(__dirname, 'test-results', 'artifact-api-test-results.json')
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2))

    console.log('\n' + '='.repeat(50))
    console.log('TEST SUMMARY')
    console.log('='.repeat(50))
    console.log(`Total Tests: ${results.tests.length}`)
    console.log(`Passed: ${results.passed}`)
    console.log(`Failed: ${results.failed}`)
    console.log('\nDetailed Results:')
    results.tests.forEach((test, index) => {
      console.log(`${index + 1}. ${test.name}: ${test.passed ? 'PASS' : 'FAIL'}${test.error ? ' - ' + test.error : ''}`)
    })

    if (results.failed > 0) {
      process.exit(1)
    }

  } catch (error) {
    console.error('Test suite failed:', error)
    process.exit(1)
  }
}

runTests()
