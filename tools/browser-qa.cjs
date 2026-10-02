const {spawn} = require('node:child_process');
const {mkdirSync, writeFileSync} = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright-core');
const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'http://127.0.0.1:4173';
const CHROME = '/workspace/scratch/5e2ad7af24d6/browser-bin/chrome-headless-shell-linux64/chrome-headless-shell';
const AXE = '/workspace/scratch/5e2ad7af24d6/qa-deps/node_modules/axe-core/axe.min.js';
const OUT = path.join(ROOT, 'qa-output');
mkdirSync(OUT, {recursive:true});
const routes = [
  ['home','/'], ['advisory','/advisory/'], ['evidence','/evidence/'],
  ['publication','/mastery-in-motion/'], ['article','/mastery-in-motion/the-cost-of-compensation/'],
  ['contact','/contact/'], ['privacy','/privacy/'], ['terms','/terms-of-service/'],
  ['newsletter-confirmation','/thankyou/'], ['application-confirmation','/application-received/'],
  ['med','/MED/'], ['diagnostic','/diagnostic/'], ['flow','/flow/']
];
const failures = [];
const reports = [];
const coreNames = new Set(routes.slice(0,10).map(([name]) => name));
const fail = (scope, message) => failures.push(`${scope}: ${message}`);

(async () => {
  const server = spawn(process.execPath, ['tools/preview.cjs'], {cwd:ROOT, stdio:['ignore','pipe','pipe']});
  let serverErr = '';
  server.stderr.on('data', b => serverErr += b);
  await Promise.race([
    new Promise((resolve,reject) => { server.stdout.once('data', resolve); server.once('error', reject); }),
    new Promise((_,reject) => setTimeout(() => reject(new Error('Preview server did not start.')), 5000))
  ]);
  const browser = await chromium.launch({executablePath:CHROME, headless:true, args:['--no-sandbox']});
  try {
    for (const [name, route] of routes) {
      const page = await browser.newPage({viewport:{width:1440,height:1000}, reducedMotion:'reduce'});
      const pageErrors=[]; const consoleErrors=[]; const badResponses=[];
      page.on('pageerror', e => pageErrors.push(e.message));
      page.on('console', m => { if (m.type()==='error') consoleErrors.push(m.text()); });
      page.on('response', r => { if (r.status() >= 400) badResponses.push(`${r.status()} ${r.url()}`); });
      const response = await page.goto(ORIGIN + route, {waitUntil:'networkidle'});
      await page.evaluate(() => document.fonts.ready);
      const facts = await page.evaluate(() => ({
        title:document.title, description:document.querySelector('meta[name="description"]')?.content || '',
        canonical:document.querySelector('link[rel="canonical"]')?.href || '', h1:document.querySelectorAll('h1').length,
        main:document.querySelectorAll('main').length, nav:document.querySelectorAll('nav[aria-label]').length,
        text:document.body.innerText.trim().length, overflow:document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        brokenImages:Array.from(document.images).filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src),
        unlabeled:Array.from(document.querySelectorAll('input:not([type="hidden"]),textarea,select')).filter(e=>!e.closest('[hidden]')&&!e.labels?.length&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')).length,
        duplicateIds:(ids=>ids.filter((x,i)=>ids.indexOf(x)!==i))(Array.from(document.querySelectorAll('[id]')).map(e=>e.id)),
        bodyText:Number.parseFloat(getComputedStyle(document.body).fontSize)
      }));
      if (response.status() !== 200) fail(name, `HTTP ${response.status()}`);
      if (!facts.title || !facts.description || !facts.canonical) fail(name, 'metadata is incomplete');
      if (facts.h1 !== 1 || facts.main !== 1 || (coreNames.has(name) && facts.nav !== 1)) fail(name, `landmarks h1=${facts.h1} main=${facts.main} nav=${facts.nav}`);
      if (facts.text < 100) fail(name, 'page has too little meaningful content');
      if (facts.overflow) fail(name, 'horizontal overflow at 1440px');
      if (facts.brokenImages.length) fail(name, `broken images: ${facts.brokenImages.join(', ')}`);
      if (facts.unlabeled) fail(name, `${facts.unlabeled} form controls lack labels`);
      if (facts.duplicateIds.length) fail(name, `duplicate IDs: ${facts.duplicateIds.join(', ')}`);
      if (coreNames.has(name) && (pageErrors.length || consoleErrors.length || badResponses.length)) fail(name, `errors: ${[...pageErrors,...consoleErrors,...badResponses].join(' | ')}`);
      let axeViolations=[];
      if (coreNames.has(name) || name === 'med') {
        await page.addScriptTag({path:AXE});
        const axe = await page.evaluate(async () => await axe.run(document, {runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));
        const severe = axe.violations.filter(v => ['critical','serious'].includes(v.impact));
        if (severe.length) fail(name, `axe: ${severe.map(v=>`${v.id}(${v.nodes.length})`).join(', ')}`);
        axeViolations=axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length}));
      }
      reports.push({name,route,status:response.status(),...facts,legacyExternalErrors:coreNames.has(name)?[]:[...pageErrors,...consoleErrors,...badResponses],axeViolations});
      await page.close();
    }
    const home = await browser.newPage({viewport:{width:1440,height:1000}, reducedMotion:'reduce'});
    await home.goto(ORIGIN, {waitUntil:'networkidle'}); await home.evaluate(() => document.fonts.ready);
    await home.screenshot({path:path.join(OUT,'home-desktop.png'), fullPage:true});
    await home.locator('.system-section').screenshot({style:'.site-header,.skip{visibility:hidden!important}',path:path.join(OUT,'system-desktop.png')});
    await home.locator('.constraint-reasoning summary').focus(); await home.keyboard.press('Enter');
    if (!(await home.locator('.constraint-reasoning').getAttribute('open') !== null)) fail('interaction', 'reasoning does not open with keyboard');
    await home.locator('.system-section').screenshot({style:'.site-header,.skip{visibility:hidden!important}',path:path.join(OUT,'system-result-desktop.png')});
    await home.keyboard.press('Enter');
    if (await home.locator('.constraint-reasoning').getAttribute('open') !== null) fail('interaction', 'reasoning does not close');
    const nojs = await browser.newPage({javaScriptEnabled:false, viewport:{width:390,height:844}});
    await nojs.goto(ORIGIN);
    if (!(await nojs.locator('.constraint-sequence').isVisible())) fail('no-js','static diagnostic explanation missing');
    await nojs.close();
    const internal = await home.locator('a[href^="/"]').evaluateAll(nodes => [...new Set(nodes.map(n=>n.getAttribute('href').split('#')[0]).filter(Boolean))]);
    for (const href of internal) { const r = await home.request.get(ORIGIN + href, {maxRedirects:5}); if (r.status() >= 400) fail('links', `${href} returned ${r.status()}`); }
    const mobile = await browser.newPage({viewport:{width:390,height:844}, isMobile:true, reducedMotion:'reduce'});
    await mobile.goto(ORIGIN, {waitUntil:'networkidle'}); await mobile.evaluate(() => document.fonts.ready);
    if (await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)) fail('mobile-home','horizontal overflow at 390px');
    await mobile.locator('.menu-toggle').click();
    if (await mobile.locator('.menu-toggle').getAttribute('aria-expanded') !== 'true' || !(await mobile.locator('#navigation').isVisible())) fail('mobile-nav','menu did not open');
    await mobile.keyboard.press('Escape');
    if (await mobile.locator('.menu-toggle').getAttribute('aria-expanded') !== 'false') fail('mobile-nav','Escape did not close menu');
    await mobile.screenshot({path:path.join(OUT,'home-mobile.png'), fullPage:true});
    await mobile.locator('.system-section').screenshot({style:'.site-header,.skip{visibility:hidden!important}',path:path.join(OUT,'system-mobile.png')});
    await mobile.goto(ORIGIN + '/advisory/', {waitUntil:'networkidle'}); await mobile.evaluate(() => document.fonts.ready);
    if (await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)) fail('mobile-advisory','horizontal overflow at 390px');
    await mobile.screenshot({path:path.join(OUT,'advisory-mobile.png'), fullPage:true});
    await mobile.goto(ORIGIN + '/evidence/', {waitUntil:'networkidle'}); await mobile.evaluate(() => document.fonts.ready);
    if (await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)) fail('mobile-evidence','horizontal overflow at 390px');
    await mobile.screenshot({path:path.join(OUT,'evidence-mobile.png'), fullPage:true});
    await home.request.post(ORIGIN + '/__test__/mode', {data:'failure',headers:{'Content-Type':'text/plain'}});
    await mobile.goto(ORIGIN + '/advisory/#apply', {waitUntil:'networkidle'});
    await mobile.fill('[name="first_name"]','Website QA'); await mobile.fill('[name="email"]','qa@example.com');
    await mobile.fill('[name="role_company"]','Quality review'); await mobile.fill('[name="current_issue"]','Confirm application states without sending a real application.');
    await mobile.selectOption('[name="readiness"]','Yes'); await mobile.click('.application-form button[type="submit"]');
    await mobile.waitForSelector('.application-form .form-status[data-error="true"]');
    if (!mobile.url().includes('/advisory/')) fail('application-failure','failure state redirected away');
    await home.request.post(ORIGIN + '/__test__/mode', {data:'success',headers:{'Content-Type':'text/plain'}});
    await mobile.click('.application-form button[type="submit"]'); await mobile.waitForURL('**/application-received/');
    await mobile.goto(ORIGIN + '/mastery-in-motion/', {waitUntil:'networkidle'}); await mobile.fill('.newsletter-form input[name="email"]','qa@example.com');
    await mobile.click('.newsletter-form button[type="submit"]'); await mobile.waitForURL('**/thankyou/');
    await mobile.goto(ORIGIN, {waitUntil:'networkidle'});
    await mobile.fill('#home-letter-email','qa@example.com');
    await mobile.click('#home-letter button[type="submit"]'); await mobile.waitForURL('**/thankyou/');
    reports.push({interaction:'application rejection preserved form; confirmed application and newsletter requests reached confirmation routes via simulated Kit transport'});
    await Promise.all([home.close(),mobile.close()]);
  } finally { await browser.close(); server.kill(); }
  writeFileSync(path.join(OUT,'report.json'), JSON.stringify({failures,reports,serverErr},null,2));
  if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
  console.log(`PASS: ${routes.length} routes, desktop/mobile, axe, keyboard, links, images, and simulated form states.`);
})().catch(error => { console.error(error); process.exit(1); });
