# Design-Referenzen

Dieser Ordner enthält **Design-Quellen und Logo-/Favicon-Varianten**, die als Referenz für
spätere Arbeiten aufbewahrt werden.

**Wichtig:** Diese Dateien werden **absichtlich nicht deployt**. Der Ordner ist in `_config.yml`
unter `exclude:` eingetragen, damit Jekyll ihn nicht nach `_site` kopiert. So bleiben die Bilder
versioniert im Repo, belasten aber weder das Deploy-Artefakt noch die Ladezeit der Live-Site.

Diese Bilder waren zuvor unter `assets/images/` abgelegt, wurden dort aber von keiner Seite
referenziert (totes Deploy-Gewicht, ~46 MB).

## Inhalt
- `logo-varianten/` — frühe Logo-Entwürfe (Sokrates-Linienkunst, diverse Varianten)
- `Logo-sokrates.png` — Logo-Master (hochauflösend)
- `favicon-sokrates.png` — Favicon-/Icon-Master (2048×2048), Quelle für die ausgelieferten Favicons
- `WebSite_Logo_1.png`, `WebSite_Logo_2.png` — ältere Website-Logo-Varianten

## Hinweis
Bei Bedarf an einem schlankeren Repo wäre **Git LFS** für diesen Ordner die saubere Option.
