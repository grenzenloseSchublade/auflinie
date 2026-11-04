/**
 * neon-orbit-toggle.js — Ü-Punkte im Startseiten-Titel: Klicks oder
 * Enter/Leertaste auf .neon-orbit-trigger (das „a“ in „Hans“) schicken die
 * beiden Punkte (.neon-dot) auf eine Bahn und holen sie wieder zurück.
 *
 * - 2 Klicks, „Zwei Sterne“: beide Punkte weiß auf einer gemeinsamen,
 *   leicht geneigten Ellipse über dem „u“. Ende: Die Punkte schwirren in
 *   zufällige Richtungen über den Hero und kehren in die Ruhelage zurück.
 * - 3 Klicks, „Atom“: Punkt 1 cyan, Punkt 2 magenta, jeder auf einer
 *   eigenen Ellipse um das „u“, hinten hinter den Buchstaben. Ende: Die
 *   Punkte kreiseln schneller nach innen, treffen sich, ein Blitz, dann
 *   tauchen sie in der Ruhelage wieder auf.
 * - Ein Modus endet nur mit derselben Klickzahl (Klickfenster 350 ms).
 *
 * Bewegt wird per requestAnimationFrame, nur transform und opacity (PERF-7).
 * Die Einlauf-Spirale endet mit genau der Winkelgeschwindigkeit der Bahn
 * (Hermite-Rampe), auch die Übergänge in die Enden sind stetig. Außerhalb
 * des Viewports und bei verborgenem Tab hält die Bewegung an (Klasse
 * neon-paused, sie pausiert auch das Flackern der Ruhelage in CSS).
 *
 * Alle Maße in em, Ursprung ist die Mitte zwischen den ruhenden Punkten.
 * Die Ruhelage selbst steht in CSS (components/_neon-base.scss, Variablen in
 * variables/_css-properties.scss), das Skript startet und endet genau dort.
 * Seiten-Modul, mountet einmal beim Laden. Nur auf der Startseite geladen
 * (_includes/scripts.html, Flag neon_name).
 */
(() => {
  'use strict';

  const clickWindowMs = 350;
  const startDelayS = 0.15;

  // Bahnen. center: Mittelpunkt relativ zur Ruhe-Mitte (y nach unten),
  // r: große Halbachse, squash: kleine Halbachse / große, tilts: Neigung je
  // Punkt in Grad, period: Sekunden je Umlauf (beide Punkte gleich schnell,
  // sie stehen sich auf der Bahn gegenüber, wie sie aus der Ruhelage
  // kommen), depthScale: Größe vorne +x, hinten −x, rampSquash: Stauchung
  // des Startkreises im Einlauf (1 = Kreis), runBend: Spanne des seitlichen Bogens im Einlauf (em),
  // spin: Spanne des Schwungs beim Drehen auf der Stelle (Vielfaches der
  // Drehzahl). Mit einlauf: 'wirbel' kreisen die Punkte sofort um die
  // Bahnmitte, in entgegengesetzter Richtung voneinander weg, und finden
  // vom Abstand ihrer Ruhelage aus auf ihre Bahn. Dazu je Punkt eine eigene
  // Schale: rInner und periods (innen schneller, außen langsamer), wer
  // innen läuft, wird je Start gewürfelt. Die Lage der Sterne-Bahn ist an
  // der Ubuntu-Schrift des Hero-Titels gemessen: Die Punkte bleiben samt
  // Schein-Kern frei von „M“, „u“ und „l“, auch im Einlauf, der deshalb flach
  // beginnt und nicht zum „u“ hinabtaucht (Messung siehe Commit).
  const MODES = {
    sterne: {
      center: { x: 0, y: -0.26 }, r: 0.22, squash: 0.4, tilts: [-8, -8],
      period: 3.8, depthScale: 0.12, rampSquash: 0.4, runBend: [0.02, 0.05], spin: [1.2, 1.8],
      accent: false, ende: 'scatter',
    },
    atom: {
      center: { x: 0, y: 0.55 }, r: 0.7, rInner: 0.62, squash: 0.3, tilts: [32, -32],
      periods: [3.4, 4.6], depthScale: 0.22, einlauf: 'wirbel',
      accent: true, ende: 'explosion',
    },
  };

  // Ende „Wegschwirren“: fünf Abschnitte gleicher Dauer durch vier
  // Wegpunkte zurück in die Ruhelage, Größe je Wegpunkt
  const SCATTER = { dur: 3, scales: [1.5, 0.8, 1.2, 1, 1] };
  // Ende „Explosion“: Die Punkte bleiben auf ihren Bahnen, Umlauf und
  // Präzession drehen in spinUp Sekunden auf das boost- bzw.
  // precessBoost-Fache hoch. Die erste enge Begegnung auf dem Bildschirm
  // danach (innerhalb search Sekunden, Abstand unter gap em) wird zum
  // Zusammenstoß, dort entsteht der Blitz. In den letzten merge Sekunden
  // ziehen beide Punkte auf ihre gemeinsame Mitte. Ab dem Zusammenstoß
  // (Sekunden): white Punkte werden vorher weiß, peak Blitz am größten,
  // glow Blitz verglüht, fade Punkte ausgeblendet, back wieder in der
  // Ruhelage
  const EXPLOSION = {
    spinUp: [4, 5], boost: 3.5, precessBoost: 12, search: 2, gap: 0.2, merge: 0.25,
    white: 0.4, peak: 0.32, glow: 0.8, fade: 1.25, back: 1.75,
  };

  // Lage im Explosionsende t Sekunden nach dem Beenden, ohne Zusammenziehen
  const explosionRaw = (m, run, e, t, i) => {
    const ang = e.ang[i] + dotDir(m, run, i) * e.omega[i] * boosted(t, e.spinUp, EXPLOSION.boost);
    const tilt = m.tilts[i] + e.precess + e.wp * boosted(t, e.spinUp, EXPLOSION.precessBoost);
    return polar(m.center.x, m.center.y, dotR(m, run, i), ang, tilt, m.squash);
  };

  // Integral einer Drehzahl, die mit smoothstep in T Sekunden von 1 auf G
  // steigt: t + (G − 1)·∫ smoothstep
  const boosted = (t, T, G) => {
    const x = Math.min(1, t / T);
    const ramp = T * (x * x * x - (x * x * x * x) / 2) + Math.max(0, t - T);
    return t + (G - 1) * ramp;
  };

  // Deckkraft ganz hinten auf der Bahn (vorne 1)
  const DEPTH_OPACITY = 0.72;

  const DEG = Math.PI / 180;
  const clamp01 = (u) => Math.max(0, Math.min(1, u));
  const smooth = (u) => { const v = clamp01(u); return v * v * (3 - 2 * v); };
  const rnd = (a, b) => a + Math.random() * (b - a);

  // Punkt auf einer geneigten Ellipse; z = sin(Winkel): +1 vorne, −1 hinten
  const polar = (cx, cy, r, angDeg, tiltDeg, squash) => {
    const a = angDeg * DEG;
    const t = tiltDeg * DEG;
    const px = r * Math.cos(a);
    const py = r * Math.sin(a) * squash;
    return { x: cx + px * Math.cos(t) - py * Math.sin(t), y: cy + px * Math.sin(t) + py * Math.cos(t), z: Math.sin(a) };
  };

  // Einlauf der Sterne in zwei Phasen. Zuerst drehen sich die Punkte auf der Stelle
  // um ihre gemeinsame Mitte (Dauer spinIn), die Drehzahl wächst rasch auf
  // die der Bahn (Zeitkonstante tauW) und liegt anfangs um einen Schwung
  // darüber (Faktor spin, Höhepunkt nach tauB), denn auf dem kleinen Kreis
  // drehen sie schneller. Erst danach lösen sich Mittelpunkt, Radius,
  // Neigung und Stauchung aus der Ruhe und folgen ihrem Ziel wie eine
  // kritisch gedämpfte Feder: ohne Ruck, langsam ankommend, ohne
  // Überschwingen. Mit dem wachsenden Radius klingt der Schwung ab. Der
  // Mittelpunkt wandert auf einem leicht gebogenen Weg, der Radius wächst
  // etwas später. Dauer, Zeitkonstanten, Schwung und Bogen werden bei jedem
  // Start neu gewürfelt, so verläuft jeder Einlauf ein wenig anders
  const START_ANG = [180, 0];
  const RUN = {
    spinIn: [1, 1.5],
    tauW: [0.35, 0.6],
    tauBFactor: [0.7, 0.9],
    tauC: [0.6, 0.85],
    tauRFactor: [1, 1.3],
    settle: 6,
    // Tiefe schon beim Drehen auf der Stelle (Anteil der vollen Tiefe)
    spinDepth: 0.6,
  };

  // Federweg 0 → 1 der kritisch gedämpften Feder (Start mit Tempo 0)
  const spring = (t, tau) => (t <= 0 ? 0 : 1 - (1 + t / tau) * Math.exp(-t / tau));

  // Wirbel-Einlauf: tauR und tauS Federn für Radius sowie Stauchung und
  // Neigung, tauW Anlauf der Drehzahl. Präzession: Beide Ovale drehen sich
  // langsam um die Bahnmitte, eine Umdrehung in precess Sekunden, Richtung
  // je Start gewürfelt, sanft angelaufen (Zeitkonstante tauPrecess)
  const WIRBEL = { tauR: [0.5, 0.8], tauSFactor: 1.2, tauW: [0.3, 0.45], settle: 6, precess: [35, 50], tauPrecess: 2 };

  const makeRun = (m, rest) => {
    if (m.einlauf === 'wirbel') {
      const tauR = rnd(...WIRBEL.tauR);
      const inner = Math.random() < 0.5 ? 0 : 1;
      // Start genau in der Ruhelage, auf einem Kreis um die Bahnmitte. dir:
      // Drehsinn, jeder Punkt läuft zu seiner Seite vom anderen weg
      const from = [0, 1].map((i) => {
        const p = rest.pos(i);
        const dx = p.x - m.center.x;
        const dy = p.y - m.center.y;
        return { r: Math.hypot(dx, dy), ang: Math.atan2(dy, dx) / DEG, dir: dx < 0 ? -1 : 1 };
      });
      return {
        inner,
        from,
        tauR,
        tauS: tauR * WIRBEL.tauSFactor,
        tauW: rnd(...WIRBEL.tauW),
        precess: (Math.random() < 0.5 ? -1 : 1) * 360 / rnd(...WIRBEL.precess),
        settle: WIRBEL.settle * tauR * WIRBEL.tauSFactor,
      };
    }
    const delay = rnd(...RUN.spinIn);
    const tauC = rnd(...RUN.tauC);
    const tauR = tauC * rnd(...RUN.tauRFactor);
    const sideways = Math.random() < 0.5 ? -1 : 1;
    return {
      delay,
      tauW: rnd(...RUN.tauW),
      tauB: delay * rnd(...RUN.tauBFactor),
      spin: rnd(...m.spin),
      tauC,
      tauR,
      bend: sideways * rnd(...m.runBend),
      settle: delay + RUN.settle * Math.max(tauC, tauR),
    };
  };

  // Radius und Umlaufzeit je Punkt (beim Wirbel innen kleiner und schneller)
  const dotR = (m, run, i) => (m.rInner && i === run.inner ? m.rInner : m.r);
  const dotPeriod = (m, run, i) => (m.periods ? m.periods[i === run.inner ? 0 : 1] : m.period);
  const dotDir = (m, run, i) => (run.from ? run.from[i].dir : 1);

  // Winkel nach tt Sekunden: Drehzahl ω·(1 − e^(−t/τW)) plus Schwung
  // ω·spin·(t/τB)·e^(1 − t/τB), beides aufintegriert
  const runAngle = (m, run, tt, i) => {
    const omega = 360 / dotPeriod(m, run, i);
    const t = Math.max(0, tt);
    const base = t - run.tauW * (1 - Math.exp(-t / run.tauW));
    if (m.einlauf === 'wirbel') return run.from[i].ang + dotDir(m, run, i) * omega * base;
    const swing = run.spin * Math.E * run.tauB * spring(t, run.tauB);
    return START_ANG[i] + omega * (base + swing);
  };

  // Wirbel: Radius vom Abstand der Ruhelage über eine Feder zum Ziel
  // Präzessionswinkel nach tt Sekunden (Drehzahl sanft angelaufen)
  const precessAngle = (run, tt) => {
    if (!run.precess) return 0;
    const t = Math.max(0, tt);
    const tau = WIRBEL.tauPrecess;
    return run.precess * (t - tau * (1 - Math.exp(-t / tau)));
  };

  function wirbelPos(m, run, tt, i) {
    const r0 = run.from[i].r;
    const r = r0 + (dotR(m, run, i) - r0) * spring(tt, run.tauR);
    const ps = spring(tt, run.tauS);
    const p = polar(m.center.x, m.center.y, r, runAngle(m, run, tt, i), m.tilts[i] * ps + precessAngle(run, tt), 1 + (m.squash - 1) * ps);
    return { x: p.x, y: p.y, z: p.z, w: spring(tt, run.tauW) };
  }

  // Lage tt Sekunden nach dem Start, inklusive Einlauf. w: Anteil der
  // Tiefenwirkung (0 in der Ruhe)
  function orbitPos(m, run, rest, tt, i) {
    if (tt <= 0) return rest.pos(i);
    if (m.einlauf === 'wirbel') return wirbelPos(m, run, tt, i);
    const pc = spring(tt - run.delay, run.tauC);
    const pr = spring(tt - run.delay, run.tauR);
    // Bogen quer zum Weg des Mittelpunkts, größte Auslenkung auf halbem Weg
    const len = Math.hypot(m.center.x, m.center.y) || 1;
    const bend = run.bend * Math.sin(Math.PI * pc);
    const cx = m.center.x * pc - (m.center.y / len) * bend;
    const cy = m.center.y * pc + (m.center.x / len) * bend;
    const r = rest.off + (m.r - rest.off) * pr;
    const p = polar(cx, cy, r, runAngle(m, run, tt, i), m.tilts[i] * pr, m.rampSquash + (m.squash - m.rampSquash) * pr);
    const wSpin = RUN.spinDepth * spring(tt, run.tauW);
    return { x: p.x, y: p.y, z: p.z, w: wSpin + (1 - wSpin) * pr };
  }

  const orbitAngle = (m, run, tt, i) => runAngle(m, run, tt, i);

  // Catmull-Rom zwischen p1 und p2
  const cr = (p0, p1, p2, p3, t) => {
    const t2 = t * t;
    const t3 = t2 * t;
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  };

  const emOf = (value, fallback) => {
    const v = (value || '').trim();
    return v.endsWith('em') && !Number.isNaN(parseFloat(v)) ? parseFloat(v) : fallback;
  };

  // Ruhelage aus den CSS-Variablen. Beide Punkt-Elemente stehen in CSS am
  // selben Anker (--neon-orbit-center-x), translateX versetzt sie um
  // --neon-orbit-start-offset-before/-after. off: halber Abstand der
  // ruhenden Punkte, mid: Lage der Ruhe-Mitte gegenüber dem Anker
  const readRest = (umlaut) => {
    const cs = getComputedStyle(umlaut);
    const before = emOf(cs.getPropertyValue('--neon-orbit-start-offset-before'), -0.12);
    const after = emOf(cs.getPropertyValue('--neon-orbit-start-offset-after'), 0.12);
    const rest = { off: (after - before) / 2, mid: (after + before) / 2 };
    rest.pos = (i) => ({ x: i === 0 ? -rest.off : rest.off, y: 0, z: 1 });
    return rest;
  };

  // Bühne je .neon-name: zwei Punkte, Zustand, Zeichenschleife
  const createStage = (scope) => {
    const umlaut = scope.querySelector('.neon-umlaut');
    const dots = umlaut ? Array.from(umlaut.querySelectorAll('.neon-dot')) : [];
    if (dots.length !== 2) return null;

    const st = { scope, umlaut, dots, rest: readRest(umlaut), mode: null, phase: 'rest',
      t0: 0, end: null, stopPending: false, raf: 0, pausedAt: null, flash: null, flashAnim: null, run: null };
    const runOf = () => st.run;

    // Punkt i an Lage p (em, relativ zur Ruhe-Mitte) zeichnen. translate
    // zählt vom Anker aus, in der Ruhelage ergibt das genau den CSS-Wert
    const paint = (pos, scales, ops, depthOn) => {
      dots.forEach((d, i) => {
        const p = pos[i];
        d.style.transform = `translate(${(p.x + st.rest.mid).toFixed(4)}em, ${p.y.toFixed(4)}em) scale(${scales[i].toFixed(4)})`;
        d.style.opacity = ops[i].toFixed(3);
        d.classList.toggle('neon-dot--back', depthOn && p.z * (p.w ?? 1) < -0.05);
      });
    };

    // Tiefe: vorne größer und heller, hinten kleiner und dunkler (Deckkraft
    // DEPTH_OPACITY bis 1). amount blendet den Effekt ein und aus (1 = voll)
    const depth = (pos, amount = 1) => {
      const ds = MODES[st.mode].depthScale;
      return [
        pos.map((p) => 1 + ds * p.z * amount * (p.w ?? 1)),
        pos.map((p) => 1 - (1 - DEPTH_OPACITY) * ((1 - p.z) / 2) * amount * (p.w ?? 1)),
      ];
    };

    const setClass = (name, on) => scope.classList.toggle(name, on);

    const reset = () => {
      cancelAnimationFrame(st.raf);
      st.raf = 0;
      st.phase = 'rest';
      st.mode = null;
      st.end = null;
      st.stopPending = false;
      if (st.flashAnim) st.flashAnim.cancel();
      st.flashAnim = null;
      dots.forEach((d) => {
        d.removeAttribute('style');
        d.classList.remove('neon-dot--back');
      });
      ['orbit-running', 'orbit-accent', 'orbit-flash'].forEach((c) => setClass(c, false));
    };

    // Grenzen für das Wegschwirren in em relativ zur Ruhe-Mitte: die
    // Hero-Fläche ohne den festen Masthead, mit Rand für Punkt und Schein
    const scatterBox = (fontPx) => {
      // Ruhe-Mitte im Viewport: Anker der Punkte (unverschoben) plus mid
      const u = umlaut.getBoundingClientRect();
      const d = dots[0];
      const midX = u.left + d.offsetLeft + d.offsetWidth / 2 + st.rest.mid * fontPx;
      const midY = u.top + d.offsetTop + d.offsetHeight / 2;
      const hero = (scope.closest('.page__hero, .page__hero--overlay') || document.documentElement).getBoundingClientRect();
      const masthead = document.querySelector('.masthead');
      const mBottom = masthead ? masthead.getBoundingClientRect().bottom : 0;
      const top = Math.max(hero.top, mBottom, 0);
      const margin = 0.45 * fontPx;
      return {
        left: (Math.max(hero.left, 0) + margin - midX) / fontPx,
        right: (hero.right - margin - midX) / fontPx,
        top: (top + margin - midY) / fontPx,
        bottom: (hero.bottom - margin - midY) / fontPx,
      };
    };

    // Weite eines Strahls von der Ruhe-Mitte bis an den Rand der Box
    const rayLength = (box, ang) => {
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      const tx = c > 1e-6 ? box.right / c : c < -1e-6 ? box.left / c : Infinity;
      const ty = s > 1e-6 ? box.bottom / s : s < -1e-6 ? box.top / s : Infinity;
      return Math.max(0, Math.min(tx, ty));
    };

    // Vier Wegpunkte in zufälligen Richtungen über volle 360°, jede Richtung
    // deutlich anders als die vorige, Weite zufällig bis an den Hero-Rand.
    // Aufeinanderfolgende Wegpunkte halten Mindestabstand, sonst zittert der
    // Punkt auf der Stelle. Jeder Punkt würfelt für sich, bei jedem Ende neu
    const scatterPath = (box, from) => {
      const w = box.right - box.left;
      const h = box.bottom - box.top;
      const minGap = Math.max(2, 0.3 * Math.min(w, h));
      // Wegpunkte in einer um 8 % eingezogenen Box und höchstens 85 % des
      // Strahls: Die Kurve schwingt zwischen den Wegpunkten etwas aus, so
      // bleibt sie im Hero (Simulation: 0 von 4000 Läufen über den Rand)
      const inner = { left: box.left + 0.08 * w, right: box.right - 0.08 * w, top: box.top + 0.08 * h, bottom: box.bottom - 0.08 * h };
      const pts = [];
      let prev = from;
      let dir = Math.random() * 360;
      for (let k = 0; k < 4; k++) {
        let best = null;
        for (let tries = 0; tries < 24; tries++) {
          const d = (dir + rnd(70, 290)) % 360;
          const len = rayLength(inner, d * DEG) * rnd(0.45, 0.85);
          const p = { x: Math.cos(d * DEG) * len, y: Math.sin(d * DEG) * len, d };
          // Der letzte Wegpunkt hält auch Abstand zur Ruhelage
          const gap = Math.min(Math.hypot(p.x - prev.x, p.y - prev.y), k === 3 ? Math.hypot(p.x, p.y) : Infinity);
          if (!best || gap > best.gap) best = { p, gap };
          if (gap >= minGap) break;
        }
        pts.push(best.p);
        dir = best.p.d;
        prev = best.p;
      }
      return pts;
    };

    const beginEnd = (now) => {
      const m = MODES[st.mode];
      const tt = (now - st.t0) / 1000;
      const h = 0.02;
      const p = [0, 1].map((i) => orbitPos(m, runOf(st.mode), st.rest, tt, i));
      const pPrev = [0, 1].map((i) => orbitPos(m, runOf(st.mode), st.rest, tt - h, i));
      const dz = depth(p);
      st.phase = 'ende';
      st.stopPending = false;
      st.end = { t0: now, from: p, scale0: dz[0], op0: dz[1] };

      if (m.ende === 'scatter') {
        const fontPx = parseFloat(getComputedStyle(st.umlaut).fontSize) || 16;
        const box = scatterBox(fontPx);
        const segT = SCATTER.dur / 5;
        st.end.box = box;
        st.end.paths = [0, 1].map((i) => {
          const rest = st.rest.pos(i);
          const way = scatterPath(box, p[i]);
          // Vorgänger so gewählt, dass die Catmull-Rom-Tangente am Start
          // genau der Bahngeschwindigkeit entspricht: (w1 − v0) / 2 = v·segT
          const v = { x: (p[i].x - pPrev[i].x) / h, y: (p[i].y - pPrev[i].y) / h };
          const pre = { x: way[0].x - 2 * v.x * segT, y: way[0].y - 2 * v.y * segT };
          // Nachfolger = letzter Wegpunkt: Tangente 0, Ankunft ohne Ruck
          return [pre, p[i], ...way, rest, way[3]];
        });
        return;
      }
      // Explosion: Startwinkel, Neigung und Drehzahlen auf der Bahn, stetig
      // aus dem Moment des Beendens (das Ende beginnt nie im Einlauf)
      const run = runOf(st.mode);
      const e = st.end;
      e.ang = [0, 1].map((i) => orbitAngle(m, run, tt, i));
      e.precess = precessAngle(run, tt);
      e.omega = [0, 1].map((i) => (360 / dotPeriod(m, run, i)) * (1 - Math.exp(-tt / run.tauW)));
      e.wp = (run.precess || 0) * (1 - Math.exp(-tt / WIRBEL.tauPrecess));
      e.spinUp = rnd(...EXPLOSION.spinUp);
      // Ort des Zusammenstoßes: erste enge Begegnung nach dem Hochdrehen,
      // sonst die engste im Suchfenster
      const step = 1 / 240;
      const gapAt = (t) => {
        const [a, b] = [0, 1].map((i) => explosionRaw(m, run, e, t, i));
        return Math.hypot(a.x - b.x, a.y - b.y);
      };
      let best = { t: e.spinUp, d: Infinity };
      let prev = gapAt(e.spinUp);
      let cur = gapAt(e.spinUp + step);
      for (let t = e.spinUp + step; t < e.spinUp + EXPLOSION.search; t += step) {
        const next = gapAt(t + step);
        if (cur <= prev && cur <= next) {
          if (cur < EXPLOSION.gap) { best = { t, d: cur }; break; }
          if (cur < best.d) best = { t, d: cur };
        }
        prev = cur;
        cur = next;
      }
      e.tc = best.t;
      const [a, b] = [0, 1].map((i) => explosionRaw(m, run, e, e.tc, i));
      e.hit = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: 1 };
    };

    const frameScatter = (t) => {
      const e = st.end;
      const nSeg = 5;
      const f = clamp01(t / SCATTER.dur);
      const seg = Math.min(nSeg - 1, Math.floor(f * nSeg));
      const lt = f * nSeg - seg;
      const keys = (i) => [e.scale0[i], ...SCATTER.scales];
      const pos = e.paths.map((pts) => {
        const [a, b, c, d] = pts.slice(seg, seg + 4);
        const x = cr(a.x, b.x, c.x, d.x, lt);
        const y = cr(a.y, b.y, c.y, d.y, lt);
        // Sicherung gegen Überschwingen der Kurve über den Hero-Rand
        return { x: Math.min(e.box.right, Math.max(e.box.left, x)), y: Math.min(e.box.bottom, Math.max(e.box.top, y)), z: 1 };
      });
      const sc = [0, 1].map((i) => { const k = keys(i); return k[seg] + (k[seg + 1] - k[seg]) * smooth(lt); });
      const fade = smooth(t / (SCATTER.dur / nSeg));
      const op = [0, 1].map((i) => e.op0[i] + (1 - e.op0[i]) * fade);
      paint(pos, sc, op, false);
    };

    const startFlash = () => {
      if (!st.flash) {
        st.flash = document.createElement('span');
        st.flash.className = 'neon-flash';
        st.flash.setAttribute('aria-hidden', 'true');
        st.umlaut.insertBefore(st.flash, st.umlaut.firstChild);
      }
      // Der Blitz steht in CSS am Anker der Punkte, die Variablen rücken
      // ihn an den Ort des Zusammenstoßes
      const { hit, tc } = st.end;
      st.flash.style.setProperty('--neon-flash-x', `${hit.x + st.rest.mid}em`);
      st.flash.style.setProperty('--neon-flash-y', `${hit.y}em`);
      if (typeof st.flash.animate !== 'function') return;
      // Ein einziger Blitz (WCAG 2.3.1): aufblühen bis peak, dann verglühen.
      // Vorgemaltes Glühen, animiert nur transform und opacity
      const { peak, glow } = EXPLOSION;
      const dur = glow + 0.2;
      st.flashAnim = st.flash.animate([
        { transform: 'translate(-50%, -50%) scale(0.04)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(0.2)', opacity: 1, offset: 0.06, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' },
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: peak / dur, easing: 'ease-in' },
        { transform: 'translate(-50%, -50%) scale(0.75)', opacity: 0 },
      ], { duration: dur * 1000, delay: tc * 1000 });
    };

    const frameExplosion = (t) => {
      const m = MODES[st.mode];
      const e = st.end;
      const { merge, white, glow, fade, back } = EXPLOSION;
      const run = runOf(st.mode);
      const tc = e.tc;
      if (t < tc) {
        // Immer schneller kreisen, zuletzt ziehen beide Punkte auf ihre
        // gemeinsame Mitte (die Mitte läuft weiter, kein Abbremsen)
        const raw = [0, 1].map((i) => explosionRaw(m, run, e, t, i));
        const mid = { x: (raw[0].x + raw[1].x) / 2, y: (raw[0].y + raw[1].y) / 2, z: (raw[0].z + raw[1].z) / 2 };
        const k = smooth((t - (tc - merge)) / merge);
        const pos = raw.map((p) => ({ x: p.x + (mid.x - p.x) * k, y: p.y + (mid.y - p.y) * k, z: p.z + (mid.z - p.z) * k }));
        const dz = depth(pos, 1 - k);
        paint(pos, dz[0], dz[1], k < 1);
        if (t > tc - white && !scope.classList.contains('orbit-flash')) setClass('orbit-flash', true);
        return;
      }
      const hit = e.hit;
      if (t < tc + glow) { paint([hit, hit], [1, 1], [1, 1], false); return; }
      if (t < tc + fade) {
        const o = 1 - smooth((t - tc - glow) / (fade - glow));
        paint([hit, hit], [1, 1], [o, o], false);
        return;
      }
      // Wiedereinblenden in der Ruhelage, wieder in den Farben der Ruhe
      setClass('orbit-flash', false);
      setClass('orbit-accent', false);
      const pin = smooth((t - tc - fade) / (back - fade));
      const s = 0.6 + 0.4 * pin;
      paint([st.rest.pos(0), st.rest.pos(1)], [s, s], [pin, pin], false);
    };

    const frame = (now) => {
      st.raf = 0;
      if (st.phase === 'rest' || st.pausedAt !== null) return;
      const m = MODES[st.mode];
      if (st.phase === 'orbit') {
        const tt = (now - st.t0) / 1000;
        if (st.stopPending && tt >= runOf().settle) {
          beginEnd(now);
          if (m.ende === 'explosion') startFlash();
        } else {
          const pos = [0, 1].map((i) => orbitPos(m, runOf(st.mode), st.rest, tt, i));
          const dz = depth(pos);
          paint(pos, dz[0], dz[1], true);
          st.raf = requestAnimationFrame(frame);
          return;
        }
      }
      const t = (now - st.end.t0) / 1000;
      const dur = m.ende === 'scatter' ? SCATTER.dur : st.end.tc + EXPLOSION.back;
      if (t >= dur) { reset(); return; }
      if (m.ende === 'scatter') frameScatter(t); else frameExplosion(t);
      st.raf = requestAnimationFrame(frame);
    };

    const loop = () => { if (!st.raf) st.raf = requestAnimationFrame(frame); };

    st.start = (mode) => {
      if (st.phase !== 'rest') return;
      st.rest = readRest(umlaut);
      st.mode = mode;
      st.run = makeRun(MODES[mode], st.rest);
      st.phase = 'orbit';
      st.t0 = performance.now() + startDelayS * 1000;
      setClass('orbit-running', true);
      setClass('orbit-accent', MODES[mode].accent);
      loop();
    };

    // Beenden: Im Einlauf wartet das Ende, bis der Einlauf auf der Bahn ist,
    // damit es stetig aus der Bahnbewegung hervorgeht
    st.stop = () => {
      if (st.phase !== 'orbit') return;
      st.stopPending = true;
      loop();
    };

    // Anhalten außerhalb des Viewports und bei verborgenem Tab: Uhr steht,
    // danach geht es an derselben Stelle weiter
    st.setPaused = (paused) => {
      if (paused && st.pausedAt === null) {
        st.pausedAt = performance.now();
        cancelAnimationFrame(st.raf);
        st.raf = 0;
        if (st.flashAnim) st.flashAnim.pause();
      } else if (!paused && st.pausedAt !== null) {
        const delta = performance.now() - st.pausedAt;
        st.pausedAt = null;
        st.t0 += delta;
        if (st.end) st.end.t0 += delta;
        if (st.flashAnim) st.flashAnim.play();
        if (st.phase !== 'rest') loop();
      }
    };

    return st;
  };

  // ── Seiten-Modul (STYLEGUIDE 10.2): mountet einmal beim Laden ──────────────
  function mountNeon() {
    const names = document.querySelectorAll('.neon-name');
    if (!names.length) return;
    const stages = new Map();
    const stageOf = (scope) => {
      if (!stages.has(scope)) stages.set(scope, createStage(scope));
      return stages.get(scope);
    };

    // Klicks im 350-ms-Fenster zählen: 2 = Sterne, 3 und mehr = Atom. Ein
    // laufender Modus endet nur mit seiner eigenen Klickzahl, andere Zahlen
    // und Klicks während eines Endes zählen nicht
    const clicks = new WeakMap();
    const onActivate = (event) => {
      event.preventDefault();
      const scope = event.currentTarget.closest('.neon-name');
      const st = scope && stageOf(scope);
      if (!st) return;
      const c = clicks.get(scope) || { n: 0, timer: 0 };
      c.n += 1;
      window.clearTimeout(c.timer);
      c.timer = window.setTimeout(() => {
        const want = c.n === 2 ? 'sterne' : c.n >= 3 ? 'atom' : null;
        c.n = 0;
        if (!want) return;
        if (st.phase === 'rest') st.start(want);
        else if (st.phase === 'orbit' && st.mode === want) st.stop();
      }, clickWindowMs);
      clicks.set(scope, c);
    };

    document.querySelectorAll('.neon-orbit-trigger').forEach((el) => {
      el.addEventListener('click', onActivate);
      el.addEventListener('keydown', (ev) => {
        if (ev.key !== 'Enter' && ev.key !== ' ') return;
        onActivate(ev);
      });
    });

    // Außerhalb des Viewports oder bei verborgenem Tab: Klasse neon-paused
    // (CSS hält das Flackern an) und die Bahnbewegung steht
    const inView = new Map();
    const syncPaused = (el) => {
      const paused = inView.get(el) === false || document.hidden;
      el.classList.toggle('neon-paused', paused);
      const st = stages.get(el);
      if (st) st.setPaused(paused);
    };
    if ('IntersectionObserver' in window) {
      const paintObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          inView.set(entry.target, entry.isIntersecting);
          syncPaused(entry.target);
        });
      });
      names.forEach((el) => paintObserver.observe(el));
    }
    document.addEventListener('visibilitychange', () => names.forEach(syncPaused));
  }

  mountNeon();
})();
