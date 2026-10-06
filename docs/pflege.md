# Inhalte pflegen

Diese Anleitung ist für die Pflege der Website gedacht, auch nach längerer Pause und ohne Technikwissen im Kopf. Jeder Fall braucht höchstens fünf Schritte (STYLEGUIDE ARCH-5). Texte stehen in Markdown (`.md`) oder in YAML-Dateien unter `_data/`, das Aussehen regeln Vorlagen, die dafür nicht angefasst werden müssen.

Ein Fehler kann nichts kaputt machen, was schon online ist: Die Website wird nach jedem Push neu gebaut und geprüft. Ist eine Prüfung rot, bleibt die bisherige Fassung online, bis der Fehler behoben ist.

| Was ändern? | Wo? | Abschnitt |
|---|---|---|
| Blogbeitrag | `_posts/` | [Blogbeitrag schreiben](#blogbeitrag-schreiben) |
| Gastbeitrag | `_posts/` | [Gastbeitrag einspielen](#gastbeitrag-einspielen) |
| Lebenslauf, Skills | `_data/cv_content.yml`, `_data/skill_graph.yml` | [Lebenslauf](#lebenslauf) |
| Startseite | `_data/home.yml` | [Startseite](#startseite) |
| Über mich | `_pages/about.md` | [Über mich](#über-mich) |
| Fraktal-Texte | `_data/mandelbrot.yml` | [Mandelbrot-Texte](#mandelbrot-texte) |
| Knöpfe und Hinweise der Fraktal-Panels | `_data/fractal_panel.yml` | [Fraktal-Bedienung](#fraktal-bedienung) |
| Menü, neue Seite | `_data/navigation.yml`, `_pages/` | [Navigation](#navigation) |
| Kontakt, Social-Links | `_config.yml` → `author.links` | [Kontakt und Social-Links](#kontakt-und-social-links) |
| Footer | `_data/navigation.yml` → `footer` | [Footer](#footer) |
| Bild tauschen | `assets/images/` | [Bild tauschen](#bild-tauschen) |
| Seitentitel, Kurzbeschreibung | Kopf der jeweiligen Datei | [Seitentitel und Excerpt](#seitentitel-und-excerpt) |
| Hinweis über dem Blog | `_pages/posts.md` → `blog_notice` | [Blog-Hinweis](#blog-hinweis) |
| Wartung | – | [Wartung (selten)](#wartung-selten) |

Am Ende steht, wie sich eine Änderung [vor dem Push prüfen](#prüfen-vor-dem-push) lässt und wie die Meldungen der CI zu lesen sind.

## Blogbeitrag schreiben

1. **Vorlage kopieren.** Den Teil zwischen `{% raw %}` und `{% endraw %}` aus `assets/downloads/post-template.txt` als neue Datei speichern (oder die Vorlage über den Beitrag „Blogbeitrag erstellen“ herunterladen). Dateiname: `_posts/JJJJ-MM-TT-kurzer-titel.md`, zum Beispiel `_posts/2026-11-02-wetterstation.md`. Das Datum im Namen ist das Veröffentlichungsdatum, der Rest wird die Adresse (`/posts/wetterstation/`).
2. **Kopf ausfüllen.** `title`, `excerpt` (ein bis zwei Sätze, 70 bis 160 Zeichen, erscheint in der Übersicht und bei Suchmaschinen), `header.caption` (eine Zusatzinformation, keine Wiederholung des Titels) und `tags`. Enthält der Beitrag Formeln, kommt `mathjax: true` dazu.
3. **Text schreiben.** Der erste Absatz ist die Einleitung und hat keine Überschrift, danach gliedern `##` und `###`. Notizen nur als Liquid-Kommentar:

   ```liquid
   {% comment %} Absatz noch kürzen {% endcomment %}
   ```

   Formeln: `$$E = mc^2$$` mitten im Satz steht im Text, `$$…$$` als eigener Absatz steht abgesetzt. Links ganz normal mit `https://` schreiben, externe Links öffnen beim Bauen von selbst in einem neuen Tab.
4. **Bilder ablegen.** Die Datei nach `assets/images/posts/` (Name klein, ohne Umlaute und Leerzeichen, zum Beispiel `wetterstation-aufbau.jpg`), im Text so einbinden:

   ```markdown
   ![Was das Bild zeigt]({{ "/assets/images/posts/wetterstation-aufbau.jpg" | relative_url }}){: width="1200" height="800"}
   ```

   Breite und Höhe sind die echten Pixelmaße der Datei. Fotos als JPEG, höchstens 1920 px breit. Beitragsbilder kommen von selbst in den Offline-Speicher der Seite.
5. **Prüfen und pushen** (siehe [Prüfen vor dem Push](#prüfen-vor-dem-push)).

Typische Fallen:

- **Pfad ohne `relative_url`** (`![Bild](/assets/…)`): Lokal sieht alles gut aus, auf der Website fehlt `/auflinie` davor. Der Inhalts-Check meldet das als Fehler.
- **HTML-Kommentar** `<!-- … -->`: unsichtbar auf der Seite, aber öffentlich im Quelltext. Der Inhalts-Check macht den Lauf rot.
- **Fehlendes Bild oder fehlender Alt-Text**: html-proofer macht den Lauf rot. Fehlende Maße geben nur eine Warnung.
- **`http://`**: Ein Bild über `http://` ist ein Fehler, ein Link über `http://` nur eine Warnung. Besser immer `https://`.
- **Eingebettete Inhalte** (YouTube-`<iframe>`, `<script>`, `onclick=`, Bilder von fremden Seiten): Die Sicherheitsregeln der Seite (CSP) lassen nur eigene Dateien zu. Statt einzubetten einen Link setzen, Bilder selbst ablegen.
- **Datum in der Zukunft**: Der Beitrag erscheint erst beim ersten Build an oder nach diesem Tag. Gebaut wird nur nach einem Push, nicht täglich.
- **Entwurf**: Unfertiges liegt in `_drafts/titel.md` (ohne Datum im Namen) oder trägt `published: false`. Zum Veröffentlichen nach `_posts/` verschieben und das Datum voranstellen.

## Gastbeitrag einspielen

Der Gast schreibt nach derselben Vorlage (`assets/downloads/post-template.md`, Link im Beitrag „Blogbeitrag erstellen“) und liefert:

- die Markdown-Datei mit Titel, Excerpt und Text,
- den Namen, wie er über dem Beitrag stehen soll,
- Bilder als eigene Dateien, mit Alt-Text im Markdown und der Zusage, dass er sie verwenden darf.

1. **Datei umbenennen** nach `_posts/JJJJ-MM-TT-kurzer-titel.md` (Datum der Veröffentlichung).
2. **Gast eintragen.** Im Kopf die Raute vor `author` entfernen und den Namen einsetzen:

   ```yaml
   author: "Vorname Nachname"
   ```

   Mehr erscheint vom Gast nicht: kein Profil, kein Bild, keine Links. Über dem Beitrag steht „von Vorname Nachname“.
3. **Bilder ablegen** in `assets/images/posts/` und die Einbindung im Text auf die Schreibweise mit `relative_url` bringen (wie beim [Blogbeitrag](#blogbeitrag-schreiben), Schritt 4).
4. **Lokal prüfen** mit `python3 scripts/content-check.py`. Die Meldungen nennen Zeile und Lösung, typisch sind HTML-Kommentare und Pfade ohne `relative_url`.
5. **Pushen.**

Fallen: Ein alter `http://`-Link des Gastes hält die Veröffentlichung nicht auf (nur Warnung), besser trotzdem auf `https://` umstellen. Ein handgeschriebenes `target="_blank"` kann raus, das erledigt der Build.

## Lebenslauf

Alles steht in `_data/cv_content.yml`, gegliedert in Abschnitte (`- section: …`).

### Station neu oder ändern

1. Unter `experiences:` (Beruf) oder `education:` (Ausbildung) einen bestehenden Eintrag kopieren und an der richtigen Stelle einfügen. Die Reihenfolge in der Datei ist die Reihenfolge auf der Seite.
2. Felder anpassen:

   ```yaml
   - position: "Softwareingenieur"
     company: "Beispiel GmbH"
     location: "Bochum, Deutschland"
     period: "2025 – Heute"
     description: |-
       Ein bis zwei Sätze zur Rolle.
     expandable: true
     responsibilities:
       - text: "**Lead** für ein Projekt"
         subitems:
           - "Ein Unterpunkt"
   ```

   Bei Ausbildung heißen die Felder `degree`, `institution`, `location`, `period`, `description` und `achievements`.
3. Prüfen und pushen.

Fallen: Zeiträume mit Halbgeviertstrich und normalen Leerzeichen („2020 – 2025“, „2025 – Heute“). Mehrzeiliger Text als `|-`-Block, ein harter Zeilenumbruch ist `\\` am Zeilenende. Text mit Doppelpunkt oder Anführungszeichen in doppelte Anführungszeichen setzen, innen deutsche „…“. Die Einrückung zählt: zwei Leerzeichen je Ebene, keine Tabs.

### Skill neu

1. In `skill_groups` bei der passenden Gruppe den Namen unter `core` (Kern) oder `breadth` (Breite) ergänzen, zum Beispiel `- "Rust"`.
2. Ohne Skill-Graph: fertig, weiter mit Schritt 5.
3. Mit Skill-Graph: in `_data/skill_graph.yml` die Skill-ID bei einem Projekt unter `skills` ergänzen oder ein neues Projekt anlegen:

   ```yaml
   - id: wetterstation        # fest, nie umbenennen
     label: "Wetterstation"
     skills: [python, rust]
   ```

   Basis-Werkzeuge wie Git oder Docker gehören stattdessen in `foundations` und bekommen keine Projekte.
4. **Slug-Regel:** Die Skill-ID ist der Name klein geschrieben, jede Folge aus Leer- und Sonderzeichen wird ein Bindestrich: „Next.js“ → `next-js`, „OCR / Tesseract“ → `ocr-tesseract`, „C#“ → `c`.
5. Prüfen und pushen. Eine ID ohne passenden Skill macht den Inhalts-Check rot und schlägt den gemeinten Namen vor.

Falle: Die Tests nutzen den Skill „Python“ als Beispiel. Wer ihn umbenennt oder entfernt, bekommt einen roten Testlauf, dann den Test mit anpassen lassen.

### Texte rund um die Skills

Der Hinweis über den Skills, die Zeile nach einem Klick, der Name der ergänzenden Kenntnisse je Gruppe für Screenreader und alle Beschriftungen im Skill-Graphen (Knöpfe, Hinweise) stehen in `_data/skill_graph.yml` ganz unten unter `texts`.

1. Den Text zwischen den Anführungszeichen ändern.
2. Prüfen und pushen. Einen vertippten oder leeren Schlüssel meldet der Inhalts-Check mit Zeile.

Fallen: `label` ist der Name für Screenreader und beginnt mit dem sichtbaren Text, bei den Zoom-Knöpfen mit dem Zeichen − bzw. +. Die Tests lesen die Texte aus dieser Datei, eine Textänderung braucht keinen angepassten Test.

## Startseite

Texte in `_data/home.yml`:

1. `intro`: die Einleitung unter dem Titelbild, Absätze im `|-`-Block durch eine Leerzeile getrennt, Markdown erlaubt.
2. `fractal_showcase`: Titel, Text, Knopf und Bild der Fraktal-Kachel (Bild tauschen: [eigener Abschnitt](#bild-tauschen)).
3. `latest_posts`: Überschrift, Anzahl und Knopftext der Beitragsliste.
4. Prüfen und pushen.

Die zwei Knöpfe im Titelbild („Über mich“, „Fraktale erkunden“) und der Satz darunter (`excerpt`) stehen im Kopf von `index.html` unter `header.actions`. Den Namen im Titelbild (Neon-Effekt) dort bitte nicht anfassen.

## Über mich

1. `_pages/about.md` öffnen. Unter dem Kopf steht der Text in Markdown: Einleitung ohne Überschrift, danach `##`-Abschnitte.
2. Ein Zitat über einem Abschnitt:

   ```liquid
   {% include section-epigraph.html text="Zitat" author="Name" %}
   ```

3. Prüfen und pushen.

Fallen: Der Kontaktsatz und die Kontaktkarten am Ende kommen aus `author.links` ([Kontakt](#kontakt-und-social-links)), dort ändern statt im Text. Der Titel „Über mich“ dient den Tests als Beispiel, bei einer Umbenennung den Test mit anpassen lassen.

## Mandelbrot-Texte

1. `_data/mandelbrot.yml` öffnen. Jeder Abschnitt hat `section` (Überschrift), `content` (Text als `|-`-Block) und optional `subsections` mit `title` und `content`. Der erste Abschnitt mit `intro: true` ist die Einleitung ohne Überschrift. Die Erklärungen hinter „Erklärung anzeigen“ in den beiden interaktiven Fraktalen stehen am Ende unter `panel_explanations`, die Felder erklärt der Kommentar darüber. Ein vertipptes oder leeres Feld meldet der Inhalts-Check mit Zeile.
2. Text ändern. Formeln haben hier eine eigene Schreibweise (STYLEGUIDE MD-3):

   ```yaml
   content: |-
     Die Folge $\\{z_n\\}$ bleibt für $n\\to\\infty$ beschränkt.

     $$\mathscr{M} = \{c \in \mathbb{C} : \lvert z_n \rvert \leq 2\}$$
   ```

   Im Satz (`$…$`) jeder Backslash doppelt, als eigener Absatz (`$$…$$`) einfach.
3. Prüfen und pushen. Eine falsche Schreibweise meldet der Inhalts-Check mit Zeile.

Fallen: `anchor`, `include` und `icon` nicht ändern, daran hängen Sprunglinks, die interaktiven Fraktale und die Symbole. Fachliche Aussagen bekommen eine Quelle als YAML-Kommentar (`# Quelle: Autor, Titel, Jahr, URL`).

## Fraktal-Bedienung

Knöpfe, Beschriftungen, Statusmeldungen („Berechne…“) und Gesten-Hinweise der beiden interaktiven Fraktale stehen in `_data/fractal_panel.yml`.

1. Den Text suchen und ändern. `buttons` sind die Knöpfe, `controls` Regler und Auswahlfelder, `canvas` die Texte in der Zeichenfläche, `julia` und `explorer` das, was nur eines der beiden Fraktale hat.
2. Prüfen und pushen. Einen vertippten oder leeren Schlüssel meldet der Inhalts-Check mit Zeile.

Fallen: Bei einem Knopf beginnt `aria_label` (Name für Screenreader) mit dem sichtbaren `label`, also „Reset – Ansicht zurücksetzen“ zu „Reset“. Wer `label` ändert, ändert `aria_label` mit. Felder mit `_active` sind der Text im eingeschalteten Zustand. `value` bei Farbschemas und Presets nicht ändern, daran hängen Farbpalette und Startwert.

## Navigation

### Menüpunkt ändern

1. In `_data/navigation.yml` unter `main` Titel oder Reihenfolge ändern:

   ```yaml
   main:
     - title: "Mandelbrot"
       url: "/mandelbrot/"
   ```

2. Prüfen und pushen.

Der Menütitel ist bewusst unabhängig vom Seitentitel („Mandelbrot“ im Menü, „Die Welt der Fraktale“ auf der Seite).

### Neue Seite

1. Neue Datei anlegen, zum Beispiel `_pages/projekte.md`, mit diesem Kopf:

   ```yaml
   ---
   title: "Projekte"
   excerpt: "Ein bis zwei Sätze, worum es auf der Seite geht."
   permalink: /projekte/
   header:
     overlay_image: /assets/images/background.jpg
     overlay_filter: 0.5
     caption: "Zusatzinformation zum Bild"
   ---
   ```

2. Darunter den Text schreiben, wie bei „Über mich“: Einleitung ohne Überschrift, dann `##`-Abschnitte.
3. In `_data/navigation.yml` unter `main` einen Eintrag mit derselben `url` anlegen.
4. Prüfen und pushen. Die Seite kommt von selbst in die Sitemap und in den Offline-Speicher.

Fallen: `permalink` mit Schrägstrich am Anfang und am Ende, sonst passt der Menüeintrag nicht. `_pages/about.md` taugt nicht als Kopiervorlage, sein Kopf enthält mit `person_schema` Angaben, die es nur einmal geben darf.

## Kontakt und Social-Links

Eine Quelle für alles: `author.links` in `_config.yml`. Daraus lesen die Seitenleiste, der Footer, die Kontaktkarten auf „Über mich“, der Kontaktsatz auf „Über mich“ und im Blog und die Suchmaschinen-Daten.

1. Einen Eintrag ergänzen oder ändern:

   ```yaml
   - label: "E-Mail"
     icon: "fas fa-fw fa-envelope"
     url: "mailto:kontakt@beispiel.de"
     handle: "kontakt@beispiel.de"   # Text auf der Kontaktkarte
     contact: true                    # als Kontaktkarte zeigen
     footer: true                     # im Footer zeigen
   ```

2. Prüfen und pushen.

Fallen: Der erste Eintrag mit `contact: true` steht im Kontaktsatz („am einfachsten über …“). Vorhandene Symbole: `fa-github`, `fa-linkedin`, `fa-envelope`, `fa-globe`. Ein anderes Symbol (etwa Mastodon) fehlt in der Schriftdatei und braucht einen Technik-Schritt (README_DEV, STYLEGUIDE TYP-12). In YAML zählt die Einrückung, wie bei den vorhandenen Einträgen.

## Footer

1. Seitenlinks: in `_data/navigation.yml` unter `footer` eine `url` ergänzen oder entfernen. Ohne `title` gilt der Menütitel aus `main`.
2. Kanäle (GitHub …): in `_config.yml` bei `author.links` `footer: true` setzen oder entfernen.
3. Prüfen und pushen.

Copyright-Zeile: Das Jahr setzt der Build selbst, der Name kommt aus `name` in `_config.yml`, „Möglich durch“ aus `powered_by` in `_data/ui-text.yml`.

## Bild tauschen

**Gleicher Dateiname** (einfachster Weg): Die neue Datei unter demselben Namen ablegen, prüfen, pushen. Mehr ist nicht nötig, der Offline-Speicher erneuert sich mit jedem Build.

**Neuer Dateiname:**

1. Datei vorbereiten. Titelbilder höchstens 1920 × 1080 px und möglichst unter 150 KB, Fotos als JPEG. Die Fraktal-Kachel braucht zwei Breiten, 400 und 800 px.
2. Ablegen. Bilder eines Beitrags nach `assets/images/posts/`, alles andere nach `assets/images/`.
3. Verweis ändern:
   - Titelbild einer Seite oder eines Beitrags: `header.overlay_image` (und `header.teaser` für die Kachel, deren Maße der Build selbst aus der Datei liest) im Kopf der Datei,
   - Titelbild als Standard und Vorschau für Link-Teilen: `background_image` und `og_image` in `_config.yml`,
   - Fraktal-Kachel der Startseite: `fractal_showcase.image` in `_data/home.yml`, jede Breite unter `srcset` mit ihrer `width`, dazu `alt`, `width` und `height` der Hauptdatei.
4. Nur für Bilder außerhalb von `assets/images/posts/`: den neuen Namen in `CACHE_URLS` in `service-worker.js` eintragen (bei der Kachel jede Breite) und den alten entfernen. Sonst meldet der Test `precache.spec.js` die fehlende Datei.
5. Alte Datei löschen, wenn sie nirgends mehr gebraucht wird, prüfen und pushen.

Falle: `assets/images/background.jpg` steht unter einer fremden Lizenz und darf nicht weitergegeben werden (README, Abschnitt „Lizenz“).

## Seitentitel und Excerpt

1. Den Kopf der Datei öffnen (`_pages/*.md`, `_posts/*.md`, Startseite `index.html`).
2. `title` ist der Name auf der Seite und im Browser-Tab (ohne „– Hans Müller“, das ergänzt die Seite selbst). `excerpt` ist die Kurzbeschreibung für Übersichten und Suchmaschinen, ein bis zwei Sätze mit Punkt, 70 bis 160 Zeichen. `header.caption` ist die kleine Zeile im Titelbild.
3. Prüfen und pushen.

Falle: Auf der Startseite ist `title` HTML für den Neon-Namen, für Suchmaschinen gilt dort `seo_title`. Der Menüname bleibt davon unberührt ([Navigation](#navigation)).

## Blog-Hinweis

Der Hinweis über der Blog-Übersicht steht in `_pages/posts.md` unter `blog_notice`:

1. Einschalten:

   ```yaml
   blog_notice:
     enabled: true
     id: "winterpause-2026"
     title: "Winterpause"
     text: "Bis Februar entstehen keine neuen Beiträge."
   ```

2. Für einen neuen Hinweis immer eine neue `id` vergeben. Wer den alten Hinweis geschlossen hat, sieht sonst auch den neuen nicht.
3. Ausschalten mit `enabled: false`, der Text darf stehen bleiben.
4. Prüfen und pushen.

Falle: Der Hinweis kennt kein Ablaufdatum (Register R-67), er bleibt, bis er ausgeschaltet wird.

## Prüfen vor dem Push

**Lokal, in Sekunden:**

```bash
python3 scripts/content-check.py
```

Er braucht Python 3 und PyYAML (`pip install pyyaml`) oder Ruby. Jede Meldung sieht so aus:

```text
FEHLER _posts/2026-11-02-wetterstation.md:12: HTML-Kommentar „<!--“. Er ist auf der Seite unsichtbar, steht aber öffentlich im Quelltext.
  Lösung: {% comment %} … {% endcomment %} nutzen, das entfernt Jekyll beim Bauen.
```

Datei und Zeile stehen vor dem Doppelpunkt, die Zeile „Lösung“ sagt, was zu tun ist. `FEHLER` hält die Veröffentlichung auf, `WARNUNG` nicht.

**Mit Vorschau** (optional, braucht Docker): Bauen und Testen wie die CI beschreibt `tests/README.md`, Abschnitt „Lokal ausführen“. Die Vorschau läuft mit `bundle exec jekyll serve` unter <http://localhost:4000/auflinie/>.

**In der CI** (nach jedem Push auf `main`, auf GitHub unter „Actions“): Ein grüner Lauf veröffentlicht nach etwa zehn Minuten. Bei einem roten Lauf den roten Schritt aufklappen:

| Schritt | Bedeutung | Was tun |
|---|---|---|
| Inhalts-Check (Quellen) | wie lokal: Datei, Zeile, Lösung | Lösung umsetzen |
| Build site | Jekyll kann eine Datei nicht lesen, meist YAML (Einrückung, fehlendes Anführungszeichen) oder ein Kopf ohne schließendes `---` | die genannte Datei und Zeile prüfen |
| CSP-Prüfung | ein eingebettetes Skript, ein Bild über `http://` oder von einer fremden Seite | Einbettung durch einen Link ersetzen, Bild selbst ablegen |
| Interne Links, Bilder und Skripte (html-proofer) | `internal image … does not exist`: Bilddatei fehlt oder Name falsch geschrieben. `internally linking to …, which does not exist`: Link auf eine Seite, die es nicht gibt. `… does not have an alt attribute`: Bild ohne Alt-Text | Datei und Pfad abgleichen, Groß- und Kleinschreibung beachten |
| Style-Guide-Review (Playwright) | Tests im Browser, etwa Barrierefreiheit eines neuen Beitrags | Am Ende der Ausgabe steht unter „failed“ jeder rote Test mit Seite, etwa `axe: /posts/wetterstation/`. Den ausführlichen Bericht gibt es auf der Seite des Laufs unter „Artifacts“ als `playwright-report` |
| Lint-Job | betrifft Code, nicht Inhalte | nach einem reinen Inhalts-Commit kaum möglich, sonst [Wartung](#wartung-selten) |

## Wartung (selten)

Ausführlich in `README_DEV.md`, `.devcontainer/README.md` und `tests/README.md`. Kurzfassung:

- **Dependabot-Mail „Security alert“**: Die gemeldete Bibliothek ist fast immer ein Werkzeug für Bauen oder Testen, nichts davon läuft auf der Website. Ist ein Fix verfügbar, beim nächsten Wartungstermin aktualisieren (`npm update <paket>` oder im Docker-Container `bundle update <gem>`), sonst abwarten (STYLEGUIDE SEC-8c).
- **Dependabot-PR „ci: bump the actions group“** (einmal im Monat): Die CI läuft für den PR nicht von selbst. Auf GitHub unter „Actions“ den Workflow mit „Run workflow“ auf dem Branch des PR starten. Grün: PR mergen. Rot: PR offen lassen und den Lauf ansehen.
- **Roter Lauf ohne eigene Änderung**: Meist ein Download-Problem (Theme, Gems, Playwright-Image) oder ein einmal hängender Test. Einmal „Re-run failed jobs“. Bleibt derselbe Schritt rot, hat sich eine Umgebung geändert, dann `README_DEV.md` und den roten Schritt ansehen. Online bleibt so lange die letzte grüne Fassung.
- **Ruby, Node oder Playwright aktualisieren**: Je Werkzeug gibt es genau eine Versionsdatei (`.ruby-version`, `.nvmrc`, `package.json` für Playwright). Was dazu im Dev Container und im Workflow nachzuziehen ist, prüft `scripts/version-sync-check.sh`, die Einzelheiten stehen in `.devcontainer/README.md` und `tests/README.md`. Nach einem Playwright-Wechsel die Vergleichsbilder neu erzeugen.
