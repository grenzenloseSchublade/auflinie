// Automatisches Style-Guide-Review, Teil 4: Bedien-Invarianten aus
// STYLEGUIDE.md 6.2 und 4.4 (A11Y-2, OVL-3, OVL-4, WCAG 2.4.3/2.4.7).
// Prüft Verhalten, nicht Aussehen: Fokusführung, aria-expanded, inert,
// Escape und Light Dismiss an Drawer und Skill-Graph-Sheet, Autor- und TOC-Dropdown, Info-Leiste,
// Übersicht, Zoom und Beschriftung im Skill-Graphen, dass kein
// unsichtbares Element den Tastaturfokus bekommt, die Breakpoint-Grenzen
// 767/768 und 1023/1024 (STYLEGUIDE 3.4), dass Touch nach dem Antippen
// keinen Theme-Hover festhält (BP-3), dass Menü-Knopf und Buttons auf Touch
// 44 px treffen (6.1) und dass Kachelbilder die Maße ihrer Datei tragen (IMG-3).
const { test, expect } = require('@playwright/test');
const { PAGES, POSTS } = require('./pages');
const { ohneBlogHinweis } = require('../blog-hinweis');

const MOBIL = { width: 390, height: 844 };

// Ist das fokussierte Element wirklich zu sehen? (Größe, visibility und
// Deckkraft entlang der Vorfahren). Blendet es gerade ein (Back-to-Top nach
// dem Scrollen, aufklappendes Dropdown), zählt der Zustand nach Ende der
// Übergänge: WebKit und Firefox malen im Container ohne GPU nur wenige Bilder
// pro Sekunde, ein Übergang steht beim Messen dort oft noch am Anfang.
// Scroll-getriebene Animationen (Graph-Knopf auf /cv/) enden nie von selbst
// und zählen nicht.
async function focusedIsVisible(page) {
  const res = await focusedIsVisibleNow(page);
  if (res.ok) return res;
  await page.evaluate(() => Promise.all(document.getAnimations()
    .filter((a) => a.effect && a.timeline === document.timeline
      && a.effect.getComputedTiming().endTime !== Infinity)
    .map((a) => a.finished.catch(() => {}))));
  return focusedIsVisibleNow(page);
}

async function focusedIsVisibleNow(page) {
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
      // Live-Regionen bleiben erreichbar (inertOutside in site-utils.js)
      expect(await page.evaluate(() => document.getElementById('offline-notification').inert)).toBe(false);

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

// Autor-Folgen-Dropdown (author-follow.js): Knopf nur unter 1024 px sichtbar.
// Gleiche Fokus-Logik wie der Drawer.
test.describe('Autor-Folgen-Dropdown (A11Y-2)', () => {
  test.use({ viewport: MOBIL });

  test('Tastatur: Fokus in die Liste, Escape gibt ihn zurück', async ({ page }) => {
    await page.goto('/auflinie/about/', { waitUntil: 'load' });
    const btn = page.locator('.author__urls-wrapper button');
    const list = page.locator('.author__urls');
    await btn.focus();
    await page.keyboard.press('Enter');
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await expect(list.locator('a[href]').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await expect(btn).toBeFocused();
  });

  test('Zeiger: Fokus bleibt am Knopf', async ({ page }) => {
    await page.goto('/auflinie/about/', { waitUntil: 'load' });
    const btn = page.locator('.author__urls-wrapper button');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await expect(btn).toBeFocused();
  });
});

// TOC-Dropdown der Sticky-Leiste (toc.js): erscheint unter 1024 px, sobald
// das Original-TOC aus dem Bild gescrollt ist. Gleiche Fokus-Logik wie der
// Drawer.
test.describe('Sticky-TOC-Dropdown (A11Y-2)', () => {
  test.use({ viewport: MOBIL });

  async function stickyToggle(page) {
    await page.goto('/auflinie/cv/', { waitUntil: 'load' });
    await page.evaluate(() => {
      const toc = document.getElementById('toc-original');
      window.scrollTo(0, toc.getBoundingClientRect().bottom + window.scrollY + 400);
    });
    await expect(page.locator('#toc-sticky-mobile')).toHaveClass(/is-visible/);
    return page.locator('#toc-sticky-toggle');
  }

  test('Tastatur: Fokus in die Liste, Escape gibt ihn zurück', async ({ page }) => {
    const toggle = await stickyToggle(page);
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#toc-sticky-dropdown a[href]').first()).toBeFocused();
    expect((await focusedIsVisible(page)).ok).toBe(true);
    // R-77: Hintergrund inert, Leiste, Scrim und Masthead bleiben bedienbar
    const inertState = () => page.evaluate(() => {
      const inert = (sel) => !!document.querySelector(sel).closest('[inert]');
      return {
        footer: inert('.page__footer'), titel: inert('.page__title, h1'),
        leiste: inert('#toc-sticky-mobile'), scrim: inert('#toc-sticky-overlay'), masthead: inert('.masthead'),
      };
    });
    await expect.poll(inertState).toEqual({ footer: true, titel: true, leiste: false, scrim: false, masthead: false });
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
    // Von den beiden Graph-Öffnern ist der ruhende immer inert (Kleiner
    // Graph-Knopf, unten), alles andere ist wieder frei
    expect(await page.evaluate(() => document.querySelectorAll(
      '[inert]:not([data-role="graph-dock"], [data-role="graph-toggle"])').length)).toBe(0);
  });

  test('Zeiger: Fokus bleibt am Toggle', async ({ page }) => {
    const toggle = await stickyToggle(page);
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toBeFocused();
  });
});

// Skill-Graph: ein Knopf „Skill-Graph öffnen“ oben im Abschnitt öffnet das
// modale Sheet direkt (seit 2. 10. 2026, vorher Aktivieren + schwebender
// Öffner, seit 4. 10. 2026 vor den Skill-Gruppen). Reduced Motion
// rechnet das Layout synchron vor, Ansicht und Knotenlage sind dann sofort
// stabil. Der Maßstab steht als data-zoom am Canvas, die Zahl der Knoten
// außerhalb bzw. angeschnitten als data-outside, die Bildschirmlage des
// gewählten Knotens als data-sel-x/-y, die IDs der beschrifteten Knoten als
// data-labels und ein Knoten mit Vorschau als data-preview (skill-graph.js
// publishView).
// Die erwarteten Texte kommen aus dem Datenblock der Seite (texts in
// _data/skill_graph.yml): Die Tests prüfen Verhalten, nicht den Wortlaut, eine
// Textänderung dort braucht keinen angepassten Test.
async function skillTexts(page) {
  return page.evaluate(() => JSON.parse(document.querySelector('script[data-skill-graph-data]').textContent).texts);
}

async function openSheet(page, before) {
  await page.goto('/auflinie/cv/', { waitUntil: 'load' });
  if (before) await before();
  const texts = await skillTexts(page);
  const opener = page.locator('[data-role="graph-toggle"]');
  await opener.scrollIntoViewIfNeeded();
  await expect(opener).toHaveText(texts.graph.open);
  await expect(opener).toHaveAccessibleName(texts.graph.open);
  await opener.click();
  const panel = page.locator('[data-role="graph-panel"]');
  await expect(panel).toHaveAttribute('role', 'dialog');
  await expect(panel).toHaveAttribute('aria-modal', 'true');
  const canvas = page.locator('[data-role="canvas"]');
  await expect(canvas).toHaveAttribute('data-zoom', /\d/);
  return { opener, panel, canvas, texts };
}

const zoomOf = async (canvas) => Number(await canvas.getAttribute('data-zoom'));
const labelsOf = async (canvas) => (await canvas.getAttribute('data-labels')).split(' ').filter(Boolean);

test.describe('Blog-Hinweis im Top Layer (Z-1, früher R-10)', () => {
  test.use({ viewport: MOBIL });

  test('modal über dem Masthead, Escape schließt und merkt sich das', async ({ page }) => {
    await page.goto('/auflinie/posts/', { waitUntil: 'load' });
    const box = page.locator('#blog-notice');
    // Nur prüfbar, solange ein Hinweis eingeschaltet ist (blog_notice.enabled in _pages/posts.md)
    test.skip(await box.count() === 0, 'Blog-Hinweis ausgeschaltet');
    await expect(box).toHaveJSProperty('open', true);
    expect(await box.evaluate((el) => el.matches(':modal'))).toBe(true);
    await expect(page.locator('#blog-notice-close')).toBeFocused();
    // Mitte des Burgers trifft den Abdunkler (das <dialog>), nicht den Masthead
    const hit = await page.evaluate(() => {
      const r = document.querySelector('.greedy-nav__toggle').getBoundingClientRect();
      return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2).id;
    });
    expect(hit).toBe('blog-notice');
    await page.keyboard.press('Escape');
    await expect(box).toHaveJSProperty('open', false);
    await page.reload({ waitUntil: 'load' });
    await expect(box).toHaveJSProperty('open', false);
  });
});

test.describe('Skill-Graph-Sheet (OVL-3, OVL-4)', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('ein Knopf öffnet, Escape schließt, Fokus zurück zum Knopf', async ({ page }) => {
    const { opener, panel } = await openSheet(page);
    await expect(page.locator('[data-role="graph-activate"], .skill-graph__floating, .wip-badge')).toHaveCount(0);
    await expect(page.locator('.skill-graph__sheet-close')).toBeFocused();
    // Öffner steht oben im Abschnitt, vor der ersten Skill-Gruppe
    expect(await opener.evaluate((el) => Boolean(el.compareDocumentPosition(document.querySelector('.cv-skill-group'))
      & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
    expect(await page.evaluate(() => document.querySelector('.initial-content').inert)).toBe(true);
    // Inhaltsverzeichnis (Sidebar und Sticky-Leiste) liegt im inerten Hintergrund
    expect(await page.evaluate(() => ['#toc-original', '#toc-sticky-mobile']
      .every((sel) => Boolean(document.querySelector(sel).closest('[inert]'))))).toBe(true);

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
    // Chip vor dem Öffnen wählen: das Sheet hebt Python hervor, wo es liegt
    const { panel, canvas, texts } = await openSheet(page, () =>
      page.locator('.cv-skill-chip__button[data-skill="python"]').click());
    const info = page.locator('[data-role="graph-context"]');
    await expect(info.locator('.cv-skills__selection-skill')).toHaveText('Python');
    const x = Number(await canvas.getAttribute('data-sel-x'));
    const y = Number(await canvas.getAttribute('data-sel-y'));

    // Erstes Esc löst nur die Auswahl, das Sheet bleibt offen. Im Ruhezustand
    // steht unter dem Hinweis der Satz zu Punkten ohne Namen, nur im Graphen
    await page.keyboard.press('Escape');
    await expect(info).toContainText(texts.hint);
    await expect(info.locator('.skill-graph__info-note')).toHaveText(texts.graph.unlabeled);
    await expect(page.locator('[data-role="skill-context"]')).not.toContainText(texts.graph.unlabeled);
    await expect(info).not.toHaveClass(/is-active/);
    await expect(panel).toHaveAttribute('role', 'dialog');

    await expect(canvas).not.toHaveAttribute('data-sel-x', /./);
    // Klick auf den Python-Knoten an seiner Bildschirmlage (die Ansicht hat
    // sich durch Esc nicht bewegt)
    await canvas.click({ position: { x, y } });
    await expect(info.locator('.cv-skills__selection-skill')).toHaveText('Python');
    await expect(info.locator('.cv-skills__selection-rolle')).toHaveText(' – ' + texts.selection.with_projects);
    await expect(info.locator('.cv-skills__selection-projekte')).toContainText(' · ');
    await expect(info).toHaveClass(/is-active/);
    // Gleicher Inhalt wie die Konsole über den Chips (ein Renderer)
    const konsole = await page.locator('[data-role="skill-context"]').innerHTML();
    expect(await info.innerHTML()).toBe(konsole);
  });

  for (const vp of [{ name: 'Desktop', size: { width: 1280, height: 900 } }, { name: 'mobil', size: MOBIL }]) {
    test.describe(vp.name, () => {
      test.use({ viewport: vp.size });

      test('Startansicht: ohne Auswahl alle Knoten im Bild', async ({ page }) => {
        const { canvas } = await openSheet(page);
        const zoom = await zoomOf(canvas);
        expect(zoom).toBeGreaterThanOrEqual(0.6);
        expect(zoom).toBeLessThanOrEqual(1);
        // Greift die Untergrenze 0.6 nicht, liegt alles samt Labels im Bild
        if (zoom > 0.601) expect(await canvas.getAttribute('data-outside')).toBe('0');
      });

      // Owner-Korrektur 2.10.: auch mit Auswahl kein Zentrieren, die Auswahl
      // wird nur hervorgehoben, wo sie liegt
      test('Öffnen mit gewähltem Chip: gleiche Ansicht wie ohne Auswahl', async ({ page }) => {
        const ohne = await openSheet(page);
        const zoom = await zoomOf(ohne.canvas);
        const outside = await ohne.canvas.getAttribute('data-outside');
        const mit = await openSheet(page, () =>
          page.locator('.cv-skill-chip__button[data-skill="python"]').click());
        await expect(mit.canvas).toHaveAttribute('data-sel-x', /\d/);
        expect(await zoomOf(mit.canvas)).toBeCloseTo(zoom, 3);
        // Dieselbe Startansicht (Übersicht ausgegraut). data-outside taugt
        // dafür nicht mehr: Es zählt angeschnittene Labels mit, und die
        // Beschriftung unterscheidet sich mit Auswahl (seit 6. 10. 2026 dürfen
        // Labels am Rand angeschnitten sein, Pflicht-Labels rücken ins Bild).
        await expect(page.locator('[data-role="graph-fit"]')).toHaveAttribute('aria-disabled', 'true');
        if (zoom > 0.601) expect(outside).toBe('0');
      });
    });
  }

  // Reset ist ausgegraut, solange es nichts zurückzusetzen gibt (keine Auswahl,
  // kein gezogener Knoten), sonst gliche er „Übersicht“ (Owner, 6. 10. 2026)
  test('Reset nur bereit, wenn es etwas zurückzusetzen gibt', async ({ page }) => {
    await openSheet(page);
    const reset = page.locator('[data-role="graph-reset"]');
    await expect(reset).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('Escape');
    const mit = await openSheet(page, () =>
      page.locator('.cv-skill-chip__button[data-skill="python"]').click());
    await expect(reset).not.toHaveAttribute('aria-disabled', /./);
    await reset.click();
    await expect(reset).toHaveAttribute('aria-disabled', 'true');
    await expect(mit.canvas).not.toHaveAttribute('data-sel-x', /./);
  });

  test('Zoom-Knöpfe ändern den Maßstab, Übersicht stellt ihn wieder her', async ({ page }) => {
    const { canvas, texts } = await openSheet(page);
    // Label in Name (WCAG 2.5.3, STYLEGUIDE 7.7): Der Name jedes Knopfs beginnt
    // mit seinem sichtbaren Zeichen bzw. Text, gleich welcher Wortlaut in
    // texts.graph steht
    for (const role of ['graph-zoom-in', 'graph-zoom-out', 'graph-fit', 'graph-reset', 'graph-dock']) {
      const btn = page.locator(`[data-role="${role}"]`);
      // textContent statt innerText: die Knöpfe stehen per CSS in Versalien
      const visible = (await btn.textContent()).replace(/\s+/g, ' ').trim();
      expect((await btn.getAttribute('aria-label')).startsWith(visible),
        `${role}: label in _data/skill_graph.yml beginnt nicht mit dem sichtbaren „${visible}“`).toBe(true);
    }
    const fit = await zoomOf(canvas);
    await page.getByRole('button', { name: texts.graph.zoom_in.label, exact: true }).click();
    expect(await zoomOf(canvas)).toBeGreaterThan(fit);
    await page.getByRole('button', { name: texts.graph.zoom_out.label, exact: true }).click();
    await page.getByRole('button', { name: texts.graph.zoom_out.label, exact: true }).click();
    expect(await zoomOf(canvas)).toBeLessThan(fit);
    await page.getByRole('button', { name: texts.graph.fit.label, exact: true }).click();
    expect(await zoomOf(canvas)).toBeCloseTo(fit, 3);
    // Tastatur bei Fokus im Sheet: + vergrößert, 0 führt zur Startansicht
    await page.keyboard.press('+');
    expect(await zoomOf(canvas)).toBeGreaterThan(fit);
    await page.keyboard.press('0');
    expect(await zoomOf(canvas)).toBeCloseTo(fit, 3);
  });

  // Übersicht führt zur Startansicht (dieselbe Rechnung wie beim Öffnen) und
  // steht ausgegraut, solange sie schon steht (Owner, 6. 10. 2026)
  test('Übersicht ausgegraut in der Startansicht, sonst bereit', async ({ page }) => {
    const { canvas, texts } = await openSheet(page);
    const fit = page.locator('[data-role="graph-fit"]');
    await expect(fit).toHaveAttribute('aria-disabled', 'true');
    await page.getByRole('button', { name: texts.graph.zoom_in.label, exact: true }).click();
    await expect(fit).not.toHaveAttribute('aria-disabled', /./);
    await fit.click();
    await expect(fit).toHaveAttribute('aria-disabled', 'true');
    // Verschieben verlässt die Startansicht ebenso
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + 3, box.y + 3);
    await page.mouse.down();
    await page.mouse.move(box.x + 33, box.y + 23, { steps: 3 });
    await page.mouse.up();
    await expect(fit).not.toHaveAttribute('aria-disabled', /./);
  });

  // Beschriftung nur nach Maßstab (Been, Daiches und Yap 2006, skill-graph.js
  // computeLabelScales): gleiche Ansicht, gleiche Namen, egal was vorher war
  test('Übersicht zeigt nach Zoomen dieselben Namen wie das Öffnen', async ({ page }) => {
    const { canvas, texts } = await openSheet(page);
    const zoom = await zoomOf(canvas);
    const start = await labelsOf(canvas);
    expect(start.length).toBeGreaterThan(0);
    const plus = page.getByRole('button', { name: texts.graph.zoom_in.label, exact: true });
    const minus = page.getByRole('button', { name: texts.graph.zoom_out.label, exact: true });
    await plus.click();
    await plus.click();
    await minus.click();
    await page.getByRole('button', { name: texts.graph.fit.label, exact: true }).click();
    expect(await zoomOf(canvas)).toBeCloseTo(zoom, 3);
    expect(await labelsOf(canvas)).toEqual(start);
  });

  test('Verschieben ändert die Beschriftung nicht', async ({ page }) => {
    const { canvas } = await openSheet(page);
    const zoom = await zoomOf(canvas);
    const start = await labelsOf(canvas);
    // Leere Ecke (wie im Tastatur-Test), Maus zieht die Ansicht
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + 3, box.y + 3);
    await page.mouse.down();
    await page.mouse.move(box.x + 63, box.y + 43, { steps: 4 });
    await page.mouse.up();
    await expect(page.locator('[data-role="graph-fit"]')).not.toHaveAttribute('aria-disabled', /./);
    expect(await zoomOf(canvas)).toBeCloseTo(zoom, 3);
    expect(await labelsOf(canvas)).toEqual(start);
  });

  test('Hineinzoomen nimmt keinen Namen weg', async ({ page }) => {
    const { canvas, texts } = await openSheet(page);
    const plus = page.getByRole('button', { name: texts.graph.zoom_in.label, exact: true });
    let before = await labelsOf(canvas);
    for (let i = 0; i < 12 && !(await plus.getAttribute('aria-disabled')); i++) {
      await plus.click();
      const now = await labelsOf(canvas);
      expect(before.filter((id) => !now.includes(id)), `Zoom ${await zoomOf(canvas)}`).toEqual([]);
      expect(now.length).toBeGreaterThanOrEqual(before.length);
      before = now;
    }
  });

  // Größenänderung (z. B. Adressleiste am Handy): Die Knotenlagen bleiben,
  // eine eingepasste Ansicht passt sich neu ein, eine verschobene oder
  // gezoomte bleibt stehen (Owner, 6. 10. 2026)
  test('Größenänderung verzerrt das Layout nicht', async ({ page }) => {
    await page.setViewportSize(MOBIL);
    const { canvas, texts } = await openSheet(page, () =>
      page.locator('.cv-skill-chip__button[data-skill="python"]').click());
    const fit = page.locator('[data-role="graph-fit"]');
    await expect(fit).toHaveAttribute('aria-disabled', 'true');
    // Fenster nur verkleinern (nicht zurück: sonst fiele die Änderung in die
    // Entprellung oder ein proportionales Skalieren höbe sich wieder auf) und
    // abwarten, bis der entprellte ResizeObserver den Canvas neu bemessen hat
    let height = MOBIL.height;
    async function shrink() {
      const before = await canvas.evaluate((el) => el.height);
      height -= 60;
      await page.setViewportSize({ width: MOBIL.width, height });
      await page.waitForFunction((h) =>
        document.querySelector('[data-role="canvas"]').height !== h, before);
    }
    // Eingepasst: passt neu ein, bleibt Startansicht
    await shrink();
    await expect(fit).toHaveAttribute('aria-disabled', 'true');
    // Gezoomt (keine Startansicht): Kamera und Knoten bleiben, wo sie waren.
    // Mit dem alten getrennten Skalieren in x und y wanderte sel-y mit.
    await page.getByRole('button', { name: texts.graph.zoom_in.label, exact: true }).click();
    await expect(fit).not.toHaveAttribute('aria-disabled', /./);
    const x = await canvas.getAttribute('data-sel-x');
    const y = await canvas.getAttribute('data-sel-y');
    const labels = await labelsOf(canvas);
    await shrink();
    await expect(canvas).toHaveAttribute('data-sel-x', x);
    await expect(canvas).toHaveAttribute('data-sel-y', y);
    expect(await labelsOf(canvas)).toEqual(labels);
  });

  test('Zoom-Grenze: Knopf aria-disabled, bleibt fokussierbar', async ({ page }) => {
    const { canvas, texts } = await openSheet(page);
    const plus = page.getByRole('button', { name: texts.graph.zoom_in.label, exact: true });
    const minus = page.getByRole('button', { name: texts.graph.zoom_out.label, exact: true });
    await expect(plus).not.toHaveAttribute('aria-disabled', /./);
    for (let i = 0; i < 12 && !(await plus.getAttribute('aria-disabled')); i++) await plus.click();
    expect(await zoomOf(canvas)).toBeCloseTo(2.5, 3);
    await expect(plus).toHaveAttribute('aria-disabled', 'true');
    await expect(plus).toBeFocused();
    // Weiter drücken tut nichts, der Fokus bleibt am Knopf
    await page.keyboard.press('Enter');
    expect(await zoomOf(canvas)).toBeCloseTo(2.5, 3);
    await expect(plus).toBeFocused();
    await minus.click();
    await expect(plus).not.toHaveAttribute('aria-disabled', /./);
  });

  test('Nach Klick auf den Canvas wirken die Tasten weiter', async ({ page }) => {
    const { canvas } = await openSheet(page);
    const fit = await zoomOf(canvas);
    // Leere Ecke (Rand-Pfeile und Knoten liegen weiter innen)
    await canvas.click({ position: { x: 2, y: 2 } });
    expect(await page.evaluate(() => document.activeElement.getAttribute('data-role'))).toBe('canvas');
    await page.keyboard.press('+');
    expect(await zoomOf(canvas)).toBeGreaterThan(fit);
  });

  test.describe('flaches Fenster (Telefon quer)', () => {
    test.use({ viewport: { width: 844, height: 390 } });

    test('Sheet fast volle Höhe, Info-Leiste zweizeilig', async ({ page }) => {
      const { panel } = await openSheet(page);
      const box = await panel.boundingBox();
      expect(box.height).toBeGreaterThan(390 * 0.9);
      const wrap = await page.locator('[data-role="canvas-wrap"]').boundingBox();
      expect(wrap.height).toBeGreaterThan(200);
      // Light Dismiss bleibt möglich: oben ein Streifen Scrim
      expect(box.y).toBeGreaterThan(8);
    });
  });
});

// Ohne Reduced Motion: Die Kamera steht vom ersten Bild an (Layout wird vor
// dem Einpassen synchron zu Ende gerechnet, Owner-Korrektur 2.10.: der Graph
// bewegt sich nicht von selbst).
test.describe('Skill-Graph ohne Reduced Motion', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } });

  for (const vp of [{ name: 'Desktop', size: { width: 1280, height: 900 } }, { name: 'mobil', size: MOBIL }]) {
    test(`${vp.name}: keine Kamerafahrt nach dem Öffnen`, async ({ page }) => {
      await page.setViewportSize(vp.size);
      const { canvas } = await openSheet(page);
      const first = await zoomOf(canvas);
      const outside = await canvas.getAttribute('data-outside');
      await page.waitForTimeout(1500);
      expect(await zoomOf(canvas)).toBe(first);
      expect(await canvas.getAttribute('data-outside')).toBe(outside);
      if (first > 0.601) expect(outside).toBe('0');
    });
  }
});

// Kleiner Graph-Knopf in der klebenden Auswahl-Konsole (Owner, 7. 10. 2026):
// Er übernimmt, sobald der große Öffner oben aus dem Bild ist. Immer genau
// einer der beiden ist bedienbar, der andere inert und aria-hidden. Ohne
// Reduced Motion verwandelt sich der große beim Scrollen in den kleinen
// (scroll-getriebene CSS-Animation, wo die Engine sie kann), unter Reduced
// Motion läuft keine Animation.
const DOCK = '[data-role="graph-dock"]';
const BIG = '[data-role="graph-toggle"]';

// Scrollt die Seite so, dass die Hülle des großen Öffners um `past` px über
// der Unterkante der Konsole steht (negativ: darunter)
async function scrollOpener(page, past) {
  await page.evaluate((d) => {
    const slot = document.querySelector('[data-role="graph-toggle-slot"]');
    const line = parseFloat(getComputedStyle(document.querySelector('.cv-skills')).getPropertyValue('--graph-dock-line')) || 0;
    window.scrollTo({ top: slot.getBoundingClientRect().bottom + window.scrollY - line + d, behavior: 'instant' });
  }, past);
}

// Wer ist bedienbar? Je Knopf: inert, aria-hidden
const dockState = (page) => page.evaluate(([dock, big]) => [dock, big].map((sel) => {
  const el = document.querySelector(sel);
  return { inert: el.inert, hidden: el.getAttribute('aria-hidden') === 'true' };
}), [DOCK, BIG]);

test.describe('Kleiner Graph-Knopf in der Konsole', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  for (const vp of [{ name: 'Desktop', size: { width: 1280, height: 900 } }, { name: 'mobil', size: MOBIL }]) {
    test.describe(vp.name, () => {
      test.use({ viewport: vp.size });

      test('öffnet das Sheet, Fokus kehrt zu ihm zurück', async ({ page }) => {
        await page.goto('/auflinie/cv/', { waitUntil: 'load' });
        const texts = await skillTexts(page);
        const dock = page.locator(DOCK);
        const scope = page.locator('.cv-skills');
        // Oben im Abschnitt: der große ist bedienbar, der kleine nicht
        await scrollOpener(page, -300);
        await expect(scope).toHaveAttribute('data-graph-dock', 'big');
        expect(await dock.evaluate((el) => el.inert)).toBe(true);

        await scrollOpener(page, 150);
        await expect(scope).toHaveAttribute('data-graph-dock', 'small');
        await expect(dock).toBeVisible();
        await expect(dock).toHaveAccessibleName(texts.graph.open_short.label);
        await expect(dock).toHaveText(texts.graph.open_short.text);
        // Label in Name (WCAG 2.5.3, STYLEGUIDE 6.1): Der Name beginnt mit dem
        // sichtbaren Wort
        expect(texts.graph.open_short.label.startsWith(texts.graph.open_short.text)).toBe(true);
        await expect(dock).toHaveAttribute('aria-controls', 'skill-graph-panel');
        await expect(dock).toHaveAttribute('aria-expanded', 'false');

        // Mit aktueller Auswahl, wie der große Knopf
        await page.locator('.cv-skill-chip__button[data-skill="python"]').first().evaluate((el) => el.click());
        await dock.click();
        const panel = page.locator('[data-role="graph-panel"]');
        await expect(panel).toHaveAttribute('role', 'dialog');
        await expect(dock).toHaveAttribute('aria-expanded', 'true');
        await expect(page.locator('.skill-graph__sheet-close')).toBeFocused();
        await expect(page.locator('[data-role="canvas"]')).toHaveAttribute('data-sel-x', /\d/);

        await page.keyboard.press('Escape');   // löst die Auswahl
        await page.keyboard.press('Escape');   // schließt
        await expect(panel).not.toHaveAttribute('role', 'dialog');
        await expect(dock).toBeFocused();
        await expect(dock).toHaveAttribute('aria-expanded', 'false');
        await expect(page.locator(BIG)).toHaveAttribute('aria-expanded', 'false');

        // ✕ ebenso
        await dock.click();
        await page.locator('.skill-graph__sheet-close').click();
        await expect(panel).not.toHaveAttribute('role', 'dialog');
        await expect(dock).toBeFocused();
      });
    });
  }

  test('nie zwei bedienbare Öffner, der Fokus wandert mit', async ({ page }) => {
    await page.goto('/auflinie/cv/', { waitUntil: 'load' });
    const scope = page.locator('.cv-skills');
    const steps = [-400, -60, -10, 10, 60, 400, 60, -10, -400];
    for (const d of steps) {
      await scrollOpener(page, d);
      await expect(scope).toHaveAttribute('data-graph-dock', d > 0 ? 'small' : 'big');
      const [dock, big] = await dockState(page);
      // Genau einer bedienbar, der andere inert UND aria-hidden
      expect(dock.inert !== big.inert, `bei ${d} px`).toBe(true);
      expect([dock.hidden, big.hidden]).toEqual([dock.inert, big.inert]);
    }
    // Hat der große den Fokus, wenn er aus dem Bild gleitet, geht er an den kleinen
    await scrollOpener(page, -200);
    await page.locator(BIG).focus();
    await scrollOpener(page, 150);
    await expect(page.locator(DOCK)).toBeFocused();
    await scrollOpener(page, -200);
    await expect(page.locator(BIG)).toBeFocused();
  });

  test('Sprung per Anker: der kleine Knopf steht sofort, ohne Animation', async ({ page }) => {
    await page.goto('/auflinie/cv/', { waitUntil: 'load' });
    // Ein Ziel unterhalb des Öffners, aber noch im Abschnitt
    await page.evaluate(() => document.querySelectorAll('.cv-skill-group')[1].scrollIntoView({ behavior: 'instant' }));
    await expect(page.locator('.cv-skills')).toHaveAttribute('data-graph-dock', 'small');
    const dock = page.locator(DOCK);
    expect(await dock.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
    await expect.poll(() => dock.evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(1);
    expect(await page.locator(BIG).evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  });

  test.describe('Touch', () => {
    test.use({ viewport: MOBIL, hasTouch: true, isMobile: true });

    test('Trefferfläche 44 px, Konsole bleibt gleich hoch', async ({ page }) => {
      await page.goto('/auflinie/cv/', { waitUntil: 'load' });
      test.skip(!(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)), 'Engine meldet keinen groben Zeiger');
      const box = page.locator('[data-role="skill-console"]');
      const hoehe = await box.evaluate((el) => el.offsetHeight);
      expect(hoehe).toBe(await page.locator('[data-role="skill-context"]').evaluate((el) => el.offsetHeight));
      await scrollOpener(page, 150);
      await expect(page.locator('.cv-skills')).toHaveAttribute('data-graph-dock', 'small');
      expect(await box.evaluate((el) => el.offsetHeight)).toBe(hoehe);
      const fremd = await page.locator(DOCK).evaluate((e) => {
        const r = e.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = Math.max(r.width, 44) / 2 - 0.5;
        const dy = Math.max(r.height, 44) / 2 - 0.5;
        return [[cx, cy - dy], [cx, cy + dy], [cx - dx, cy], [cx + dx, cy]].filter(([x, y]) => {
          const hit = document.elementFromPoint(x, y);
          return !(hit && (hit === e || e.contains(hit)));
        });
      });
      expect(fremd).toEqual([]);
    });
  });
});

// Ohne Reduced Motion: Wo die Engine scroll-getriebene Animationen kann,
// hängen großer und kleiner Knopf an derselben Scroll-Zeitleiste (kein
// Scroll-Listener), sonst bleibt es bei der einfachen Blende.
test.describe('Kleiner Graph-Knopf: Verwandlung beim Scrollen', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' }, viewport: { width: 1280, height: 900 } });

  test('Scroll-Zeitleiste oder Blende, nie beide voll sichtbar', async ({ page }) => {
    await page.goto('/auflinie/cv/', { waitUntil: 'load' });
    await expect(page.locator('.cv-skills')).toHaveAttribute('data-graph-dock', 'big');
    const sda = await page.evaluate(() => CSS.supports('animation-timeline: view()') && CSS.supports('timeline-scope: none'));
    const names = () => page.evaluate(([dock, big]) => [dock, big].map((sel) =>
      getComputedStyle(document.querySelector(sel)).animationName), [DOCK, BIG]);
    expect(await names()).toEqual(sda ? ['graph-dock-in', 'graph-dock-out'] : ['none', 'none']);
    if (sda) {
      const timelines = await page.evaluate((sel) => document.querySelector(sel).getAnimations()
        .map((a) => a.timeline && a.timeline.constructor.name), DOCK);
      expect(timelines).toEqual(['ViewTimeline']);
    }
    // Mitten im Übergang: höchstens einer voll sichtbar
    for (const d of [-80, -40, -10, 10, 40]) {
      await scrollOpener(page, d);
      await page.waitForTimeout(100);
      const op = await page.evaluate(([dock, big]) => [dock, big].map((sel) =>
        Number(getComputedStyle(document.querySelector(sel)).opacity)), [DOCK, BIG]);
      expect(op[0] === 1 && op[1] === 1, `bei ${d} px: ${op}`).toBe(false);
    }
  });
});

// Vorschau beim Überfahren (Maus): ein Knoten ohne Namen zeigt ihn ruhig an,
// ohne Auswahl und ohne die Info-Leiste zu ändern. Verlassen nimmt sie weg,
// Esc nimmt sie allein weg (WCAG 1.4.13), erst das nächste Esc schließt das
// Sheet.
test.describe('Skill-Graph: Vorschau beim Überfahren', () => {
  test.use({ viewport: { width: 1280, height: 900 }, contextOptions: { reducedMotion: 'reduce' } });

  test('Name als Vorschau, Verlassen und Esc nehmen sie weg', async ({ page }) => {
    const { canvas, panel, texts } = await openSheet(page);
    // Kleinster Maßstab: dort fehlen die meisten Namen
    const minus = page.getByRole('button', { name: texts.graph.zoom_out.label, exact: true });
    for (let i = 0; i < 6 && !(await minus.getAttribute('aria-disabled')); i++) await minus.click();
    // Einen Knoten ohne Namen suchen: Zeiger-Ereignisse über ein Raster,
    // dann die Mitte seiner Trefferfläche (vor jedem Punkt die Vorschau per
    // pointerleave lösen, sonst hielte sie sich über ihrem eigenen Feld)
    const spot = await canvas.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const at = (x, y) => {
        el.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
        el.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: r.left + x,
          clientY: r.top + y, bubbles: true }));
        return el.getAttribute('data-preview');
      };
      for (let y = 4; y < r.height; y += 6) {
        for (let x = 4; x < r.width; x += 6) {
          const id = at(x, y);
          if (!id) continue;
          let sx = 0, sy = 0, n = 0;
          for (let v = y - 4; v < y + 36; v += 2) {
            for (let u = x - 20; u < x + 20; u += 2) {
              if (at(u, v) === id) { sx += u; sy += v; n++; }
            }
          }
          at(-50, -50);
          return { x: Math.round(sx / n), y: Math.round(sy / n), id };
        }
      }
      return null;
    });
    expect(spot, 'kein Knoten ohne Namen gefunden').not.toBeNull();
    expect(await labelsOf(canvas)).not.toContain(spot.id);
    const info = page.locator('[data-role="graph-context"]');
    const box = await canvas.boundingBox();
    // Echte Maus: drauf zeigt die Vorschau, ohne Auswahl und Info-Leiste
    await page.mouse.move(box.x + spot.x, box.y + spot.y);
    await expect(canvas).toHaveAttribute('data-preview', spot.id);
    await expect(canvas).not.toHaveAttribute('data-sel-x', /./);
    await expect(info).toContainText(texts.hint);
    await expect(info).not.toHaveClass(/is-active/);
    // Verlassen nimmt sie weg
    await page.mouse.move(box.x + box.width / 2, box.y - 30);
    await expect(canvas).not.toHaveAttribute('data-preview', /./);
    await page.mouse.move(box.x + spot.x, box.y + spot.y);
    await expect(canvas).toHaveAttribute('data-preview', spot.id);
    await page.keyboard.press('Escape');
    await expect(canvas).not.toHaveAttribute('data-preview', /./);
    await expect(panel).toHaveAttribute('role', 'dialog');
    await page.keyboard.press('Escape');
    await expect(panel).not.toHaveAttribute('role', 'dialog');
  });
});

// Touch-Hinweis (Owner: Kasten mittig über dem Graphen) in voller Breite:
// Zeilen brechen nicht mitten in der Phrase um.
test.describe('Touch-Hinweis', () => {
  test.use({ viewport: MOBIL, hasTouch: true, isMobile: true, contextOptions: { reducedMotion: 'reduce' } });

  test('mittig über dem Canvas, drei Zeilen', async ({ page }) => {
    await openSheet(page);
    const hint = page.locator('.skill-graph__touch-hint');
    await expect(hint).toHaveClass(/is-show/);
    const h = await hint.boundingBox();
    const c = await page.locator('[data-role="canvas-wrap"]').boundingBox();
    expect(Math.abs(h.x + h.width / 2 - (c.x + c.width / 2))).toBeLessThan(1.5);
    expect(Math.abs(h.y + h.height / 2 - (c.y + c.height / 2))).toBeLessThan(1.5);
    const lineHeight = await hint.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));
    const pad = await hint.evaluate((el) => parseFloat(getComputedStyle(el).paddingTop) * 2 + 2);
    expect(Math.round((h.height - pad) / lineHeight)).toBe(3);
  });
});

// Alle Seiten aus pages.js, samt jedem Beitrag des Review-Builds. Die
// Offline-Seite hat nur Sprunglinks, Menü, Neu-laden-Knopf und Footer.
const MIN_TAB_STOPS = { 'offline.html': 5 };
test.describe('Kein unsichtbarer Fokus (WCAG 2.4.7)', () => {
  for (const p of PAGES) {
    test(`Tab durch /${p}`, async ({ page }) => {
      await ohneBlogHinweis(page);
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
      expect(seen.size, 'Tab-Runde zu kurz, Test greift nicht').toBeGreaterThan(MIN_TAB_STOPS[p] || 10);
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

  // Beim Ziehen des Fensters über die md-Grenze: fractal-panel.js schaltet
  // die Zoom-Knöpfe gedrosselt im nächsten Frame um (JS-12). Direkt im
  // resize-Event las WebKit die Media Query noch mit der alten Breite, die
  // Knöpfe zeigten den Stand vor dem Resize.
  test('Fraktal-Zoomknöpfe folgen der md-Grenze beim Resize', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/auflinie/mandelbrot/', { waitUntil: 'load' });
    const zoom = () => page.$$eval('[data-role="mobile-zoom"]', (els) => [...new Set(els.map((e) => e.style.display))].join());
    // Längere Frist: WebKit rendert unter Last langsam, der Umschalter läuft
    // erst im nächsten Frame (rAF-gedrosselt).
    const frist = { timeout: 15000 };
    await expect.poll(zoom, frist).toBe('none');
    await page.setViewportSize({ width: 767, height: 900 });
    await expect.poll(zoom, frist).toBe('flex');
    await page.setViewportSize({ width: 768, height: 900 });
    await expect.poll(zoom, frist).toBe('none');
  });
});

// Touch hält keinen Theme-Hover fest (BP-3, früher R-79): Das Theme stellt
// seine :hover-Regeln nicht hinter (hover: hover), Touch-Browser halten :hover
// nach dem Antippen fest. Die Gegenregeln in no-hover setzen dort die
// Ruhewerte. Ein Mausschritt hält :hover wie ein Tipp (tap() allein nicht).
// TOC-Links bleiben außen vor, ihr Aktiv-Zustand folgt dem Scrollen.
test.describe('Touch hält keinen Theme-Hover (BP-3)', () => {
  const SEL = ['.page__content a[href]:not(.toc__menu a, .toc-sticky-mobile a)', '.page__footer a[href]',
    '.author__urls a[href]', '.sidebar'].join(', ');
  const SEITEN = [
    { path: '', width: 390 }, { path: 'about/', width: 390 }, { path: 'posts/', width: 390 },
    { path: 'posts/blogbeitrag-erstellen/', width: 390 }, { path: 'archiv/', width: 390 },
    { path: '404.html', width: 390 }, { path: 'cv/', width: 1024 },
  ];
  const stile = (el) => el.evaluate((e) => {
    const cs = getComputedStyle(e);
    const img = e.querySelector('img');
    return [cs.color, cs.textDecorationLine, cs.backgroundColor, cs.opacity, img && getComputedStyle(img).boxShadow].join(' | ');
  });

  for (const { path, width } of SEITEN) {
    test.describe(`${width} px`, () => {
      test.use({ viewport: { width, height: 844 }, hasTouch: true, isMobile: true, contextOptions: { reducedMotion: 'reduce' } });

      test(`/${path}`, async ({ page }) => {
        await ohneBlogHinweis(page);
        await page.goto(`/auflinie/${path}`, { waitUntil: 'load' });
        await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' });
        expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);
        const ziele = page.locator(SEL);
        const n = await ziele.count();
        const haengt = [];
        let geprueft = 0;
        for (let i = 0; i < n; i++) {
          const el = ziele.nth(i);
          if (!(await el.isVisible())) continue;
          // Mitte des Fensters, damit keine Leiste (Masthead, Sticky-TOC) den
          // Punkt verdeckt. Liegt doch etwas darüber, zählt das Ziel nicht.
          const punkt = await el.evaluate((e) => {
            e.scrollIntoView({ block: 'center', inline: 'nearest' });
            const r = [...e.getClientRects()].find((q) => q.width > 0 && q.height > 0);
            if (!r) return null;
            const p = { x: r.left + Math.min(r.width / 2, 8), y: r.top + r.height / 2 };
            const hit = document.elementFromPoint(p.x, p.y);
            return hit && (hit === e || e.contains(hit)) ? p : null;
          });
          if (!punkt) continue;
          await page.mouse.move(-10, -10);
          const ruhe = await stile(el);
          await page.mouse.move(punkt.x, punkt.y);
          const nachTipp = await stile(el);
          geprueft += 1;
          if (nachTipp !== ruhe) {
            const was = await el.evaluate((e) => e.outerHTML.slice(0, 90));
            haengt.push(`${was}\n  Ruhe:      ${ruhe}\n  nach Tipp: ${nachTipp}`);
          }
        }
        expect(geprueft, 'keine sichtbaren Ziele, Test greift nicht').toBeGreaterThan(1);
        expect(haengt, haengt.join('\n')).toEqual([]);
      });
    });
  }
});

// Touch-Ziele (STYLEGUIDE 6.1, Owner 6. 10. 2026): Menü-Knopf und Buttons
// (auch „Folgen“) treffen unter (pointer: coarse) auf 44 × 44 px, obwohl sie
// kleiner aussehen (unsichtbares Polster, Mixin touch-target-pad). Geprüft
// per elementFromPoint an den Rändern der 44-px-Zone um die Mitte: Jeder
// Punkt muss das Ziel selbst treffen. Liegt dort ein Nachbar oder etwas
// anderes darüber, schlägt der Test fehl. WebKit im Container trifft das
// Polster des Menü-Knopfs erst, nachdem es neu gemalt hat (es malt dort
// teils unter einem Bild pro Sekunde, R-87), daher pollt der Test.
test.describe('Touch-Ziele 44 px (6.1)', () => {
  test.use({ viewport: MOBIL, hasTouch: true, isMobile: true, contextOptions: { reducedMotion: 'reduce' } });
  const SEL = '.greedy-nav__toggle, .btn';
  // Leer, wenn alle vier Randpunkte das Ziel treffen, sonst Befund als Text
  const randpunkte = (el) => el.evaluate((e) => {
    // Der Menü-Knopf steht im festen Masthead, alles andere zur Mitte
    if (!e.closest('.masthead')) e.scrollIntoView({ block: 'center', behavior: 'instant' });
    const r = e.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = Math.max(r.width, 44) / 2 - 0.5;
    const dy = Math.max(r.height, 44) / 2 - 0.5;
    const fremd = [[cx, cy - dy], [cx, cy + dy], [cx - dx, cy], [cx + dx, cy]].map(([x, y]) => {
      const hit = document.elementFromPoint(x, y);
      if (hit && (hit === e || e.contains(hit))) return null;
      return hit ? `${hit.tagName.toLowerCase()}.${String(hit.className).split(' ')[0]}` : 'nichts';
    }).filter(Boolean);
    if (!fremd.length) return '';
    return `${e.outerHTML.slice(0, 80)} (${r.width.toFixed(1)} × ${r.height.toFixed(1)} px), Randpunkte treffen ${fremd.join(', ')}`;
  });

  for (const path of ['', 'posts/', 'archiv/', 'posts/blogbeitrag-erstellen/']) {
    test(`/${path}`, async ({ page }) => {
      await ohneBlogHinweis(page);
      await page.goto(`/auflinie/${path}`, { waitUntil: 'load' });
      test.skip(!(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)), 'Engine meldet keinen groben Zeiger');
      const ziele = page.locator(SEL);
      const n = await ziele.count();
      let geprueft = 0;
      for (let i = 0; i < n; i++) {
        const el = ziele.nth(i);
        if (!(await el.isVisible())) continue;
        geprueft += 1;
        await expect.poll(() => randpunkte(el), { timeout: 15_000 }).toBe('');
      }
      expect(geprueft, 'keine sichtbaren Ziele, Test greift nicht').toBeGreaterThan(0);
    });
  }
});

// Kachelbilder tragen die echten Maße ihrer Datei (IMG-3, früher R-94):
// _plugins/bildmasse.rb liest sie beim Build aus header.teaser. Stimmen sie
// nicht (falsch gelesen, EXIF-Drehung vergessen), reserviert der Browser vor
// dem Laden die falsche Fläche und das Layout springt doch. Fehlen sie ganz,
// warnt scripts/content-check.py --site, hier zählt nur die Richtigkeit.
test.describe('Kachelbilder mit den Maßen ihrer Datei (IMG-3)', () => {
  for (const path of ['', ...POSTS]) {
    test(`/${path}`, async ({ page }) => {
      await ohneBlogHinweis(page);
      await page.goto(`/auflinie/${path}`, { waitUntil: 'load' });
      // Ohne Attribute (Format nicht lesbar) nur die Warnung, kein roter Lauf (ARCH-5)
      const mitMassen = page.locator('.archive__item-teaser img[width][height]');
      const bilder = await mitMassen.evaluateAll((imgs) => Promise.all(imgs.map(async (img) => {
        img.loading = 'eager';
        await img.decode().catch(() => {});
        return {
          src: img.getAttribute('src'),
          attr: `${img.getAttribute('width')}x${img.getAttribute('height')}`,
          datei: `${img.naturalWidth}x${img.naturalHeight}`,
        };
      })));
      const falsch = bilder.filter((b) => b.attr !== b.datei).map((b) => `${b.src}: ${b.attr}, Datei ${b.datei}`);
      expect(falsch, falsch.join('\n')).toEqual([]);
    });
  }
});

// Fußnoten-Rücksprung mit sprechendem Namen (6.5, R-95): _plugins/inhalts-a11y.rb
// setzt beim Build aria-label „Zurück zum Text“ an jedes a.reversefootnote.
// Beiträge ohne Fußnote bestehen ohne Prüfung, ein neuer mit Fußnote ist dabei.
test.describe('Fußnoten-Rücksprung heißt „Zurück zum Text“ (6.5)', () => {
  for (const path of POSTS) {
    test(`/${path}`, async ({ page }) => {
      await ohneBlogHinweis(page);
      await page.goto(`/auflinie/${path}`, { waitUntil: 'load' });
      const links = page.locator('a.reversefootnote');
      const n = await links.count();
      for (let i = 0; i < n; i++) {
        await expect(links.nth(i)).toHaveAccessibleName('Zurück zum Text');
      }
    });
  }
});
