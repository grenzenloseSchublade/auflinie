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

export default [
  {
    // service-worker.js ist eine Jekyll-Vorlage (Front Matter `---`/`---`,
    // Liquid in CACHE_VERSION und der CACHE_URLS-Liste) und als Quelltext
    // kein gültiges JavaScript. Das gebaute _site/service-worker.js zu prüfen
    // hieße, Ruby/Jekyll in den Lint-Job zu ziehen, der heute nur Node
    // braucht. Der Worker bleibt deshalb draußen; Syntaxfehler zeigen sich
    // spätestens im Build-Job bzw. bei der Registrierung im Browser.
    ignores: [
      'assets/vendor/**',
      '_site/**',
      'node_modules/**',
      'vendor/**',
      'tmp/**',
      'service-worker.js',
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
