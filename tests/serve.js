// Minimaler statischer Server für die Playwright-Tests: liefert ein gebautes
// Jekyll-Verzeichnis unter der baseurl /auflinie aus (wie GitHub Pages).
// Nutzung: node tests/serve.js <site-verzeichnis> [port]
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || '_site_review');
const port = Number(process.argv[3] || 4000);
const BASE = '/auflinie';
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json',
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith(BASE)) { res.writeHead(404); return res.end(); }
  let rel = decodeURIComponent(url.pathname.slice(BASE.length)) || '/';
  let file = path.join(root, rel);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!rel.endsWith('/')) { res.writeHead(301, { Location: url.pathname + '/' }); return res.end(); }
    file = path.join(file, 'index.html');
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/html' }); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, '127.0.0.1', () => console.log(`serving ${root} at http://127.0.0.1:${port}${BASE}/`));
