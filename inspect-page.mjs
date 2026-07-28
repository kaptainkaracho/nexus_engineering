import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });

// Mobile check
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mp = await mctx.newPage();
await mp.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 20000 });
await mp.waitForTimeout(3000);

const mobileNavBtn = await mp.$('button[aria-label="Open navigation menu"]');
console.log('Mobile nav button visible:', mobileNavBtn ? await mobileNavBtn.isVisible() : false);

const desktopNav = await mp.$('.hidden\\.md\\:flex');
console.log('Desktop nav on mobile visible:', desktopNav ? await desktopNav.isVisible() : 'no element');

const sectionsMobile = await mp.evaluate(() => {
  const allSections = document.querySelectorAll('section');
  return Array.from(allSections).map((s, i) => ({
    i, id: s.id, rect: s.getBoundingClientRect(), visible: s.offsetParent !== null
  }));
});
console.log('Mobile sections:', sectionsMobile.length);

// Desktop check
const dctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const dp = await dctx.newPage();
await dp.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 20000 });
await dp.waitForTimeout(3000);

const mainEl = await dp.$('main');
console.log('Main element exists:', !!mainEl);

const featuresSection = await dp.$('section[aria-labelledby="features-heading"]');
console.log('Features section exists:', !!featuresSection);

const ctaSection = await dp.$('section[aria-labelledby="cta-heading"]');
console.log('CTA section exists:', !!ctaSection);

const footer = await dp.$('footer');
console.log('Footer exists:', !!footer);

// Check stats grid
const statValues = await dp.evaluate(() => {
  const items = document.querySelectorAll('[role="listitem"] p:first-child');
  return Array.from(items).map(p => p.textContent?.trim());
});
console.log('Stat values:', statValues);

// Check feature cards count
const featureCards = await dp.evaluate(() => {
  return document.querySelectorAll('.bento-feature-grid [role="listitem"]').length;
});
console.log('Feature cards in bento grid:', featureCards);

// Check use cases count
const useCases = await dp.evaluate(() => {
  return document.querySelectorAll('[aria-label="Use cases by workflow stage"] > div > div').length;
});
console.log('Use case cards:', useCases);

// Check footer columns
const footerCols = await dp.evaluate(() => {
  const cols = document.querySelectorAll('footer ul');
  return cols.length;
});
console.log('Footer link columns:', footerCols);

// Semantic HTML audit
const semantic = await dp.evaluate(() => {
  return {
    header: !!document.querySelector('header'),
    nav: !!document.querySelector('nav'),
    main: !!document.querySelector('main'),
    footer: !!document.querySelector('footer'),
    sections: document.querySelectorAll('section').length,
    headings: document.querySelectorAll('h1, h2, h3').length,
    buttons: document.querySelectorAll('button').length,
    links: document.querySelectorAll('a').length,
  };
});
console.log('Semantic HTML:', JSON.stringify(semantic, null, 2));

// Check for skip link
const skipLink = await dp.$('a[href="#main-content"]');
console.log('Skip link:', !!skipLink);
if (skipLink) console.log('Skip link classes:', await skipLink.getAttribute('class'));

await browser.close();
