---
# Test-Fixture für Gastbeiträge (STYLEGUIDE INH-5), geht nie live:
# published: false hält ihn aus dem Deploy-Build (CI-Gate prüft das). Nur der
# Review-Build (--unpublished) enthält ihn, tests/visual/gast-autor.spec.js
# prüft dort Autorzeile, Sidebar und Metadaten. author_profile: true steht
# absichtlich da: _plugins/gast-autor.rb muss es für Gäste überstimmen.
# Der zweite Absatz und der Codeblock sind die Fixture für den geschützten
# Schrägstrich (_plugins/schraegstrich.rb, tests/visual/typografie.spec.js):
# im Text geschützt, im Code und im title-Attribut wie getippt.
published: false
title: "Test-Gastbeitrag"
excerpt: "Fixture für die Autoranzeige von Gastbeiträgen, nur im Review-Build."
date: 2025-01-01
author: "Erika Mustermann"
author_profile: true
header:
  overlay_image: /assets/images/background.jpg
  overlay_filter: 0.5
  teaser: /assets/images/background.jpg
categories:
  - Blog
tags:
  - Test
---

Dieser Beitrag prüft, wie ein Gastbeitrag erscheint: Name in der Meta-Zeile, kein Autorprofil in der Sidebar, Gast als Autor in den Metadaten.

Vor dem Schrägstrich setzt der Build ein geschütztes Leerzeichen, etwa bei Pipelines für CI / CD, bei **C** / C++ und an einem [Link]({{ '/posts/' | relative_url }} "Ruby / HTML") / Text. Code bleibt, wie getippt: `Gemfile / Gemfile.lock`.

Auch über das Zeilenende hinweg wie bei Build /
Deploy, mit doppelten Leerzeichen wie bei Test  /  Lint und hinter einem selbstschließenden Symbol {::nomarkdown}<svg class="test-symbol" aria-hidden="true" viewBox="0 0 1 1"/>{:/} wie bei Lesen / Schreiben.

```text
assets / js / main.js
```
