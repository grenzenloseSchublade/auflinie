---
# Depubliziert 1. 10. 2026 (INH-4, Audit B-COPY-05): Demo-Beitrag ohne
# Inhalt für Leser. Im Review-Build (--unpublished) bleibt er sichtbar.
published: false
title: "Mein erster Blogbeitrag"
date: 2025-02-15
last_modified_at: 2025-02-15
excerpt: "Ein erster Testbeitrag zur Demonstration von Jekyll und dem Minimal Mistakes Theme."
header:
  overlay_image: /assets/images/background.jpg
  overlay_filter: 0.5
  teaser: /assets/images/background.jpg
categories:
  - Blog
tags:
  - Jekyll
  - Aktualisierung
toc: true
toc_label: "Inhalt"
toc_icon: "list"
toc_sticky: true
---

Dies ist ein erster Blogbeitrag zu Testzwecken mit Jekyll und dem Minimal Mistakes Theme. Zusätzlich dient dieser zur (beispielhaften) Darstellung von internen und externen Referenzierungen von  Blogbeiträgen in einem Anleitungsbeitrag.

## Überschrift 2

Hier lässt sich normaler Text schreiben, alle Markdown-Funktionen sind nutzbar:

- Aufzählungen
- mit mehreren
- Punkten

### Tabellen

Hier ist ein Beispiel für eine Tabelle:

| Spalte 1 | Spalte 2 | Spalte 3 |
|----------|----------|----------|
| Inhalt 1 | Inhalt 2 | Inhalt 3 |
| Text A   | Text B   | Text C   |
| Daten 1  | Daten 2  | Daten 3  |

### Code-Beispiele

```python
def hello_world():
    print("Hallo Welt!")
```

### Bilder einfügen

Auch Bilder lassen sich einfügen:

![Beispielbild]({{ site.background_image | relative_url }}){: width="300px" height="auto"}
