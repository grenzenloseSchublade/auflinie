# Commit-Bereiche: Bestand und Zuordnung

Welche Typen und Bereiche (Scopes) erlaubt sind, steht allein in STYLEGUIDE.md unter GIT-7 und GIT-8. Der Hook `.githooks/commit-msg` liest die Listen dort (`scripts/commit-msg-check.py`). Diese Seite hält fest, welche Bereiche die Historie tatsächlich nutzt und wohin ein alter Bereich heute gehört. Der Hook zitiert die Spalte „Zuordnung“, wenn ein Commit einen alten Bereich verwendet.

Stand: 6. 10. 2026, ausgewertet mit `git log --since=2025-02-01` bis `12f9f9c`. Von 643 Commits folgen 502 dem Format `typ(bereich): Betreff` (seit April 2026), 3 sind Merges, 138 ältere Commits haben kein Format und bleiben ohne Zuordnung. Die Historie wird nicht umgeschrieben, die Zuordnung gilt für neue Commits.

## Typen

| Typ | Commits | zuletzt | Zuordnung |
|---|---|---|---|
| `fix` | 145 | 2026-10-05 | erlaubt |
| `feat` | 94 | 2026-10-05 | erlaubt |
| `refactor` | 68 | 2026-10-05 | erlaubt |
| `docs` | 52 | 2026-10-05 | erlaubt |
| `style` | 31 | 2026-10-04 | erlaubt |
| `ci` | 22 | 2026-10-05 | erlaubt |
| `test` | 21 | 2026-10-05 | erlaubt |
| `chore` | 21 | 2026-10-05 | erlaubt |
| `perf` | 18 | 2026-10-05 | erlaubt |
| `content` | 15 | 2026-10-01 | erlaubt |
| `build` | 12 | 2026-10-04 | erlaubt |
| `revert` | 1 | 2026-08-10 | erlaubt |
| `tune` | 2 | 2026-08-10 | `style`, `perf` oder `fix` |

`Merge: …` (e1dfb87) ist ein Merge-Commit und kein Typ. Der Hook lässt Merges, `Revert "…"` und `fixup!`-Commits ohne Prüfung durch.

## Bereiche

85 Commits haben keinen Bereich, das ist erlaubt (GIT-8: bei mehreren Bereichen weglassen).

| Bereich | Commits | zuletzt | Zuordnung |
|---|---|---|---|
| `cv` | 67 | 2026-10-05 | erlaubt |
| `scss` | 38 | 2026-10-05 | erlaubt |
| `styleguide` | 26 | 2026-10-05 | erlaubt |
| `nav` | 23 | 2026-10-05 | erlaubt |
| `a11y` | 21 | 2026-10-05 | erlaubt |
| `blog` | 16 | 2026-10-05 | erlaubt |
| `sw` | 15 | 2026-10-05 | erlaubt |
| `js` | 15 | 2026-10-05 | erlaubt |
| `home` | 12 | 2026-10-05 | erlaubt |
| `toc` | 10 | 2026-10-05 | erlaubt |
| `tv` | 10 | 2026-07-09 | erlaubt |
| `fractal` | 9 | 2026-10-05 | erlaubt |
| `lint` | 9 | 2026-10-05 | erlaubt |
| `hero` | 8 | 2026-10-04 | erlaubt |
| `deps` | 7 | 2026-10-02 | erlaubt |
| `scripts` | 6 | 2026-10-05 | erlaubt |
| `seo` | 5 | 2026-10-05 | erlaubt |
| `jekyll` | 5 | 2026-10-05 | erlaubt |
| `security` | 4 | 2026-10-05 | erlaubt |
| `mathjax` | 4 | 2026-10-05 | erlaubt |
| `skill-graph` | 4 | 2026-10-04 | erlaubt |
| `ci` | 4 | 2026-09-27 | erlaubt |
| `images` | 2 | 2026-10-05 | erlaubt |
| `tests` | 2 | 2026-10-05 | erlaubt |
| `dev` | 2 | 2026-10-04 | erlaubt |
| `blog-notice` | 2 | 2026-10-04 | erlaubt |
| `author-follow` | 2 | 2026-10-03 | erlaubt |
| `mandelbrot` | 2 | 2026-10-01 | erlaubt |
| `config` | 2 | 2026-10-01 | erlaubt |
| `about` | 2 | 2026-07-31 | erlaubt |
| `masthead` | 2 | 2026-07-07 | erlaubt |
| `neon` | 1 | 2026-07-07 | erlaubt |
| `theme` | 1 | 2026-10-01 | erlaubt seit 6. 10. 2026 (Theme-Anpassungen, Fehler im Theme) |
| `vendor` | 1 | 2026-10-02 | erlaubt seit 6. 10. 2026 (selbst gehostete Bibliotheken) |
| `spa-nav` | 11 | 2026-10-04 | `nav` (die SPA-Navigation ist seit 5. 10. 2026 ausgebaut) |
| `fractals` | 8 | 2026-07-06 | `fractal` |
| `css` | 6 | 2026-10-01 | `scss` |
| `spa` | 5 | 2026-10-04 | `nav` |
| `farben` | 3 | 2026-10-01 | `scss` |
| `farbe` | 1 | 2026-10-01 | `scss` |
| `schrift` | 2 | 2026-10-01 | `scss`, das Subset-Skript `scripts` |
| `head` | 2 | 2026-10-04 | `jekyll` (Head-Includes) |
| `html` | 1 | 2026-10-02 | `jekyll` (Layouts und Includes) |
| `liquid` | 1 | 2026-10-02 | `jekyll` |
| `e2e` | 1 | 2026-10-04 | `tests` |
| `stylelint` | 1 | 2026-10-04 | `lint` |
| `ruby` | 1 | 2026-10-02 | `deps` |
| `build` | 1 | 2026-08-09 | `config` (Ausschlüsse in `_config.yml`) |
| `tv-switch` | 1 | 2026-07-07 | `tv` |
| `post` | 1 | 2026-07-08 | `blog` |
| `readme` | 1 | 2026-10-05 | Bereich weglassen, der Typ `docs` sagt es schon |
| `texte` | 2 | 2026-07-31 | Typ `content`, Bereich der Seite (`home`, `cv`, …) oder weglassen |
| `content` | 1 | 2026-07-07 | Typ `content`, Bereich der Seite oder weglassen |
| `pages` | 1 | 2026-07-08 | Bereich der Seite oder weglassen |
| `ui` | 4 | 2026-07-07 | Pseudo-Bereich: die Komponente nennen (`nav`, `hero`, `toc`, …) oder weglassen |
| `design` | 4 | 2026-07-07 | Pseudo-Bereich: die Komponente nennen oder weglassen |
| `polish` | 2 | 2026-07-07 | Pseudo-Bereich: die Komponente nennen oder weglassen |
| `mobile` | 2 | 2026-07-07 | Pseudo-Bereich: die Komponente nennen oder weglassen |
| `experiment` | 2 | 2026-07-07 | Pseudo-Bereich: die Komponente nennen (`tv`) oder weglassen |

Mehrere Bereiche in einem Commit (14 Commits): `toc/cv` (2), `cv/toc` (2), `cv/about` (2), `nav/blog`, `nav/buttons`, `scss/js`, `hero/nav`, `hero/nav/content`, `masthead/panels`, `masthead/blog/cv` und `tv-switch/hero/home`. Zuordnung: Bereich weglassen oder Commit teilen (GIT-8).

## Nachprüfen

```bash
python3 scripts/commit-msg-check.py --log 50
```

prüft die letzten 50 Commits mit denselben Regeln wie der Hook und zählt gültige und ungültige.
