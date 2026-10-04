---
# Test-Fixture für Gastbeiträge (STYLEGUIDE INH-5), geht nie live:
# published: false hält ihn aus dem Deploy-Build (CI-Gate prüft das). Nur der
# Review-Build (--unpublished) enthält ihn, tests/visual/gast-autor.spec.js
# prüft dort Autorzeile, Sidebar und Metadaten. author_profile: true steht
# absichtlich da: _plugins/gast-autor.rb muss es für Gäste überstimmen.
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
