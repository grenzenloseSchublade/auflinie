// Automatisches Style-Guide-Review, Teil 4: Bedien-Invarianten aus
// STYLEGUIDE.md 6.2 und 4.4 (A11Y-2, OVL-3, OVL-4, WCAG 2.4.3/2.4.7).
// Prüft Verhalten, nicht Aussehen: Fokusführung, aria-expanded, inert,
// Escape und Light Dismiss an Drawer und Skill-Graph-Sheet, Info-Leiste,
// Einpassen und Zoom im Skill-Graphen, dass kein
// unsichtbares Element den Tastaturfokus bekommt, und die Breakpoint-Grenzen
// 767/768 und 1023/1024 (STYLEGUIDE 3.4).
const { test, expect } = require('@playwright/test');

const MOBIL = { width: 390, height: 844 };

// Ist das fokussierte Element wirklich zu sehen? (Größe, visibility und
// Deckkraft entlang der Vorfahren)
async function focusedIsVisible(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return { ok: true, what: 'body' };
    const r = el.getBoundingClientRect();
    const what = el.outerHTML.slice(0, 120);
    if (r.width < 1 || r.height < 1) return { ok: false, what, why: 'ohne Fläche' };
    if (getComputedStyle(el).visibility !== 'visible') return { ok: false, what, why: 'visibility' };
    for (let n = el; n; n = n.parentElement) {
      if (Number(getComputedStyle(n).opacity) < 0.05) return { ok: false, what, why: 'opacity 0' };
    }
    return { ok: true, what };
  });
}

// Beide Bewegungs-Einstellungen: unter Reduced Motion verzögert der globale
// Kill-Switch das Sichtbarwerden des Drawers um einige Frames.
for (const reducedMotion of ['no-preference', 'reduce']) {
  test.describe(`Drawer per Tastatur, ${reducedMotion} (A11Y-2, OVL-4)`, () => {
    test.use({ viewport: MOBIL, contextOptions: { reducedMotion } });

    test('Fokus hinein, Hintergrund inert, Escape gibt Fokus zurück', async ({ page }) => {
      await page.goto('/auflinie/about/', { waitUntil: 'load' });
      const toggle = page.locator('.greedy-nav__toggle');
      const drawer = page.locator('#site-nav-drawer');
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');

      await toggle.focus();
      await page.keyboard.press('Enter');
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await expect(drawer).not.toHaveClass(/(^|\s)hidden(\s|$)/);
      // Fokus auf dem ersten Link im Drawer
      await expect(drawer.locator('a').first()).toBeFocused();
      // Nach dem Slide-In: Inhalt und Footer inert, Masthead nicht
      await expect.poll(() => page.evaluate(() => document.querySelector('.initial-content').inert)).toBe(true);
      expect(await page.evaluate(() => document.getElementById('footer').inert)).toBe(true);
      expect(await page.evaluate(() => document.querySelector('.masthead').inert)).toBe(false);
      expect(await page.evaluate(() => document.getElementById('spa-route-announcer').inert)).toBe(false);

      await page.keyboard.press('Escape');
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(toggle).toBeFocused();
      expect(await page.evaluate(() => document.querySelector('.initial-content').inert)).toBe(false);
      expect(await page.evaluate(() => document.getElementById('footer').inert)).toBe(false);
    });
  });
}

test.describe('Drawer per Zeiger (A11Y-2, OVL-3)', () => {
  test.use({ viewport: MOBIL });

  test('Zeiger: Fokus bleibt am Auslöser, Light Dismiss hebt inert auf', async ({ page }) => {
    await page.goto('/auflinie/about/', { waitUntil: 'load' });
    const toggle = page.locator('.greedy-nav__toggle');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toBeFocused();
    await expect.poll(() => page.evaluate(() => document.querySelector('.initial-content').inert)).toBe(true);

    // Klick auf den abgedunkelten Bereich links vom Drawer
    await page.mouse.click(40, MOBIL.height / 2);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(await page.evaluate(() => document.querySelector('.initial-content').inert)).toBe(false);
  });
});

// Skill-Graph: ein Knopf „Als Graph anzeigen“ öffnet das modale Sheet direkt
// (seit 2. 10. 2026, vorher Aktivieren + schwebender Öffner). Reduced Motion
// rechnet das Layout synchron vor, Ansicht und Knotenlage sind dann sofort
// stabil. Der Maßstab steht als data-zoom am Canvas, die Zahl der Knoten
// außerhalb bzw. angeschnitten als data-outside (skill-graph.js publishView).
async function openSheet(page, before) {
  await page.goto('/auflinie/cv/', { waitUntil: 'load' });
  if (before) await before();
  const opener = page.locator('[data-role="graph-toggle"]');
  await opener.scrollIntoViewIfNeeded();
  await expect(opener).toHaveText('Als Graph anzeigen');
  await opener.click();
  const panel = page.locator('[data-role="graph-panel"]');
  await expect(panel).toHaveAttribute('role', 'dialog');
  await expect(panel).toHaveAttribute('aria-modal', 'true');
  const canvas = page.locator('[data-role="canvas"]');
  await expect(canvas).toHaveAttribute('data-zoom', /\d/);
  return { opener, panel, canvas };
}

const zoomOf = async (canvas) => Number(await canvas.getAttribute('data-zoom'));

test.describe('Skill-Graph-Sheet (OVL-3, OVL-4)', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('ein Knopf öffnet, Escape schließt, Fokus zurück zum Knopf', async ({ page }) => {
    const { opener, panel } = await openSheet(page);
    await expect(page.locator('[data-role="graph-activate"], .skill-graph__floating, .wip-badge')).toHaveCount(0);
    await expect(page.locator('.skill-graph__sheet-close')).toBeFocused();
    expect(await page.evaluate(() => document.querySelector('.initial-content').inert)).toBe(true);

    await page.keyboard.press('Escape');
    await expect(panel).not.toHaveAttribute('role', 'dialog');
    await expect(opener).toBeFocused();
    await expect(opener).toHaveAttribute('aria-expanded', 'false');
    expect(await page.evaluate(() => document.querySelector('.initial-content').inert)).toBe(false);
  });

  test('✕ schließt, Fokus zurück zum Knopf', async ({ page }) => {
    const { opener, panel } = await openSheet(page);
    await page.locator('.skill-graph__sheet-close').click();
    await expect(panel).not.toHaveAttribute('role', 'dialog');
    await expect(opener).toBeFocused();
  });

  test('Light Dismiss über den Scrim', async ({ page }) => {
    const { panel } = await openSheet(page);
    const box = await panel.boundingBox();
    // Scrim oberhalb des Sheets (unten angedockt)
    await page.mouse.click(box.x + box.width / 2, box.y / 2);
    await expect(panel).not.toHaveAttribute('role', 'dialog');
    expect(await page.evaluate(() => document.querySelector('.initial-content').inert)).toBe(false);
  });

  test('Info-Leiste zeigt nach Knotenklick Skill und Projekte, Esc gestaffelt', async ({ page }) => {
    // Chip vor dem Öffnen wählen: das Sheet öffnet mit Python in der Mitte
    const { panel, canvas } = await openSheet(page, () =>
      page.locator('.cv-skill-chip__button[data-skill="python"]').click());
    const info = page.locator('[data-role="graph-context"]');
    await expect(info.locator('.cv-skills__selection-skill')).toHaveText('Python');

    // Erstes Esc löst nur die Auswahl, das Sheet bleibt offen
    await page.keyboard.press('Escape');
    await expect(info).toHaveText('Ein Klick auf einen Skill zeigt verwandte Skills und gemeinsame Projekte.');
    await expect(info).not.toHaveClass(/is-active/);
    await expect(panel).toHaveAttribute('role', 'dialog');

    // Klick auf den Knoten in der Canvas-Mitte (dort liegt Python)
    await canvas.click();
    await expect(info.locator('.cv-skills__selection-skill')).toHaveText('Python');
    await expect(info.locator('.cv-skills__selection-rolle')).toHaveText(' – gemeinsam im Einsatz bei');
    await expect(info.locator('.cv-skills__selection-projekte')).toContainText(' · ');
    await expect(info).toHaveClass(/is-active/);
    // Gleicher Inhalt wie die Konsole über den Chips (ein Renderer)
    const konsole = await page.locator('[data-role="skill-context"]').innerHTML();
    expect(await info.innerHTML()).toBe(konsole);
  });

  for (const vp of [{ name: 'Desktop', size: { width: 1280, height: 900 } }, { name: 'mobil', size: MOBIL }]) {
    test.describe(vp.name, () => {
      test.use({ viewport: vp.size });

      test('Einpassen: ohne Auswahl alle Knoten im Bild', async ({ page }) => {
        const { canvas } = await openSheet(page);
        const zoom = await zoomOf(canvas);
        expect(zoom).toBeGreaterThanOrEqual(0.6);
        expect(zoom).toBeLessThanOrEqual(1);
        // Greift die Untergrenze 0.6 nicht, liegt alles samt Labels im Bild
        if (zoom > 0.601) expect(await canvas.getAttribute('data-outside')).toBe('0');
      });
    });
  }

  test('Zoom-Knöpfe ändern den Maßstab, Einpassen stellt ihn wieder her', async ({ page }) => {
    const { canvas } = await openSheet(page);
    const fit = await zoomOf(canvas);
    await page.getByRole('button', { name: /^\+ Vergrößern/ }).click();
    expect(await zoomOf(canvas)).toBeGreaterThan(fit);
    await page.getByRole('button', { name: /^− Verkleinern/ }).click();
    await page.getByRole('button', { name: /^− Verkleinern/ }).click();
    expect(await zoomOf(canvas)).toBeLessThan(fit);
    await page.getByRole('button', { name: /^Einpassen/ }).click();
    expect(await zoomOf(canvas)).toBeCloseTo(fit, 3);
    // Tastatur bei Fokus im Sheet: + vergrößert, 0 passt ein
    await page.keyboard.press('+');
    expect(await zoomOf(canvas)).toBeGreaterThan(fit);
    await page.keyboard.press('0');
    expect(await zoomOf(canvas)).toBeCloseTo(fit, 3);
  });
});

test.describe('Kein unsichtbarer Fokus (WCAG 2.4.7)', () => {
  for (const p of ['', 'cv/']) {
    test(`Tab durch /${p}`, async ({ page }) => {
      await page.goto(`/auflinie/${p}`, { waitUntil: 'load' });
      await page.waitForTimeout(500);
      const invisible = [];
      const seen = new Set();
      for (let i = 0; i < 120; i++) {
        await page.keyboard.press('Tab');
        const res = await focusedIsVisible(page);
        if (seen.has(res.what)) break; // einmal herum
        seen.add(res.what);
        if (!res.ok) invisible.push(`${res.why}: ${res.what}`);
      }
      expect(seen.size, 'Tab-Runde zu kurz, Test greift nicht').toBeGreaterThan(10);
      expect(invisible, invisible.join('\n')).toEqual([]);
    });
  }
});

// Grenzbreiten (BP-1, BP-2, BP-6): An jeder Grenze gilt genau eine Seite,
// und JS (AuflinieUtils.mq) sieht dieselbe Seite wie das CSS. 767 und 1023
// liegen darunter, 768 und 1024 gehören zum größeren Bereich.
test.describe('Breakpoint-Grenzen (BP-1, BP-2, BP-6)', () => {
  for (const { width, mobil } of [{ width: 767, mobil: true }, { width: 768, mobil: false }]) {
    test.describe(`${width} px`, () => {
      test.use({ viewport: { width, height: 1024 } });

      test(`Hero, Masthead und CRT-Gate ${mobil ? 'mobil' : 'Desktop'}`, async ({ page }) => {
        await page.goto('/auflinie/', { waitUntil: 'load' });
        const s = await page.evaluate(() => {
          const hero = document.querySelector('.page__hero--overlay');
          return {
            js: window.AuflinieUtils.mq.downMd.matches,
            masthead: getComputedStyle(document.documentElement).getPropertyValue('--masthead-height').trim(),
            cue: getComputedStyle(document.querySelector('.page__hero-scroll-cue')).display,
            heroFillsViewport: hero.getBoundingClientRect().height > window.innerHeight * 0.8,
          };
        });
        expect(s).toEqual({
          js: mobil,
          masthead: mobil ? '74px' : '88px',
          cue: mobil ? 'block' : 'none',
          heroFillsViewport: mobil,
        });
      });
    });
  }

  for (const { width, unten } of [{ width: 1023, unten: true }, { width: 1024, unten: false }]) {
    test.describe(`${width} px`, () => {
      test.use({ viewport: { width, height: 768 } });

      test(`Sticky-TOC ${unten ? 'aktiv' : 'aus'}`, async ({ page }) => {
        await page.goto('/auflinie/cv/', { waitUntil: 'load' });
        const s = await page.evaluate(() => ({
          js: window.AuflinieUtils.mq.downLg.matches,
          sticky: getComputedStyle(document.querySelector('.toc-sticky-mobile')).display,
        }));
        expect(s).toEqual({ js: unten, sticky: unten ? 'block' : 'none' });
      });
    });
  }
});
