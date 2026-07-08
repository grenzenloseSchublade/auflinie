# TV-Umschalt-Effekt: Varianten, Dosierung, Technik

Der Seitenwechsel nutzt Cross-Document View Transitions (mobil, Chrome):
Der Header steht als eigener Snapshot fest, ein offener Nav-Drawer slidet
innerhalb der Transition raus, und der Inhalt wechselt im Stil eines
Röhrenfernsehers. Dieses Dokument hält die drei Effekt-Varianten samt
Recherche-Grundlagen fest und erklärt Umschaltung und Dosierung.

## Varianten umschalten

In `assets/_sass/components/_view-transition.scss` ganz oben:

```scss
$crt-variante: "linie-punkt" !default; // "dezent" | "linie-punkt" | "voll"
```

Wert ändern, neu bauen — es wird nur die gewählte Variante kompiliert.

## Die drei Varianten

### 1. `dezent` — geglättetes Original (~530 ms)

Struktur des ursprünglichen Effekts (vertikaler Kollaps + flächiger
Phosphor-Blink), aber physikalisch plausibel gemacht: `easeOutQuint` statt
`steps(4)` (der reale Kollaps ist eine kontinuierliche Spulen-Entladung —
Stufen lesen sich als Digital-Glitch), kontinuierlicher Helligkeitsanstieg,
leichter horizontaler Overshoot, Einschalten mit Bloom (überstrahlt kurz
auf 1.25 und beruhigt sich).

```
0         190ms        330ms         530ms
|----------|------------|-------------|
 V-Kollaps  Grün-Blink   Aufbau mit Bloom
```

### 2. `linie-punkt` — Standard, empfohlen (~560 ms)

Das physikalische Phasenmodell echter Röhren: Die Vertikalablenkung stirbt
zuerst (Bild kollabiert zur extrem hellen Linie — real ~480-fache
Zeilenhelligkeit), dann bricht die Horizontale zusammen (Linie zieht sich
zum Leuchtpunkt in der Bildmitte), der Punkt glimmt nach und verlischt.
Der geschrumpfte, überhelle Old-Snapshot selbst ist der Leuchtpunkt; der
Phosphor-Schimmer kommt als radialer Puls in Bildmitte (animierte
`background-size` — keine Fläche blitzt mehr). Die neue Seite blüht auf,
während der Punkt noch glimmt.

```
0      120    190   260ms        380ms       560ms
|-------|------|-----|------------|-----------|
 Bild    V-Kol  Linie Linie→Punkt  Punkt       Aufbau mit
         laps   steht (brightness  glimmt      Bloom (startet
                      12)          radial nach im Glimmen)
```

### 3. `voll` — maximaler Realismus (~700 ms sichtbar)

Wie `linie-punkt`, plus: Der Punkt glimmt 450 ms lang **unter der bereits
aufblühenden neuen Seite** weiter (der Transition-Backdrop liegt hinter dem
New-Snapshot — wie ein Fernseher, der aus dem noch glimmenden Punkt
startet), das Einschalten hat ein kurzes Sync-Fang-Zittern (±1.5 %) und
einen stärkeren Bloom (1.6 → 1.35 → 1, saturate 1.3).

## Choreografie mit dem Drawer

Ist der Drawer beim Wechsel offen, slidet sein Old-Snapshot zuerst raus
(200 ms, accelerate), dann folgt nach einem **70 ms-Beat** der gewählte
Effekt (`$crt-drawer-offset: 270ms`). Begründung: Über ~40 ms wird die
Pause als eigenes Ereignis wahrnehmbar (Staging), unter 100 ms verschmilzt
die Kette zu einer Geste (NN/g-Reaktionszeit-Schwellen) — 70 ms ≈ 4 Frames.

## Dosierung (tv-switch.js)

Der volle Effekt läuft NICHT bei jedem Klick — er markiert Ortswechsel:

1. **Scroll-Top:** nur wenn die alte Seite ganz oben stand (`scrollY <= 4`).
2. **Bereichswechsel:** nur wenn sich das erste Pfad-Segment ändert
   (home / about / mandelbrot / cv / archiv / posts …) — Post → Post oder
   Pagination bleiben ruhig.
3. **Cooldown:** höchstens einmal pro 8 s (sessionStorage-Zeitstempel).

In allen anderen Fällen: ruhiger UA-Crossfade — der Header steht immer,
ein offener Drawer slidet trotzdem raus.

## Technik-Kurzreferenz

- Types propagieren nicht zwischen Dokumenten → `pageswap` schreibt die
  Entscheidung nach `sessionStorage`, ein parser-blockierendes
  Inline-Script in `_includes/head/custom.html` liest sie im `pagereveal`
  (nie auf defer/async umstellen!). Guards: Pfad-Match + 10 s-TTL.
- Aktiv nur `(max-width: 768px) and (prefers-reduced-motion: no-preference)`;
  ohne Browser-Support (Firefox) normale Navigation.
- Offline identisch (Service-Worker-Voll-Precache).

## Recherche-Quellen (Auswahl)

- CRT-Physik: Sam Goldwasser, TV Repair FAQ — „Bright Spot at Power-Off"
  (repairfaq.org); Patent US4390817 (Spot-Cut-off-Network)
- Android „ElectronBeam"-Ausschalt-Animation (AOSP 4.x,
  DisplayPowerController/ElectronBeam.java): 400 ms Off als Sigmoid,
  250 ms On
- lbebber „CSS CRT screen effect" (CodePen-Klassiker): easeOutQuint-Kollaps,
  brightness 10-50, Turn-on mit Bloom
- Phosphor-Persistenz: RP-Photonics, ResearchGate (~1-10 ms — das lange
  Nachglimmen des Punkts kommt aus Kathoden-Restemission, nicht Phosphor)
- Timing/Choreografie: NN/g Response Times & Powers of 10, Material Motion
  (Choreography, Duration & Easing)
