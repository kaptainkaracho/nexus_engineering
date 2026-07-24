import { test, expect } from '@playwright/test';

test.describe('RecommendationsPanel', () => {
  test('should render at desktop viewport', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    // Mock API responses
    await page.route('**/api/traceability/recommendations*', (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'rec-1',
              category: 'coverage',
              severity: 'critical',
              matchScore: 0.95,
              confidence: 'high',
              description: 'Strong coverage gap detected between requirement REQ-101 and feature FEAT-201. These artifacts should be linked for traceability.',
              sourceArtifact: { id: 'src-1', type: 'requirement', title: 'REQ-101: User Authentication' },
              targetArtifact: { id: 'tgt-1', type: 'feature', title: 'FEAT-201: Login Flow' },
              status: 'pending',
            },
            {
              id: 'rec-2',
              category: 'trace',
              severity: 'high',
              matchScore: 0.87,
              confidence: 'medium',
              description: 'Missing trace link between architecture component ARCH-301 and test case TC-401.',
              sourceArtifact: { id: 'src-2', type: 'architectureModel', title: 'ARCH-301: Auth Service' },
              targetArtifact: { id: 'tgt-2', type: 'testCase', title: 'TC-401: Login Validation' },
              status: 'pending',
            },
            {
              id: 'rec-3',
              category: 'test',
              severity: 'medium',
              matchScore: 0.72,
              confidence: 'medium',
              description: 'Test coverage analysis suggests additional test cases for the password reset flow.',
              sourceArtifact: { id: 'src-3', type: 'testCase', title: 'TC-501: Password Reset' },
              targetArtifact: { id: 'tgt-3', type: 'requirement', title: 'REQ-102: Password Policy' },
              status: 'accepted',
            },
            {
              id: 'rec-4',
              category: 'requirements',
              severity: 'low',
              matchScore: 0.65,
              confidence: 'low',
              description: 'Potential relationship between requirements REQ-103 and REQ-104 needs review.',
              sourceArtifact: { id: 'src-4', type: 'requirement', title: 'REQ-103: Session Management' },
              targetArtifact: { id: 'tgt-4', type: 'requirement', title: 'REQ-104: Token Refresh' },
              status: 'dismissed',
            },
            {
              id: 'rec-5',
              category: 'architecture',
              severity: 'high',
              matchScore: 0.82,
              confidence: 'high',
              description: 'Architecture component ARCH-302 should trace to feature FEAT-202 for compliance.',
              sourceArtifact: { id: 'src-5', type: 'architectureModel', title: 'ARCH-302: Rate Limiter' },
              targetArtifact: { id: 'tgt-5', type: 'feature', title: 'FEAT-202: API Protection' },
              status: 'pending',
            },
          ],
        }),
      });
    });

    await page.route('**/api/traceability/gaps', (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              sourceType: 'requirement',
              targetType: 'feature',
              totalPairs: 25,
              coveredPairs: 18,
              gapPercent: 28,
              sampleGaps: [
                { sourceId: 'REQ-105', targetId: 'FEAT-205' },
                { sourceId: 'REQ-106', targetId: 'FEAT-206' },
              ],
            },
            {
              sourceType: 'requirement',
              targetType: 'testCase',
              totalPairs: 30,
              coveredPairs: 22,
              gapPercent: 27,
              sampleGaps: [
                { sourceId: 'REQ-107', targetId: 'TC-507' },
              ],
            },
            {
              sourceType: 'feature',
              targetType: 'testCase',
              totalPairs: 20,
              coveredPairs: 15,
              gapPercent: 25,
              sampleGaps: [
                { sourceId: 'FEAT-208', targetId: 'TC-508' },
                { sourceId: 'FEAT-209', targetId: 'TC-509' },
              ],
            },
            {
              sourceType: 'architecture',
              targetType: 'testCase',
              totalPairs: 15,
              coveredPairs: 12,
              gapPercent: 20,
              sampleGaps: [],
            },
          ],
        }),
      });
    });

    // Inject sessionStorage before any page load
    await page.addInitScript(() => {
      const session = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
          createdAt: '2024-01-01T00:00:00Z',
        },
        token: 'test-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      sessionStorage.setItem('auth_session', JSON.stringify(session));
    });

    await page.goto('http://localhost:5173/#recommendations');
    await page.waitForLoadState('networkidle');

    // Wait for the panel to render
    await page.waitForSelector('text=Recommendations', { timeout: 15000 });
    
    // Wait for data to load
    await page.waitForSelector('text=Match Score', { timeout: 15000 });

    await page.screenshot({
      path: 'tmp-screenshots/recommendations-desktop-1440.png',
      fullPage: true,
    });

    await context.close();
  });

  test('should render at mobile viewport', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();

    // Mock API responses
    await page.route('**/api/traceability/recommendations*', (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'rec-1',
              category: 'coverage',
              severity: 'critical',
              matchScore: 0.95,
              confidence: 'high',
              description: 'Strong coverage gap detected between requirement REQ-101 and feature FEAT-201.',
              sourceArtifact: { id: 'src-1', type: 'requirement', title: 'REQ-101: User Authentication' },
              targetArtifact: { id: 'tgt-1', type: 'feature', title: 'FEAT-201: Login Flow' },
              status: 'pending',
            },
            {
              id: 'rec-2',
              category: 'trace',
              severity: 'high',
              matchScore: 0.87,
              confidence: 'medium',
              description: 'Missing trace link between architecture component ARCH-301 and test case TC-401.',
              sourceArtifact: { id: 'src-2', type: 'architectureModel', title: 'ARCH-301: Auth Service' },
              targetArtifact: { id: 'tgt-2', type: 'testCase', title: 'TC-401: Login Validation' },
              status: 'pending',
            },
          ],
        }),
      });
    });

    await page.route('**/api/traceability/gaps', (route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              sourceType: 'requirement',
              targetType: 'feature',
              totalPairs: 25,
              coveredPairs: 18,
              gapPercent: 28,
              sampleGaps: [
                { sourceId: 'REQ-105', targetId: 'FEAT-205' },
              ],
            },
          ],
        }),
      });
    });

    // Inject sessionStorage before any page load
    await page.addInitScript(() => {
      const session = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin',
          createdAt: '2024-01-01T00:00:00Z',
        },
        token: 'test-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      sessionStorage.setItem('auth_session', JSON.stringify(session));
    });

    await page.goto('http://localhost:5173/#recommendations');
    await page.waitForLoadState('networkidle');

    // Wait for the panel to render
    await page.waitForSelector('text=Recommendations', { timeout: 15000 });
    
    // Wait for data to load
    await page.waitForSelector('text=Match Score', { timeout: 15000 });

    await page.screenshot({
      path: 'tmp-screenshots/recommendations-mobile-390.png',
      fullPage: true,
    });

    await context.close();
  });
});
