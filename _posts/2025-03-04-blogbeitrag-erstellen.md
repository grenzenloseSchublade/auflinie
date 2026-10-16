---
title: "Wie ein Blogbeitrag entsteht"
date: 2025-03-04
last_modified_at: 2026-10-04
author_profile: true
categories:
  - Tutorial
  - Webentwicklung
tags:
  - Jekyll
  - Bloggen
  - Markdown
  - Minimal Mistakes
  - Technische Dokumentation
header:
  overlay_image: /assets/images/background.jpg
  overlay_filter: 0.5
  caption: "Markdown und Front Matter"
  teaser: /assets/images/background.jpg
toc: true
toc_label: "Inhalt"
toc_icon: "list"
toc_sticky: true
toc_collapse: true
excerpt: "Wie ein Beitrag auf dieser Website entsteht, vom Entwurf in Markdown bis zur Veröffentlichung – mit Vorlage zum Herunterladen."
---

Dieser Beitrag zeigt, wie ein Blogbeitrag auf dieser Website entsteht: welche Technik dahintersteckt, wie eine Beitragsdatei aufgebaut ist und worauf es beim Schreiben ankommt. Er ist als Leitfaden gedacht und soll den Einstieg leichter machen.

Wer sich mit dem Thema schon auskennt, kann direkt die [Vorlage <i class="fas fa-download download-link__icon" aria-hidden="true"></i>]({{ "assets/downloads/post-template.md" | relative_url }}){: .download-link download="post-template.md"} herunterladen und losschreiben. Sie enthält alles, was ein Blogbeitrag braucht: Front Matter, Gliederung und kurze Hinweise.

## Technischer Aufbau

Die Website basiert auf **Jekyll**, einem etablierten Static Site Generator, in Kombination mit dem **Minimal-Mistakes-Theme**. Jekyll macht aus Markdown-Dateien und strukturierten Daten statische HTML-Seiten. Das hat mehrere Vorteile:

- **Performance**: Statische Dateien laden schnell, weil der Server nichts berechnen muss
- **Sicherheit**: Ohne Datenbank und dynamische Serverkomponenten gibt es weniger Angriffsfläche
- **Skalierbarkeit**: Content Delivery Networks können statische Inhalte effizient verteilen
- **Wartbarkeit**: Markdown ist gut lesbar und lässt sich mit Git versionieren

Diese Architektur folgt dem **Jamstack-Prinzip** (JavaScript, APIs, Markup). Gemeint ist eine Webarchitektur aus clientseitigem JavaScript, wiederverwendbaren APIs und vorab gerendertem, statischem Markup. Die Seiten entstehen im Voraus als statische Dateien und werden über Content Delivery Networks (CDNs) ausgeliefert. Das macht sie schnell, weil nichts bei jeder Anfrage neu erzeugt werden muss. Ein eigenes Backend braucht diese Website dabei nicht.

Minimal Mistakes ist ein anpassbares, schlankes Theme für Jekyll und eine solide Grundlage für Beiträge und Seiten. Alle Beiträge bekommen damit dieselbe Struktur und denselben Stil. Weil das Theme modular aufgebaut ist, lässt sich die Website trotzdem individuell anpassen.

### Inhalt und Darstellung

Inhalt und Darstellung sind klar getrennt.
Inhalt und Struktur der Seiten stehen in Markdown- und YAML-Dateien. Markdown ist das Standardformat für Beiträge und Seiten, weil es eine einfache, lesbare Syntax für Textformatierung hat. Jekyll verarbeitet es mit dem Parser kramdown. So entstehen Beiträge und Seiten mit formatiertem Text, Listen, Links und anderen Elementen.

YAML legt die Metadaten fest, vor allem im Front Matter am Anfang jeder Markdown-Datei. Dazu gehören Titel, Datum, Kategorien, Tags und weitere Einstellungen, die das Verhalten des Themes steuern. `date` legt zum Beispiel das Veröffentlichungsdatum fest, `categories` und `tags` ordnen den Beitrag ein. Jekyll liest diese Metadaten beim Bauen der Website und ordnet und zeigt die Inhalte danach an.

## Aufbau der Markdown-Dateien

Für einen Blogbeitrag reicht eine Markdown-Datei mit passendem Front Matter. Die Datei folgt einem festen Schema. Damit der Anfang leichter fällt, gibt es eine Vorlage, die die nötigen Metadaten und die Gliederung schon enthält. Die folgenden Abschnitte zeigen, wie sie aufgebaut ist und welche Elemente sie enthält.

[<i class="fas fa-download" aria-hidden="true"></i> Vorlage herunterladen]({{ "assets/downloads/post-template.md" | relative_url }}){: .btn .btn--primary .btn--medium download="post-template.md"}
{: .download-cta}

### Syntaktischer Aufbau

Die Vorlage legt die Metadaten und die Gliederung fest. Sie besteht aus zwei Teilen:

- Front Matter (YAML): die Metadaten
- Markdown: Inhalt und Gliederung

Das Front Matter enthält die Metadaten des Beitrags, etwa Titel, Datum, Kategorien und weitere Parameter für den Aufbau:

```yaml
---
title: "Titel des Blogbeitrags"
excerpt: "Kurzbeschreibung in ein bis zwei Sätzen"
date: 2025-03-04
categories:
  - Hauptkategorie
tags:
  - Relevante Schlagwörter
header:
  teaser: "/assets/images/posts/teaser-bild.jpg"
  overlay_image: "/assets/images/posts/header-bild.jpg"
  overlay_filter: 0.5
  caption: "Bildunterschrift"
toc: true
toc_label: "Inhalt"
toc_sticky: true
toc_collapse: true
---
```

Die wichtigsten Parameter sind:

| Parameter | Beschreibung |
|-----------|--------------|
| **title** | Titel des Beitrags, erscheint im Bild oben, in der Übersicht und in Suchmaschinen |
| **excerpt** | Kurzbeschreibung in ein bis zwei Sätzen, erscheint in der Übersicht und in Suchmaschinen |
| **author** | Nur bei Gastbeiträgen: Name, der über dem Beitrag steht |
| **date** | Veröffentlichungsdatum im ISO-Format, bestimmt die Reihenfolge in Übersicht und Archiv. Steht schon im Dateinamen (`_posts/2025-03-04-titel.md`), im Front Matter nur nötig, um es zu überschreiben. Ein Beitrag mit Datum in der Zukunft erscheint erst, wenn die Seite an oder nach diesem Tag neu gebaut wird. |
| **categories** | Grobe thematische Einordnung |
| **tags** | Schlagwörter zur feineren Einordnung |
| **header** | Bild oben im Beitrag, mit Abdunklung und Bildunterschrift |
| **toc** | Erzeugt das Inhaltsverzeichnis aus den Überschriften |
| **toc_label** | Titel des Inhaltsverzeichnisses |
| **toc_sticky** | Inhaltsverzeichnis bleibt beim Scrollen sichtbar |
| **toc_collapse** | Inhaltsverzeichnis lässt sich ein- und ausklappen |

### Inhaltlicher Aufbau

Der Markdown-Teil enthält den eigentlichen Beitrag mit Überschriften, Absätzen, Listen und anderen Elementen. Geschrieben wird im klassischen Markdown-Stil.
Markdown kennt die grundlegenden Formatierungen: Überschriften, Listen, Fett- und Kursivschrift, Zitate und Code-Blöcke. Überschriften beginnen mit einem oder mehreren Rautezeichen (`#`) am Zeilenanfang, die Anzahl bestimmt die Ebene. Ungeordnete Listen beginnen mit Bindestrichen (`-`), Sternchen (`*`) oder Pluszeichen (`+`), nummerierte Listen mit einer Zahl und einem Punkt. Fetter Text steht zwischen je zwei Sternchen (`**`) oder Unterstrichen (`__`), kursiver zwischen je einem Sternchen (`*`) oder Unterstrich (`_`). Code-Blöcke stehen zwischen drei Backticks (<code>&#96;&#96;&#96;</code>), dahinter lässt sich optional die Programmiersprache angeben.

[Im Exkurs am Ende](#exkurs-markdown-kurz-erklärt) stehen die wichtigsten Markdown-Elemente mit Beispielen. Die Vorlage nutzt die gängigsten davon.

## Gastbeiträge veröffentlichen

Mit der Zeit sollen hier auch Gastbeiträge erscheinen. Dafür gibt es ein festes Verfahren in vier Schritten:

1. **Kontakt**: Themenvorschläge kommen per Nachricht, etwa über GitHub oder LinkedIn
2. **Vorbereitung**: Der Text liegt möglichst schon als Markdown vor und folgt der Vorlage
3. **Prüfung**: Jeder Beitrag wird auf Relevanz, technische Korrektheit und einheitlichen Stil durchgesehen
4. **Veröffentlichung**: Passt alles, wird der Beitrag eingebunden und veröffentlicht

### Worauf es ankommt

Damit die Beiträge einheitlich und gut lesbar bleiben, gelten ein paar Standards.

#### Aufbau
- **Logische Hierarchie**: Überschriften folgen der Gliederung, keine Ebene wird übersprungen
- **Kurze Absätze**: ein Gedanke pro Absatz, das liest sich leichter
- **Bilder und Interaktives**: gezielt dort, wo sie etwas erklären

#### Technik
- **Formeln**: in LaTeX-Syntax, dazu `mathjax: true` im Front Matter
- **Code**: in Code-Blöcken mit Sprachangabe, damit das Syntax-Highlighting greift

#### Redaktion
- **Einheitlicher Stil**: wissenschaftlich sauber, aber ohne unnötige Komplexität
- **Rechtschreibung**: Jeder Text wird vor dem Veröffentlichen Korrektur gelesen
- **Metadaten**: passende Kategorien und Tags

#### Wissenschaftliche Sorgfalt

Für fachliche Beiträge empfehlen sich wissenschaftliche Standards:

- **Quellen**: Literatur nach einem gängigen Zitierstil angeben
- **Begriffe**: Fachbegriffe definieren, damit auch Fachfremde folgen können
- **Nachvollziehbarkeit**: offenlegen, mit welchen Ansätzen und Verfahren ein Ergebnis zustande kam

## Fazit

Mit Jekyll entstehen Blogbeiträge schnell, sicher und gut wartbar. Gliederung, Metadaten und Redaktion folgen klaren Regeln, die Technik dahinter bleibt flexibel. Weil Inhalt, Metadaten und Darstellung getrennt sind, bleiben Beiträge einheitlich und wiederverwendbar – und das System passt trotzdem für ganz verschiedene Texte, vom technischen Tutorial bis zur wissenschaftlichen Analyse.

---

## Exkurs: Markdown kurz erklärt

Markdown ist eine schlanke Auszeichnungssprache. Die wichtigsten Elemente im Überblick:

### Überschriften

```markdown
## Hauptüberschrift (Ebene 2)
### Unterüberschrift (Ebene 3)  
#### Detailüberschrift (Ebene 4)
```

### Aufzählungen und Listen

```markdown
- Punkt ohne feste Reihenfolge
- Noch ein Punkt
  - Eingerückter Unterpunkt

1. Erster Schritt
2. Zweiter Schritt
   1. Unterschritt
```

### Fett und kursiv

```markdown
*Kursive Hervorhebung* für Begriffsdefinitionen
**Fettdruck** für zentrale Konzepte
***Kombinierte Auszeichnung*** für die stärkste Betonung
```

### Links

**Externe Links:**

```markdown
[Externe Referenz](https://google.de)
```

Ergebnis: [Externe Referenz](https://google.de)

Externe Links öffnen automatisch in einem neuen Tab, das kleine Symbol hinter dem Link zeigt das an. Ein Zusatz im Markdown ist dafür nicht nötig.

**Interne Links:**

```markdown
{% raw %}[Erstellung dieser Website]({{ "/posts/erstellung-dieser-website/" | relative_url }}){% endraw %}
```

Ergebnis: [Erstellung dieser Website]({{ "/posts/erstellung-dieser-website/" | relative_url }})

### Code

**Inline-Code:**

```markdown
`Inline-Code` für kurze Befehle oder Variablen
```

Ergebnis: `Inline-Code` für kurze Befehle oder Variablen

**Code-Blöcke:**

<pre><code>
```python
# Code-Block mit Syntax-Highlighting
def hallo_welt():
    return "Hallo aus Jekyll!"
```
</code></pre>

Ergebnis:

```python
# Code-Block mit Syntax-Highlighting
def hallo_welt():
    return "Hallo aus Jekyll!"
```

### Zitate

```markdown
> Fachliche Zitate und Referenzen
> können mehrzeilig dargestellt werden
```

Ergebnis:

> Fachliche Zitate und Referenzen
> können mehrzeilig dargestellt werden

### Tabellen

**Einfache Tabelle:**

```markdown
| Parameter | Datentyp | Beschreibung |
|-----------|----------|--------------|
| title     | String   | Beitragstitel |
| date      | ISO-Datum | Veröffentlichungsdatum |
```

Ergebnis:

| Parameter | Datentyp | Beschreibung |
|-----------|----------|--------------|
| title     | String   | Beitragstitel |
| date      | ISO-Datum | Veröffentlichungsdatum |

**Erweiterte Tabellen mit Ausrichtung:**

```markdown
| Linksbündig | Zentriert | Rechtsbündig |
|:------------|:---------:|-------------:|
| Text        | Text      | Text         |
```

Ergebnis:

| Linksbündig | Zentriert | Rechtsbündig |
|:------------|:---------:|-------------:|
| Text        | Text      | Text         |

### Bilder

Bilder für Beiträge gehören in den Ordner `assets/images/posts/`. Eingebunden werden sie über ihren Pfad, dahinter stehen Breite und Höhe in Pixeln, damit die Seite beim Laden nicht springt:

```markdown
{% raw %}![Was das Bild zeigt]({{ "/assets/images/posts/dateiname.jpg" | relative_url }}){: width="1200" height="800"}{% endraw %}
```

Header- und Teaser-Bilder stehen im Front Matter:

```yaml
header:
  teaser: "/assets/images/posts/teaser-bild.jpg"
  overlay_image: "/assets/images/posts/header-bild.jpg"
  overlay_filter: 0.5
  caption: "Zusatzinformation zum Bild"
```

### Trennlinien und Aufgabenlisten

**Horizontale Trennlinien:**

```markdown
---
```

Ergebnis:

---

**Aufgabenlisten (Checkboxen):**

```markdown
- [x] Erledigte Aufgabe
- [ ] Offene Aufgabe
- [ ] Weitere Aufgabe
```

Ergebnis:

- [x] Erledigte Aufgabe
- [ ] Offene Aufgabe
- [ ] Weitere Aufgabe

### Fußnoten und aufklappbare Bereiche

**Fußnoten:**

Anmerkung: Fußnoten erscheinen am Ende der Seite.

```markdown
Text mit Fußnote[^1] und weiterer Referenz[^2]

[^1]: Erste Fußnote
[^2]: Zweite Fußnote
```

Ergebnis: Text mit Fußnote[^1] und weiterer Referenz[^2]

[^1]: Erste Fußnote
[^2]: Zweite Fußnote

**Aufklappbarer Bereich (HTML):**

```markdown
<details>
<summary>Klickbarer Bereich</summary>
Versteckter Inhalt wird hier angezeigt
</details>
```

Ergebnis:

<details>
<summary>Klickbarer Bereich</summary>
Versteckter Inhalt wird hier angezeigt
</details>


