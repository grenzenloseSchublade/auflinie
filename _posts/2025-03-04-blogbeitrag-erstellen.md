---
title: "Erstellung von Blogbeiträgen"
date: 2025-03-04
last_modified_at: 2026-10-01
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
  caption: "Technische Grundlagen und Methodik für Content Management"
  teaser: /assets/images/background.jpg
toc: true
toc_label: "Inhalt"
toc_icon: "list"
toc_sticky: true
toc_collapse: true
excerpt: "Wie ein Beitrag auf dieser Website entsteht, vom Entwurf in Markdown bis zur Veröffentlichung – mit Vorlage zum Herunterladen."
---

Dieser Beitrag zeigt, wie ein Blogbeitrag auf dieser Website entsteht: welche Technik dahintersteckt, wie eine Beitragsdatei aufgebaut ist und worauf es beim Schreiben ankommt. Er ist als Leitfaden gedacht und soll den Einstieg leichter machen.

Wer sich mit dem Thema schon auskennt, kann direkt das <a href="{{ "assets/downloads/post-template.md" | relative_url }}" download="post-template.md" style="text-decoration: underline;">Template <i class="fas fa-download" style="margin-left: 0.35em;"></i></a> herunterladen und losschreiben. Es enthält alles, was ein Blogbeitrag braucht: Front Matter, Gliederung und kurze Hinweise.

## Technischer Aufbau

Die Website basiert auf **Jekyll**, einem etablierten Static Site Generator, in Kombination mit dem **Minimal Mistakes Theme**. Jekyll macht aus Markdown-Dateien und strukturierten Daten statische HTML-Seiten. Das hat mehrere Vorteile:

- **Performance**: Statische Dateien laden schnell, weil der Server nichts berechnen muss
- **Sicherheit**: Ohne Datenbank und dynamische Serverkomponenten gibt es weniger Angriffsfläche
- **Skalierbarkeit**: Content Delivery Networks können statische Inhalte effizient verteilen
- **Wartbarkeit**: Markdown ist gut lesbar und lässt sich mit Git versionieren

Diese Architektur folgt dem **JAMstack-Prinzip** (JavaScript, APIs, Markup). Gemeint ist eine Webarchitektur aus clientseitigem JavaScript, wiederverwendbaren APIs und vorab gerendertem, statischem Markup. Die Seiten entstehen im Voraus als statische Dateien und werden über Content Delivery Networks (CDNs) ausgeliefert. Das macht sie schnell, weil nichts bei jeder Anfrage neu erzeugt werden muss. Frontend und Backend sind dabei entkoppelt und lassen sich unabhängig voneinander entwickeln und skalieren.

Minimal Mistakes ist ein anpassbares, schlankes Theme für Jekyll und eine solide Grundlage für Beiträge und Seiten. Alle Beiträge bekommen damit dieselbe Struktur und denselben Stil. Weil das Theme modular aufgebaut ist, lässt sich die Website trotzdem individuell anpassen.

### Content-First-Design

Die Struktur folgt dem **Content-First-Design**: Inhalt und Präsentation sind klar getrennt.
Inhalt und Struktur der Seiten stehen in Markdown- und YAML-Dateien. Markdown ist das Standardformat für Beiträge und Seiten, weil es eine einfache, lesbare Syntax für Textformatierung hat. Jekyll verarbeitet es mit dem Parser kramdown. So entstehen Beiträge und Seiten mit formatiertem Text, Listen, Links und anderen Elementen.

YAML legt die Metadaten fest, vor allem im Front Matter am Anfang jeder Markdown-Datei. Dazu gehören Titel, Datum, Kategorien, Tags und weitere Einstellungen, die das Verhalten des Themes steuern. `date` legt zum Beispiel das Veröffentlichungsdatum fest, `categories` und `tags` ordnen den Beitrag ein. Jekyll liest diese Metadaten beim Bauen der Website und ordnet und zeigt die Inhalte danach an.

## Aufbau der Markdown-Dateien

Für einen Blogbeitrag reicht eine Markdown-Datei mit passendem Front Matter. Die Datei folgt einem festen Schema. Damit der Anfang leichter fällt, gibt es ein Template, das die nötigen Metadaten und die Gliederung schon enthält. Die folgenden Abschnitte zeigen, wie es aufgebaut ist und welche Elemente es enthält.
<div style="text-align: center">
  <a href="{{ "assets/downloads/post-template.md" | relative_url }}" class="btn btn--primary btn--medium" download="post-template.md"><i class="fas fa-download"></i> Template herunterladen</a>
</div>

### Syntaktischer Aufbau

Das Template legt die Metadaten und die Gliederung fest. Es besteht aus zwei Teilen:

- Front Matter (YAML): die Metadaten
- Markdown: Inhalt und Gliederung

Das Front Matter enthält die Metadaten des Beitrags, etwa Titel, Datum, Kategorien und weitere Parameter für den Aufbau:

```yaml
---
title: "Titel des Blogbeitrags"
date: YYYY-MM-DD
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
| **date** | Veröffentlichungsdatum im ISO-Format, bestimmt die Reihenfolge in Übersicht und Archiv |
| **categories** | Grobe thematische Einordnung |
| **tags** | Schlagwörter zur feineren Einordnung |
| **header** | Bild oben im Beitrag, mit Abdunklung und Bildunterschrift |
| **toc** | Erzeugt das Inhaltsverzeichnis aus den Überschriften |
| **toc_label** | Titel des Inhaltsverzeichnisses |
| **toc_sticky** | Inhaltsverzeichnis bleibt beim Scrollen sichtbar |
| **toc_collapse** | Inhaltsverzeichnis lässt sich ein- und ausklappen |

### Inhaltlicher Aufbau

Der Markdown-Teil enthält den eigentlichen Beitrag mit Überschriften, Absätzen, Listen und anderen Elementen. Geschrieben wird im klassischen Markdown-Stil.
Markdown kennt die grundlegenden Formatierungen: Überschriften, Listen, Fett- und Kursivschrift, Zitate und Code-Blöcke. Überschriften beginnen mit einem oder mehreren Rautezeichen (`#`) am Zeilenanfang, die Anzahl bestimmt die Ebene. Ungeordnete Listen beginnen mit Bindestrichen (`-`), Sternchen (`*`) oder Pluszeichen (`+`), nummerierte Listen mit einer Zahl und einem Punkt. Fetter Text steht zwischen zwei Sternchen (`**`) oder Unterstrichen (`__`), kursiver zwischen einem Sternchen (`*`) oder Unterstrich (`_`). Code-Blöcke stehen zwischen drei Backticks (<code>&#96;&#96;&#96;</code>), dahinter lässt sich optional die Programmiersprache angeben.

[Im Exkurs am Ende](#exkurs-wie-verwende-ich-markdown) stehen die wichtigsten Markdown-Elemente mit Beispielen. Das Template enthält sie ebenfalls.

## Veröffentlichung von Blogbeiträgen

Mit der Zeit sollen hier auch Gastbeiträge erscheinen. Dafür gibt es ein festes Verfahren in vier Schritten:

1. **Kontakt**: Themenvorschläge kommen per Nachricht, etwa über GitHub oder LinkedIn
2. **Vorbereitung**: Der Text liegt möglichst schon als Markdown vor und folgt dem Template
3. **Prüfung**: Jeder Beitrag wird auf Relevanz, technische Korrektheit und einheitlichen Stil durchgesehen
4. **Veröffentlichung**: Passt alles, wird der Beitrag eingebunden und veröffentlicht

### Qualitätsstandards und Best Practices

Damit die Beiträge einheitlich und gut lesbar bleiben, gelten ein paar Standards.

#### Strukturelle Anforderungen
- **Logische Hierarchie**: Überschriften folgen der Gliederung, keine Ebene wird übersprungen
- **Kurze Absätze**: ein Gedanke pro Absatz, das liest sich leichter
- **Bilder und Interaktives**: gezielt dort, wo sie etwas erklären

#### Technische Standards
- **Formeln**: in LaTeX-Syntax, dazu `mathjax: true` im Front Matter
- **Code**: in Code-Blöcken mit Sprachangabe, damit das Syntax-Highlighting greift

#### Redaktionelle Qualitätssicherung
- **Einheitlicher Stil**: wissenschaftlich sauber, aber ohne unnötige Komplexität
- **Rechtschreibung**: Jeder Text wird vor dem Veröffentlichen Korrektur gelesen
- **Metadaten**: passende Kategorien und Tags
- **Fachbegriffe**: werden beim ersten Auftreten erklärt

#### Wissenschaftliche Sorgfalt

Für fachliche Beiträge empfehlen sich wissenschaftliche Standards:

- **Quellen**: Literatur nach einem gängigen Zitierstil angeben
- **Begriffe**: Fachbegriffe definieren, damit auch Fachfremde folgen können
- **Nachvollziehbarkeit**: offenlegen, mit welchen Ansätzen und Verfahren ein Ergebnis zustande kam

## Fazit

Mit Jekyll entstehen Blogbeiträge schnell, sicher und gut wartbar. Gliederung, Metadaten und Redaktion folgen klaren Regeln, die Technik dahinter bleibt flexibel. Weil Inhalt, Metadaten und Darstellung getrennt sind, bleiben Beiträge einheitlich und wiederverwendbar – und das System passt trotzdem für ganz verschiedene Texte, vom technischen Tutorial bis zur wissenschaftlichen Analyse. Davon haben Schreibende und Lesende gleichermaßen etwas.

---

---

## Exkurs: Wie verwende ich Markdown?

Markdown ist eine schlanke Auszeichnungssprache. Die wichtigsten Elemente im Überblick:

### Hierarchische Strukturierung

```markdown
## Hauptüberschrift (Ebene 2)
### Unterüberschrift (Ebene 3)  
#### Detailüberschrift (Ebene 4)
```

### Aufzählungen und Listen

```markdown
- Ungeordnete Listenpunkte für qualitative Sammlungen
- Strukturierte Darstellung ohne Rangfolge
  - Hierarchische Unterebenen für Detaillierung

1. Nummerierte Listen für sequentielle Prozesse
2. Priorisierte oder chronologische Abfolgen
   1. Verschachtelte Nummerierung für komplexe Strukturen
```

### Textauszeichnung und Hervorhebung

```markdown
*Kursive Hervorhebung* für Begriffsdefinitionen
**Fettdruck** für zentrale Konzepte
***Kombinierte Auszeichnung*** für maximale Betonung
```

### Externe und interne Verlinkung

**Externe Links:**

```markdown
[Externe Referenz](https://google.de)
```

Ergebnis: [Externe Referenz](https://google.de)

**Externe Links in neuem Tab öffnen:**

```markdown
[Externe Referenz](https://google.de){:target="_blank" rel="noopener noreferrer"}
```

Ergebnis: [Externe Referenz](https://google.de){:target="_blank" rel="noopener noreferrer"}

**Interne Links:**

```markdown
{% raw %}[Interne Querverweise]({{ "/posts/erster-beitrag/" | relative_url }}){% endraw %}
```

Ergebnis: [Interne Querverweise]({{ "/posts/erster-beitrag/" | relative_url }})

### Code-Integration

**Inline-Code:**

```markdown
`Inline-Code` für kurze Befehle oder Variablen
```

Ergebnis: `Inline-Code` für kurze Befehle oder Variablen

**Code-Blöcke:**

<pre><code>
```python
# Syntax-highlightete Code-Blöcke
def demonstrate_functionality():
    return "Erweiterte Beispiele mit Sprachunterstützung"
```
</code></pre>

Ergebnis:

```python
# Syntax-highlightete Code-Blöcke
def demonstrate_functionality():
    return "Erweiterte Beispiele mit Sprachunterstützung"
```

### Zitatintegration

```markdown
> Fachliche Zitate und Referenzen
> können mehrzeilig dargestellt werden
```

Ergebnis:

> Fachliche Zitate und Referenzen
> können mehrzeilig dargestellt werden

### Tabellarische Datenorganisation

**Einfache Tabelle:**

```markdown
| Parameter | Datentyp | Beschreibung |
|-----------|----------|--------------|
| title     | String   | Beitragstitel |
| date      | ISO-Date | Publikationsdatum |
```

Ergebnis:

| Parameter | Datentyp | Beschreibung |
|-----------|----------|--------------|
| title     | String   | Beitragstitel |
| date      | ISO-Date | Publikationsdatum |

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

### Bildintegration

Bilder für Beiträge gehören in den Ordner `assets/images/posts/`. Eingebunden werden sie über ihren Pfad:

```markdown
![Semantische Beschreibung]({{ "/assets/images/posts/dateiname.jpg" | relative_url }})
```

Header- und Teaser-Bilder stehen im Front Matter. So sehen alle Beiträge einheitlich aus:

```yaml
header:
  teaser: "/assets/images/posts/teaser-bild.jpg"
  overlay_image: "/assets/images/posts/header-bild.jpg"
  overlay_filter: 0.5
  caption: "Kontextuelle Bildbeschreibung"
```

### Strukturierung und Navigation

**Horizontale Trennlinien:**

```markdown
---
```

Ergebnis:

---

**Task Lists (Checkboxen):**

```markdown
- [x] Erledigte Aufgabe
- [ ] Offene Aufgabe
- [ ] Weitere Aufgabe
```

Ergebnis:

- [x] Erledigte Aufgabe
- [ ] Offene Aufgabe
- [ ] Weitere Aufgabe

### Erweiterte Funktionen

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

**HTML-Integration:**

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


