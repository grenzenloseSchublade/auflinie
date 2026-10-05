// Blog-Hinweis als „schon geschlossen“ behandeln. Ist blog_notice in
// _pages/posts.md eingeschaltet, öffnet /posts/ einen modalen Dialog
// (blog-notice.js), der Tests ohne Bezug zum Hinweis blockiert: Tastatur,
// Klicks und Fokus landen im Dialog. Wirkt wie ein Besuch, der den Hinweis
// schon geschlossen hat, für jede Hinweis-id. So bleibt das Einschalten ein
// reiner Inhalts-Schritt (STYLEGUIDE ARCH-5). Den Hinweis selbst prüft
// invariants.spec.js („Blog-Hinweis im Top Layer“) ohne diesen Helfer.
async function ohneBlogHinweis(page) {
  await page.addInitScript(() => {
    const get = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key) {
      return String(key).startsWith('auflinie:blog-notice-dismissed:') ? '1' : get.call(this, key);
    };
  });
}

module.exports = { ohneBlogHinweis };
