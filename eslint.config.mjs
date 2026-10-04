// ESLint Flat Config — JavaScript-Linting für die Site-Skripte.
// Aufruf: `npm run lint:js` (auch im CI-Lint-Job).
//
// Grundsatz: Fehlerklassen fangen (undefinierte Namen, toter Code, unbenutzte
// Variablen, innerHTML mit Daten), keine Stilregeln. Formatierung bleibt
// bewusst außen vor. Ausnahme ist var/let/const (STYLEGUIDE JS-2): no-var und
// prefer-const gelten für die Site-Skripte, weil Block-Scope und const
// Fehlerklassen fangen (Hoisting, versehentliche Neuzuweisung).
import js from '@eslint/js';
import globals from 'globals';
import noUnsanitized from 'eslint-plugin-no-unsanitized';

// Globale Namen, die Site-Skripte ohne `window.`-Präfix lesen. Die Site lädt
// klassische Skripte (kein Bundler, keine Module), die Kopplung läuft über
// window/self. Eigene Helfer wie spaModule, SkillGraphData, SkillGraphSim und
// GreedyNav werden durchgängig als window.X bzw. global.X angesprochen und
// brauchen deshalb keinen Eintrag. readonly: Lesen erlaubt, Überschreiben
// fällt auf.
const projectGlobals = {
  // fractal-renderer.js → fractal-panel.js
  FractalRenderer: 'readonly',
  FractalPalettes: 'readonly',
  FractalUtils: 'readonly',
  // Vendor-Bibliotheken (assets/vendor, self-hosted)
  MathJax: 'readonly',
  noUiSlider: 'readonly',
  TomSelect: 'readonly',
  Gumshoe: 'readonly',
};

// Worker-Dateien teilen sich über importScripts() einen Scope, Top-Level-
// Funktionen sind dort globale Namen. Ladereihenfolge in beiden Workern:
// fractal-color-utils.js → fractal-worker-core.js → Worker-Datei.
const WORKER_FILES = [
  'assets/js/*-worker.js',
  'assets/js/fractal-worker-core.js',
  'assets/js/fractal-color-utils.js',
];

// service-worker.js ist eine Jekyll-Vorlage (Front Matter `---`/`---`,
// Liquid in CACHE_VERSION und der CACHE_URLS-Liste) und als Quelltext kein
// gültiges JavaScript. Statt Ruby/Jekyll in den Lint-Job zu ziehen, macht
// dieser Prozessor vor dem Linten gültiges JS daraus: Front-Matter-Striche
// werden Kommentare, jedes {{ … }} wird 0, jedes {% … %} verschwindet.
// Zeilenumbrüche bleiben erhalten, die Zeilennummern der Meldungen stimmen.
// Ausdrücke wie '.{{ p.url }}', werden so zu '.0', (gültig, Inhalt egal).
const liquidTemplate = {
  meta: { name: 'liquid-template' },
  preprocess(text) {
    const keepLines = (m) => m.replace(/[^\n]/g, '');
    return [text
      .replace(/^---\s*$/gm, '//')
      .replace(/\{\{[\s\S]*?\}\}/g, (m) => `0${keepLines(m)}`)
      .replace(/\{%[\s\S]*?%\}/g, keepLines)];
  },
  postprocess(messages) {
    return messages.flat();
  },
  supportsAutofix: false,
};

export default [
  {
    ignores: [
      'assets/vendor/**',
      '_site/**',
      '_site_review/**',
      'node_modules/**',
      'vendor/**',
      'tmp/**',
    ],
  },
  js.configs.recommended,
  {
    plugins: { 'no-unsanitized': noUnsanitized },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      // Security: kein innerHTML/insertAdjacentHTML/document.write mit Daten.
      // Feste Strings werden gezielt per eslint-disable-next-line freigegeben.
      'no-unsanitized/method': 'error',
      'no-unsanitized/property': 'error',
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
      // Leere catch-Blöcke sind hier Absicht (Feature-Probes wie
      // sessionStorage im Private Mode, history.replaceState, el.focus).
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Typografische Leerzeichen (etwa das schmale geschützte in „z. B.")
      // in Kommentaren sind gewollt und für den Code folgenlos.
      'no-irregular-whitespace': ['error', { skipComments: true }],
    },
  },
  {
    // Site-Skripte: klassische <script>-Dateien mit IIFE, keine ES-Module.
    files: ['assets/js/**/*.js'],
    ignores: WORKER_FILES,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.browser, ...projectGlobals },
    },
  },
  {
    // ES2020-Baseline (STYLEGUIDE JS-2): const/let statt var, const wo nie
    // neu zugewiesen wird. Gilt für alle Site- und Worker-Skripte.
    files: ['assets/js/**/*.js'],
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  {
    // Worker-Scope: kein window/document. Die definierenden Dateien markieren
    // ihre Funktionen per /* exported */, die nutzenden bekommen sie hier.
    files: WORKER_FILES,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.worker },
    },
  },
  {
    files: ['assets/js/fractal-worker-core.js'],
    languageOptions: { globals: { precomputeColors: 'readonly' } },
  },
  {
    files: ['assets/js/*-worker.js'],
    languageOptions: { globals: { runFractalChunkJob: 'readonly' } },
  },
  {
    // Service Worker: Jekyll-Vorlage, über den Prozessor oben gelintet.
    // Eigener Worker-Scope (self, caches, clients), dieselbe ES2020-Baseline
    // wie die Site-Skripte (JS-2).
    files: ['service-worker.js'],
    processor: liquidTemplate,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.serviceworker },
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  {
    // Werkzeuge in scripts/ (Node, CommonJS), heute style-snapshot.js
    files: ['scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.browser },
    },
  },
  {
    // Playwright-Tests: Node/CommonJS (require). Die Callbacks von
    // page.evaluate/waitForFunction laufen im Browser, daher auch dessen
    // Globals.
    files: ['tests/**/*.js', 'playwright.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.browser },
    },
  },
];
