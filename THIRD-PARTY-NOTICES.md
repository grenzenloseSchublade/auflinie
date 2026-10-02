# Komponenten Dritter

Diese Datei listet alle fremden Bestandteile, die mit der Website ausgeliefert werden, mit Version, Herkunft und Lizenz. Sie behalten ihre eigenen Lizenzen, die Lizenz des eigenen Codes und der Texte steht im README-Abschnitt „Lizenz“.

Stand: Oktober 2026

Werkzeuge, die nur beim Bauen oder Prüfen laufen (Ruby-Gems aus `Gemfile.lock`, npm-Pakete aus `package-lock.json`), werden nicht ausgeliefert und stehen deshalb nicht hier.

Die Spalte „Beleg“ nennt, woher die Angabe stammt. Was nicht aus der Datei selbst oder dem offiziellen Paket belegt ist, trägt den Vermerk **ungeprüft**.

## Theme

| Komponente | Version | Ort im Repo | Lizenz | Beleg |
|---|---|---|---|---|
| [Minimal Mistakes](https://github.com/mmistakes/minimal-mistakes) | 4.28.1, per `remote_theme` auf den Commit `81f00a6` gepinnt | Layouts, Includes und SCSS des Themes, überschriebene Fassungen in `_includes/` und `_layouts/` | MIT, © 2013–2024 Michael Rose and contributors | `LICENSE` im gepinnten Commit |

Das Theme bringt selbst Fremdbestandteile mit. Lizenzangaben laut Abschnitt „License“ im README des Themes (gepinnter Commit), Versionen aus den Dateiköpfen:

| Komponente | Version | Wo sie landet | Lizenz | Beleg |
|---|---|---|---|---|
| Magnific Popup (CSS) | – | `main.css` | MIT, © 2014–2016 Dmitry Semenov | Theme-README, Dateikopf ohne Lizenz |
| Susy | – | Sass-Mixins im Theme | BSD-3-Clause, © 2017 Miriam Eric Suzanne | Theme-README, **ungeprüft**, ob Code in `main.css` landet |
| Breakpoint | – | Sass-Mixins im Theme | MIT/GPL | Theme-README, **ungeprüft**, ob Code in `main.css` landet |
| Pure Liquid Jekyll Table of Contents | – | Theme-Include `toc.html` (genutzt über `toc-wrapper.html`) | MIT, © 2017 Vladimir Jimenez | Theme-README |
| Jekyll Group-By-Array | – | Theme-Include | MIT, © 2015 Max White | Theme-README |

Diese Theme-Skripte kopiert der Build nach `_site/assets/js/`, keine Seite lädt sie:

| Komponente | Version | Datei | Lizenz | Beleg |
|---|---|---|---|---|
| Minimal-Mistakes-Bundle (enthält jQuery und die Plugins unten) | 4.28.1 | `main.min.js` | MIT, © 2013–2026 Michael Rose, © 2024–2026 iBug | Dateikopf |
| jQuery | 3.6.0 | `vendor/jquery/jquery-3.6.0.js` | MIT, © OpenJS Foundation and other contributors | Dateikopf |
| Lunr | 2.3.9 | `lunr/lunr.js`, `lunr/lunr.min.js` | MIT, © 2020 Oliver Nightingale | Dateikopf |
| Gumshoe | 5.1.1 | `plugins/gumshoe.js` | MIT, © 2019 Chris Ferdinandi | Dateikopf |
| Smooth Scroll | 16.1.2 | `plugins/smooth-scroll.js` | MIT, © 2020 Chris Ferdinandi | Dateikopf |
| GreedyNav.js (jQuery-Fassung) | – | `plugins/jquery.greedy-navigation.js` | MIT, © 2015 Luke Jackson | Dateikopf |
| Magnific Popup | 1.1.0 | `plugins/jquery.magnific-popup.js` | MIT, © 2016 Dmitry Semenov | Theme-README, Dateikopf ohne Lizenz |
| jQuery throttle / debounce | 1.1 | `plugins/jquery.ba-throttle-debounce.js` | MIT oder GPL (dual), © 2010 Ben Alman | Dateikopf |
| FitVids | 1.1 | `plugins/jquery.fitvids.js` | WTFPL, © 2013 Chris Coyier, Dave Rupert | Dateikopf |

## Eigener Code nach fremder Vorlage

| Datei | Vorlage | Lizenz | Beleg |
|---|---|---|---|
| `assets/js/greedy-navigation.js` | [GreedyNav.js](https://github.com/lukejacksonn/GreedyNav) in der jQuery-Fassung des Themes, ohne jQuery neu geschrieben | MIT, © 2015 Luke Jackson | Dateikopf der Theme-Fassung, Hinweis im eigenen Dateikopf |

## Bibliotheken in `assets/vendor/`

Die Dateien sind unverändert aus den offiziellen npm-Paketen übernommen (am 2. 10. 2026 byte-genau gegen die Pakete geprüft) und behalten ihren Lizenzkopf, soweit das Paket einen mitliefert.

| Komponente | Version | Dateien | Lizenz | Beleg |
|---|---|---|---|---|
| [MathJax](https://github.com/mathjax/MathJax) | 4.1.3 | `assets/vendor/mathjax/` | Apache 2.0 | `LICENSE` und `package.json` im npm-Paket `mathjax` 4.1.3, Dateien byte-gleich |
| [Tom Select](https://github.com/orchidjs/tom-select) | 2.4.1 | `tom-select.complete.min.js`, `tom-select.css` | Apache 2.0 | Dateikopf, `LICENSE` im npm-Paket `tom-select` 2.4.1, Dateien byte-gleich |
| [noUiSlider](https://github.com/leongersen/noUiSlider) | 15.7.1 | `nouislider.min.js`, `nouislider.min.css` | MIT, © 2019 Léon Gersen | `LICENSE.md` im npm-Paket `nouislider` 15.7.1, Dateien byte-gleich. Die Dateien selbst tragen keinen Lizenzkopf |
| [Gumshoe](https://github.com/cferdinandi/gumshoe) | 5.1.2 | `gumshoe.min.js` | MIT, © 2019 Chris Ferdinandi, Go Make Things, LLC | Dateikopf, `LICENSE.md` im npm-Paket `gumshoejs` 5.1.2, Datei byte-gleich |

## Schriften

| Schrift | Version | Dateien | Lizenz | Beleg |
|---|---|---|---|---|
| [Font Awesome Free](https://fontawesome.com/license/free), Subset | 6.5.1 | `assets/webfonts/fa-*-subset.woff2`, Klassen in `assets/_sass/base/_icons.scss` | Schriften SIL OFL 1.1, Icons CC BY 4.0, Code MIT, © 2023 Fonticons, Inc. | Version aus der Schriftdatei, Lizenz aus `LICENSE.txt` im npm-Paket `@fortawesome/fontawesome-free` 6.5.1. Die Subset-Dateien selbst nennen nur „Copyright (c) Font Awesome“ |
| NewCM für MathJax | 4.1.3 | `assets/vendor/mathjax-newcm-font/` | Paket Apache 2.0, Glyphen aus New Computer Modern unter der [GUST Font License](https://tug.org/fonts/licenses/GUST-FONT-LICENSE.txt), © 2019–2021 Antonis Tsolomitis | npm-Paket `@mathjax/mathjax-newcm-font` 4.1.3 (`package.json`, Dateien byte-gleich), GUST-Lizenz aus den Schriftdateien |
| Ubuntu Font Family, Subset „Ubuntu derivative auflinie“ | 0.869 | `assets/webfonts/ubuntu-latin-*.woff2` | [Ubuntu Font Licence 1.0](assets/webfonts/UBUNTU-FONT-LICENCE.txt), © 2011, 2022, 2023 Canonical Ltd. | Schriftdatei und Lizenzdatei. Ubuntu und Canonical sind eingetragene Marken von Canonical Ltd. Erzeugt mit `scripts/ubuntu-font-subset.py` |

## Pflege

Wer eine Komponente hinzufügt, entfernt oder ihre Version wechselt, ändert diese Datei im selben Commit (STYLEGUIDE.md, LIZ-1, LIZ-2, SEC-8d).
