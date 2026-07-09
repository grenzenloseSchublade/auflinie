# TV-Umschalt-Effekt: Varianten, Dosierung, Technik

Der Seitenwechsel nutzt Cross-Document View Transitions (mobil, Chrome):
Der Header steht als eigener Snapshot fest, ein offener Nav-Drawer slidet
innerhalb der Transition raus, und der Inhalt wechselt im Stil eines
Röhrenfernsehers. Dieses Dokument hält die drei Effekt-Varianten samt
Recherche-Grundlagen fest und erklärt Umschaltung und Dosierung.

## Varianten umschalten

In `assets/_sass/components/_view-transition.scss` ganz oben:

```scss
$crt-variante: "antenne" !default; // "dezent" | "linie-punkt" | "voll" | "antenne"
```

Wert ändern, neu bauen — es wird nur die gewählte Variante kompiliert.

## Die vier Varianten

### 1. `dezent` — geglättetes Original (~1930 ms)

Struktur des ursprünglichen Effekts (vertikaler Kollaps + flächiger
Phosphor-Blink), aber physikalisch plausibel gemacht: `easeOutQuint` statt
`steps(4)` (der reale Kollaps ist eine kontinuierliche Spulen-Entladung —
Stufen lesen sich als Digital-Glitch), kontinuierlicher Helligkeitsanstieg,
leichter horizontaler Overshoot, Einschalten als Warm-up (siehe
`$glitch-variante: "aus"`).

```
0         190ms        330ms                             1930ms
|----------|------------|------------------------|
 V-Kollaps  Grün-Blink   Warm-up (gedimmt -> hell)
```

### 2. `linie-punkt` — Standard, empfohlen (~1980 ms)

Das physikalische Phasenmodell echter Röhren: Die Vertikalablenkung stirbt
zuerst (Bild kollabiert zur extrem hellen Linie — real ~480-fache
Zeilenhelligkeit), dann bricht die Horizontale zusammen (Linie zieht sich
zum Leuchtpunkt in der Bildmitte), der Punkt glimmt nach und verlischt.
Der geschrumpfte, überhelle Old-Snapshot selbst ist der Leuchtpunkt; der
Phosphor-Schimmer kommt als radialer Puls in Bildmitte (animierte
`background-size` — keine Fläche blitzt mehr). Die neue Seite klappt auf,
während der Punkt noch glimmt, und wärmt dann langsam hoch.

```
0      120    190   260ms        380ms                           1980ms
|-------|------|-----|------------|----------------------|
 Bild    V-Kol  Linie Linie→Punkt  Punkt glimmt · Warm-up
         laps   steht (brightness  (Bild klappt gedimmt auf
                      12)          und wird träge hell)
```

### 3. `voll` — maximaler Realismus (~780 ms)

Der sichtbare Unterschied zu `linie-punkt` ist der **Punkt-Solo-Moment**:
Die neue Seite blüht erst bei 520 ms auf — dazwischen (260–520 ms) glimmt
der Leuchtpunkt **allein auf schwarzem Grund** (größerer Punkt, hellerer
und länger stehender Phosphor-Schein). Das Einschalten hat ein spürbares
Sync-Fang-Zittern (±2.5 % über 260 ms) und einen stärkeren Bloom
(1.7 → 1.4 → 1, saturate 1.35).

```
0      260ms         520ms              780ms
|-------|-------------|------------------|
 Kollaps  PUNKT SOLO    Aufbau mit Bloom
 zu Linie (glimmt allein + Sync-Zittern
 & Punkt  auf Schwarz)
```

### 4. `antenne` — Antennen-Störung (~1200 ms)

Analoge Empfangsstörung statt Röhren-Kollaps: Jede Bildzeile wandert
horizontal um einen weich variierenden Betrag (Wellenlinie — das Bild
„schwimmt" wie bei verstimmter Antenne), dazu schwillt Schnee an, bis
nichts mehr erkennbar ist. **Der Seitenwechsel ist ein harter Cut mitten
im Peak** — der New-Snapshot liegt opak über dem Old-Snapshot und startet
mit derselben Maximal-Störung (nur anderer Rausch-Seed), der Cut liest
sich als weiterer Rausch-Frame. Danach rastet die neue Seite in
abklingenden Stufen ein. `$glitch-variante` ist hier ohne Wirkung — das
Abklingen ist der Einlauf.

```
0        84   182   294  350ms                 800   900  1000  1100  1200ms
|--------|-----|-----|----|=====================|-----|-----|-----|-----|
alt:  none → S1 → S2 → S3 → S4/S4b (Peak, +Schnee, abgedunkelt)
neu:                        450ms: Cut im Peak (unsichtbar) → Flackern
                            → S3 → S2 → S1 → Einrasten + Mini-Bloom
```

Technik: SVG-Filterstufen `#vtAntenne1..4b` (`_includes/vt-antenne-defs.html`,
global in `_layouts/default.html` direkt nach `<body>` — Cross-Doc-VT
rendert beide Snapshots im NEUEN Dokument, die Defs müssen daher auf jeder
Zielseite und wegen des frühen `pagereveal` am Body-Anfang stehen).
Zeilenwelle: `feTurbulence` **fractalNoise** (nur der ist um 0.5 zentriert —
`turbulence` wäre Richtung 0 verzerrt → konstanter Drift statt Pendeln),
`baseFrequency="0.002 0.1"`, dann `feColorMatrix` (R = Welle, G = konstant
0.5, A = 1) und `feDisplacementMap xChannelSelector="R"
yChannelSelector="G"` → Verschiebung exakt horizontal. Schnee = zweites,
hochfrequentes fractalNoise per `feComposite over` (nur Stufen 3/4/4b).
Alle Stufen sind **statisch**; die Keyframes springen per `step-end`
zwischen den `url(#…)`-Referenzen (kein animiertes feTurbulence — CPU-
Doktrin), der Seed-Wechsel 4/4b wirkt als Flackern. Kein `clip-path` auf
diesen Pseudos (würde das Filter-Ergebnis clippen).

## Glitch-Einlauf (`$glitch-variante`)

Optionaler zweiter Schalter direkt unter `$crt-variante`:

```scss
$glitch-variante: "aus" !default; // "aus" | "dezent" | "deutlich" | "schwimmen"
```

Wählt die Einschalt-Animation auf `::view-transition-new(root)`. Wirkt in
den Varianten dezent/linie-punkt/voll; bei `antenne` ohne Wirkung.

- **`aus`** — **Röhren-Warm-up** (`crt-on-warmup`, 1600 ms): Das Bild
  klappt auf und zeigt die drei belegten Aufwärm-Symptome echter Röhren
  (Repair-FAQ): **kalte Kathode** (Start bei brightness 0.22, saturate
  0.5 — dunkel und blass), **Fokus-Drift** (blur 2.8px → 0, das Bild
  kontinuierlich-monoton scharf) und **Geometrie-Setzung** (scale 0.985 → 1, bis die
  Hochspannung steht), dazu zwei kleine Helligkeits-Wobbles. Bei `voll`
  stattdessen `crt-on-voll` (Sync-Zittern + starker Bloom).
- **`dezent`** — Slice-Glitch: 2 Stöße (2.2 % → −1.6 % → 0.8 %), 480 ms
  gesamt, Tear-Fenster ~120–346 ms nach Animationsstart.
- **`deutlich`** — Slice-Glitch: 3 Stoß-Pakete (bis 3.6 %), 760 ms gesamt,
  zusätzlich `hue-rotate`-Stöße als Chroma-Sync-Fehler.
- **`schwimmen`** — Antennen-Störung als Einlauf (Kanal-Umschalt-Look):
  die neue Seite blüht voll gestört auf (Zeilenwellen + Schnee, nutzt die
  `#vtAntenneN`-Filterstufen der Variante 4) und fängt sich in 6 Stufen,
  750 ms gesamt. Dramaturgie: Röhre kollabiert (linie-punkt), der „neue
  Sender" rastet erst wellig-verrauscht ein.

Jeder Tear-Frame hält 45–60 ms (3–4 Bildschirm-Frames). Die erste Fassung
mit ~30 ms-Frames lag unter der Wahrnehmungsschwelle — der Effekt las sich
als kurzes Flackern statt als Streifen-Springen.

```
dezent    0     106ms      230ms     298 346ms      480ms
          |------|--●--●----|---------●---|----------|
           Öffnung Stoß 1a/b  Ruhe    Stoß 2  Ausklang

deutlich  0    91ms        289ms     380  479ms 562 608ms  760ms
          |-----|--●--●--●--|---------●--●-|------●--|------|
           Öffnung Stoß 1a-c  Ruhe    Stoß 2a/b  Stoß 3 Ausklang
```

Technik-Entscheidungen:

- **Ein-Layer-Tearing** auf dem Root-New-Snapshot statt eines zweiten
  `view-transition-name`-Kopie-Layers: Element-Snapshots erfassen die
  gesamte Ink-Overflow-Höhe (riesige GPU-Textur auf langen Posts, ausge-
  rechnet mobil) und wären bei jeder Transition aktiv. Dass alle Streifen
  eines Frames dieselbe Verschiebung teilen, ist der authentische VHS-Look —
  der „gegeneinander"-Eindruck entsteht temporal durch frame-weises
  Alternieren der Richtung.
- **Verschmolzene Keyframes** statt zweiter Animation: die Einschalt-Basis
  (`crt-on-warmup`)
  animiert bereits `transform`/`filter` — bei zwei Animationen gewinnt pro
  Property die letzte, der scaleY-Aufbau ginge verloren.
- **Risse** per `clip-path`-Schlangen-Polygon (mehrere Bänder in einem
  Pfad); freigelegt wird der dunkle `::view-transition`-Grund (`#10141a`) —
  schwarze Tearing-Linien, kein Aufblitzen. `step-end` hält jeden Frame und
  springt hart; `clip-path` steht in jedem Frame explizit, sonst schaltete
  die diskrete Interpolation schon ab dem impliziten 0%-Frame um.
- **Chroma statt RGB-Split:** `drop-shadow`-Tricks greifen auf opaken
  Snapshots nicht (und `clip-path` clippt das Filter-Ergebnis weg);
  `hue-rotate(±4–8deg)`-Stöße sind kompositierbar und lesen sich als
  Chroma-Sync-Fehler. Optionaler Ausbau: schwache Cyan/Magenta-Linien im
  `::view-transition`-Hintergrund, die durch die Risse durchscheinen.
- Bei `$crt-variante: "voll"` ersetzt der Glitch auch `crt-on-voll`, dessen
  Sync-Fang-Zittern sich sonst mit dem Tearing doppeln würde.

Timing-Verzahnung (`linie-punkt`): Öffnung startet wie bisher bei 380 ms
und blüht ins Punkt-Nachglimmen (endet 460 ms) hinein; der erste Tear liegt
bei ~505 ms — der Phosphor-Puls ist dann fertig, nichts flackert durch die
Risse. Gesamtdauer der Transition: 860 ms (`dezent`) / 1140 ms (`deutlich`)
statt 560 ms. Der Drawer-Offset wirkt unverändert (die Offset-Regeln
überschreiben nur `animation-delay`).

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
- Warm-up-Symptome: TV Repair FAQ — „Focus drift with warmup" (Fokus
  zieht erst mit der Erwärmung scharf) und Blooming/Emission (kalte
  Kathode liefert zu wenige Elektronen → Bild dunkel und blass)
- Android „ElectronBeam"-Ausschalt-Animation (AOSP 4.x,
  DisplayPowerController/ElectronBeam.java): 400 ms Off als Sigmoid,
  250 ms On
- lbebber „CSS CRT screen effect" (CodePen-Klassiker): easeOutQuint-Kollaps,
  brightness 10-50, Turn-on mit Bloom
- Phosphor-Persistenz: RP-Photonics, ResearchGate (~1-10 ms — das lange
  Nachglimmen des Punkts kommt aus Kathoden-Restemission, nicht Phosphor)
- Timing/Choreografie: NN/g Response Times & Powers of 10, Material Motion
  (Choreography, Duration & Easing)
