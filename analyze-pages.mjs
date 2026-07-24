import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const baseUrl = 'http://localhost:5173';

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

const pages = [
  { name: 'home', path: '#overview' },
  { name: 'buttons', path: '#buttons' },
  { name: 'forms', path: '#forms' },
  { name: 'cards', path: '#cards' },
  { name: 'artefacts', path: '#artefacts' },
  { name: 'repository', path: '#repository' },
  { name: 'discovery', path: '#discovery' },
  { name: 'multi-repo', path: '#multi-repo' },
  { name: 'graph', path: '#graph' },
  { name: 'templates', path: '#templates' },
  { name: 'admin', path: '#admin' },
  { name: 'roles', path: '#roles' },
  { name: 'audit-log', path: '#audit-log' },
  { name: 'registries', path: '#registries' },
  { name: 'tac', path: '#tac' },
  { name: 'test-results', path: '#test-results' },
  { name: 'features', path: '#features' },
  { name: 'trace-graph', path: '#trace-graph' },
  { name: 'impact-analysis', path: '#impact-analysis' },
  { name: 'impact-report', path: '#impact-report' },
  { name: 'recommendations', path: '#recommendations' },
  { name: 'nl-query', path: '#nl-query' },
  { name: 'quality-dashboard', path: '#quality-dashboard' },
  { name: 'trace-gate', path: '#trace-gate' },
];

const browser = await chromium.launch({ headless: true });
const results = [];

for (const pg of pages) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  
  try {
    await page.goto(baseUrl + pg.path, { waitUntil: 'networkidle', timeout: 15000 });
    await page.evaluate((s) => { sessionStorage.setItem('auth_session', s); }, mockSession);
    await page.reload({ waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);
    
    const elements = await page.evaluate(() => {
      const results = [];
      const allElements = document.querySelectorAll('div, h1, h2, h3, h4, p, span, button, input, a, section, main, header, nav, footer, table, tr, td, th, li, ul, ol, label, textarea');
      
      for (const el of allElements) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
        
        const text = el.textContent?.trim()?.substring(0, 100) || '';
        if (!text) continue;
        
        const parentBg = style.backgroundColor;
        const parentColor = style.color;
        const parentFontSize = style.fontSize;
        const parentFontWeight = style.fontWeight;
        const parentPadding = `${style.paddingTop}|${style.paddingRight}|${style.paddingBottom}|${style.paddingLeft}`;
        const parentGap = el.style.gap || '';
        const parentMargin = `${style.marginTop}|${style.marginRight}|${style.marginBottom}|${style.marginLeft}`;
        const parentBorder = style.border || 'none';
        const parentBorderRadius = style.borderRadius;
        const parentWidth = Math.round(rect.width);
        const parentHeight = Math.round(rect.height);
        const parentDisplay = el.tagName.toLowerCase();
        const parentClass = el.className?.toString()?.substring(0, 200) || '';
        
        results.push({
          tag: el.tagName.toLowerCase(),
          text: text.substring(0, 80),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          w: parentWidth,
          h: parentHeight,
          fontSize: parentFontSize,
          fontWeight: parentFontWeight,
          color: parentColor,
          bgColor: parentBg,
          padding: parentPadding,
          margin: parentMargin,
          border: parentBorder,
          borderRadius: parentBorderRadius,
          classes: parentClass,
          display: parentDisplay,
        });
      }
      return results;
    });
    
    results.push({ page: pg.name, elements });
  } catch (e) {
    results.push({ page: pg.name, error: e.message });
  }
  
  await ctx.close();
}

await browser.close();

// Output analysis
console.log('=== PAGE ANALYSIS ===\n');
for (const r of results) {
  console.log(`\n--- ${r.page} ---`);
  if (r.error) {
    console.log(`ERROR: ${r.error}`);
    continue;
  }
  
  const byTag = {};
  const byFontSize = {};
  const byFontWeight = {};
  let maxW = 0, maxH = 0;
  let totalW = 0, totalH = 0;
  const bgColors = new Set();
  const textColors = new Set();
  
  for (const el of r.elements) {
    byTag[el.tag] = (byTag[el.tag] || 0) + 1;
    byFontSize[el.fontSize] = (byFontSize[el.fontSize] || 0) + 1;
    byFontWeight[el.fontWeight] = (byFontWeight[el.fontWeight] || 0) + 1;
    bgColors.add(el.bgColor);
    textColors.add(el.color);
    totalW += el.w;
    totalH += el.h;
    if (el.w > maxW) maxW = el.w;
    if (el.h > maxH) maxH = el.h;
  }
  
  console.log(`  Elements: ${r.elements.length}`);
  console.log(`  Max width: ${maxW}px, Max height: ${maxH}px`);
  console.log(`  Total area: ${totalW}x${totalH}`);
  console.log(`  Tags: ${Object.entries(byTag).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+':'+v).join(', ')}`);
  console.log(`  Font sizes: ${Object.entries(byFontSize).sort((a,b)=>parseFloat(b[0])-parseFloat(a[0])).map(([k,v])=>k+'x'+v).join(', ')}`);
  console.log(`  Font weights: ${Object.entries(byFontWeight).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+'x'+v).join(', ')}`);
  console.log(`  Background colors: ${bgColors.size} unique`);
  console.log(`  Text colors: ${textColors.size} unique`);
  
  // Check for hardcoded values (potential issues)
  const hardcoded = r.elements.filter(el => {
    const c = el.classes;
    return c.includes('h-7') || 
           c.includes('px-[12px]') || 
           c.includes('py-[12px]') ||
           c.includes('gap-[') ||
           c.includes('space-y-[') ||
           c.includes('space-x-[') ||
           c.includes('text-[') ||
           c.includes('bg-[#') ||
           c.includes('w-[') ||
           c.includes('h-[');
  });
  if (hardcoded.length > 0) {
    console.log(`  WARNING: ${hardcoded.length} elements with potentially non-standard sizing`);
  }
  
  // Show top-level structure
  const topElements = r.elements.filter(el => el.y < 50);
  if (topElements.length > 0) {
    console.log(`  Top-bar elements: ${topElements.length}`);
    for (const el of topElements.slice(0, 10)) {
      console.log(`    [${el.x},${el.y}] ${el.w}x${el.h} "${el.text.substring(0,40)}" fw=${el.fontWeight} fs=${el.fontSize}`);
    }
  }
  
  // Show section headers and their font sizes for hierarchy analysis
  const headings = r.elements.filter(el => ['h1','h2','h3','h4'].includes(el.tag));
  if (headings.length > 0) {
    console.log(`  Headings:`);
    for (const el of headings) {
      console.log(`    [${el.x},${el.y}] ${el.tag} ${el.fontSize} ${el.fontWeight} "${el.text.substring(0,50)}"`);
    }
  }
}

// Write to file for later analysis
writeFileSync('/tmp/page-analysis.json', JSON.stringify(results, null, 2));
