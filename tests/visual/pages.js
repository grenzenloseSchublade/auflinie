// Seitenliste für axe (a11y.spec.js) und die Tab-Runde (invariants.spec.js):
// feste Seiten plus jeder Beitrag, den der Review-Build enthält. Ein neuer
// Beitrag ist damit ohne Teständerung dabei. Gegen eine fremde BASE_URL ohne
// lokales Build-Verzeichnis bleiben die festen Seiten.
const fs = require('fs');
const path = require('path');

const SITE_DIR = path.resolve(__dirname, '..', '..', process.env.SITE_DIR || '_site_review');
const STATIC = ['', 'about/', 'cv/', 'posts/', 'archiv/', 'mandelbrot/', 'styleguide/', '404.html', 'offline.html'];

function postPages() {
  const dir = path.join(SITE_DIR, 'posts');
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      // page2/ usw. sind Blätterseiten der Blogliste, keine Beiträge
      .filter((d) => d.isDirectory() && !/^page\d+$/.test(d.name)
        && fs.existsSync(path.join(dir, d.name, 'index.html')))
      .map((d) => `posts/${d.name}/`)
      .sort();
  } catch {
    return [];
  }
}

const POSTS = postPages();

module.exports = { PAGES: [...STATIC, ...POSTS], POSTS };
