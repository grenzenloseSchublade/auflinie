#!/usr/bin/env node
// Style-Snapshot: hält die berechneten Styles (getComputedStyle) aller
// Elemente der wichtigsten Seiten fest und vergleicht zwei Stände.
// Zweck: Refactorings (Tokens statt Literale, var -> const, @use …) müssen
// beweisbar OPTISCH NEUTRAL sein. Screenshots echter Seiten sind dafür zu
// unruhig (CRT-Rauschen, Fraktale, Simulation) – berechnete Styles sind
// deterministisch.
//
// Nutzung (im Playwright-Container wie die Tests, siehe tests/README.md):
//   node scripts/style-snapshot.js snap <site-dir> <out.json>
//   node scripts/style-snapshot.js diff <vorher.json> <nachher.json>
// diff endet mit Exit 1, wenn sich etwas unterscheidet, und listet die
// Abweichungen nach Eigenschaft gruppiert.
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('@playwright/test');

const PAGES = ['', 'about/', 'cv/', 'posts/', 'mandelbrot/', 'archiv/', '404.html', 'offline.html', 'styleguide/'];
// Standard: Desktop 1280 und mobil 390. Für Grenzfälle (Breakpoints) per
// Umgebungsvariable erweiterbar, z. B. SNAP_VIEWPORTS=1280x900,390x844,768x1024.
// Die Schlüssel im Ergebnis tragen die Breite, Snapshots mit verschiedenen
// Listen lassen sich deshalb nur auf den gemeinsamen Breiten vergleichen.
const VIEWPORTS = (process.env.SNAP_VIEWPORTS || '1280x900,390x844')
  .split(',')
  .map((v) => v.trim().split('x').map(Number))
  .map(([width, height]) => ({ width, height }));
const PROPS = [
  'display', 'position', 'top', 'right', 'bottom', 'left', 'z-index',
  'width', 'height', 'min-height', 'max-width',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'gap', 'row-gap', 'column-gap',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
  'outline-color', 'outline-width', 'outline-offset',
  'color', 'background-color', 'background-image', 'box-shadow', 'text-shadow', 'opacity', 'visibility',
  'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-transform', 'text-decoration-line',
  'transition-duration', 'transition-timing-function', 'animation-duration', 'animation-timing-function',
];
// Bereiche mit Zufall oder Laufzeit-Simulation (CRT-Hero, Canvas-Inhalte)
const SKIP = '.page__hero-crt-media, canvas, .skill-graph__panel, mjx-container';

function serve(dir) {
  const root = path.resolve(dir);
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    if (!url.pathname.startsWith('/auflinie')) { res.writeHead(404); return res.end(); }
    let file = path.join(root, decodeURIComponent(url.pathname.slice('/auflinie'.length)) || '/');
    if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end(); }
      const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise((r) => server.listen(Number(process.env.SNAP_PORT || 4321), '127.0.0.1', () => r(server)));
}

async function snap(dir, out) {
  const server = await serve(dir);
  const base = `http://127.0.0.1:${server.address().port}/auflinie/`;
  const browser = await chromium.launch();
  const result = {};
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: vp, serviceWorkers: 'block', reducedMotion: 'reduce' });
    for (const p of PAGES) {
      const page = await ctx.newPage();
      const res = await page.goto(base + p, { waitUntil: 'load' });
      if (!res || res.status() !== 200) { await page.close(); continue; }
      await page.waitForTimeout(600);
      result[`${vp.width}:/${p}`] = await page.evaluate(({ PROPS, SKIP }) => {
        const out = {};
        const pathOf = (el) => {
          const parts = [];
          for (let n = el; n && n.nodeType === 1 && n !== document.documentElement; n = n.parentElement) {
            const sib = n.parentElement ? Array.from(n.parentElement.children).filter((c) => c.tagName === n.tagName) : [];
            const cls = n.classList.length ? '.' + Array.from(n.classList).filter((c) => !/^(js|loaded|is-|has-|neon-paused|orbit-|page__hero--crt-)/.test(c)).sort().join('.') : '';
            parts.unshift(n.tagName.toLowerCase() + cls + (sib.length > 1 ? `:${sib.indexOf(n) + 1}` : ''));
          }
          return parts.join('>');
        };
        // Zwei Durchgänge: Animations-/Transition-Angaben so lesen, wie das CSS
        // sie setzt; danach alle Animationen anhalten, damit animierte Werte
        // (Neon-Glow, Flackern) nicht zufällig mitten im Lauf erfasst werden.
        const ANIM = PROPS.filter((k) => /^(animation|transition)-/.test(k));
        const REST = PROPS.filter((k) => !ANIM.includes(k));
        const els = Array.from(document.querySelectorAll('body *')).filter((el) => !el.closest(SKIP));
        const read = (keys) => {
          els.forEach((el) => {
            for (const pseudo of [null, '::before', '::after']) {
              const cs = getComputedStyle(el, pseudo);
              if (pseudo && (cs.content === 'none' || cs.content === 'normal')) continue;
              const key = pathOf(el) + (pseudo || '');
              const o = out[key] || (out[key] = {});
              keys.forEach((k) => { o[k] = cs.getPropertyValue(k); });
            }
          });
        };
        read(ANIM);
        const freeze = document.createElement('style');
        freeze.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}';
        document.head.appendChild(freeze);
        void document.body.offsetHeight;
        read(REST);
        return out;
      }, { PROPS, SKIP });
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  server.close();
  fs.writeFileSync(out, JSON.stringify(result));
  console.log(`style-snapshot: ${Object.keys(result).length} Seiten/Viewports -> ${out}`);
}

function diff(a, b) {
  const A = JSON.parse(fs.readFileSync(a, 'utf8'));
  const B = JSON.parse(fs.readFileSync(b, 'utf8'));
  const byProp = {};
  let count = 0;
  for (const page of new Set([...Object.keys(A), ...Object.keys(B)])) {
    const pa = A[page] || {}, pb = B[page] || {};
    for (const el of new Set([...Object.keys(pa), ...Object.keys(pb)])) {
      if (!pa[el] || !pb[el]) { (byProp['[Element fehlt/neu]'] ||= []).push(`${page} ${el}`); count++; continue; }
      for (const k of Object.keys(pa[el])) {
        if (pa[el][k] !== pb[el][k]) {
          (byProp[k] ||= []).push(`${page} ${el}: ${pa[el][k]} -> ${pb[el][k]}`);
          count++;
        }
      }
    }
  }
  if (!count) { console.log('style-snapshot: keine Unterschiede'); return 0; }
  for (const [k, list] of Object.entries(byProp)) {
    console.log(`\n${k} (${list.length})`);
    list.slice(0, 25).forEach((l) => console.log('  ' + l));
    if (list.length > 25) console.log(`  … ${list.length - 25} weitere`);
  }
  console.log(`\nstyle-snapshot: ${count} Unterschiede`);
  return 1;
}

const [cmd, x, y] = process.argv.slice(2);
if (cmd === 'snap') snap(x, y).catch((e) => { console.error(e); process.exit(2); });
else if (cmd === 'diff') process.exit(diff(x, y));
else { console.error('Nutzung: snap <site-dir> <out.json> | diff <a.json> <b.json>'); process.exit(2); }
