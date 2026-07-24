import { chromium } from 'playwright';

const baseUrl = 'http://localhost:5173';
const outputDir = '/home/chris/Paperclip-Projects/Nexus/tmp-screenshots';

const pages = [
  { name: 'home', path: '#overview', label: 'Home / App Shell' },
  { name: 'buttons', path: '#buttons', label: 'Buttons' },
  { name: 'forms', path: '#forms', label: 'Forms' },
  { name: 'cards', path: '#cards', label: 'Cards' },
  { name: 'artefacts', path: '#artefacts', label: 'Artefacts' },
  { name: 'repository', path: '#repository', label: 'Repository Tree' },
  { name: 'discovery', path: '#discovery', label: 'Discovery Dashboard' },
  { name: 'multi-repo', path: '#multi-repo', label: 'Multi-Repo Dashboard' },
  { name: 'graph', path: '#graph', label: 'Graph Builder' },
  { name: 'templates', path: '#templates', label: 'Templates' },
  { name: 'admin', path: '#admin', label: 'Admin Dashboard' },
  { name: 'roles', path: '#roles', label: 'Role Management' },
  { name: 'audit-log', path: '#audit-log', label: 'Audit Log Viewer' },
  { name: 'registries', path: '#registries', label: 'Private Registries' },
  { name: 'tac', path: '#tac', label: 'TAC Viewer' },
  { name: 'test-results', path: '#test-results', label: 'Test Results Dashboard' },
  { name: 'features', path: '#features', label: 'Feature Browser' },
  { name: 'trace-graph', path: '#trace-graph', label: 'Trace Graph' },
  { name: 'impact-analysis', path: '#impact-analysis', label: 'Impact Analysis' },
  { name: 'impact-report', path: '#impact-report', label: 'Impact Report' },
  { name: 'recommendations', path: '#recommendations', label: 'Recommendations Panel' },
  { name: 'nl-query', path: '#nl-query', label: 'NL Trace Query' },
  { name: 'quality-dashboard', path: '#quality-dashboard', label: 'Quality Dashboard' },
  { name: 'trace-gate', path: '#trace-gate', label: 'Trace Gate Config' },
];

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const mockSession = JSON.stringify({
  user: {
    id: 'test-user-1',
    email: 'admin@nexus.dev',
    name: 'Test Admin',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  token: 'mock-token-abc123',
  expiresAt: new Date(Date.now() + 86400000).toISOString(),
});

const browser = await chromium.launch({ headless: true });

const results = [];

for (const vp of viewports) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  for (const pg of pages) {
    try {
      const url = `${baseUrl}${pg.path}`;
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.evaluate((s) => { sessionStorage.setItem('auth_session', s); }, mockSession);
      await page.reload({ waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000);
      const filename = `${pg.name}_${vp.name}.png`;
      await page.screenshot({ path: `${outputDir}/${filename}`, fullPage: false });
      results.push({ page: pg.name, viewport: vp.name, status: 'ok' });
    } catch (e) {
      results.push({ page: pg.name, viewport: vp.name, status: 'error', msg: e.message });
    }
  }

  await ctx.close();
}

await browser.close();

// Print summary
console.log('\n=== Screenshot Results ===');
for (const r of results) {
  const icon = r.status === 'ok' ? '✓' : '✗';
  console.log(`${icon} ${r.page} @ ${r.viewport}`);
}

const ok = results.filter(r => r.status === 'ok').length;
const total = results.length;
console.log(`\nTotal: ${ok}/${total} succeeded`);
process.exit(ok === total ? 0 : 1);
