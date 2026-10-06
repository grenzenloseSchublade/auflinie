---
title: "Datenschutz"
excerpt: "Welche Daten beim Besuch dieser Website anfallen, wer sie verarbeitet und welche Rechte daraus folgen."
permalink: /datenschutz/
author_profile: false
toc: false
show_date: false
read_time: false
---

{% comment %}
  Datenschutzerklärung (STYLEGUIDE SEC-10a). Neue Datenverarbeitungen kommen
  im selben Commit hierher, „Stand“ am Ende mitziehen (docs/pflege.md).
  Abgleich mit dem Code am 6. 10. 2026, Schlüssel und Quellen:
  localStorage: auflinie:<toc-id>-state (toc.js, übernimmt und entfernt
  einmalig den alten Schlüssel ohne Präfix), auflinie:blog-notice-dismissed:<id>
  (blog-notice.js), MathJax-Menu-Settings (MathJax, nur nach einer Änderung
  im Kontextmenü einer Formel). sessionStorage: auflinie:hero-crt:boot und
  auflinie:hero-crt:power-hinted (hero-crt.js), auflinie:graph-touch-hinted
  (skill-graph-sheet.js), auflinie:tv-switch:state (tv-switch.js schreibt,
  head-early.js liest und löscht) und auflinie:tv-switch:last-crt
  (tv-switch.js). CacheStorage: sw_cache_prefix aus _config.yml plus
  Build-Zeit (service-worker.js). Fremde Hosts beim Aufruf: keine (CSP in
  _includes/head.html, alle Quellen 'self').
{% endcomment %}
{%- assign kontakte = site.author.links | where: "contact", true -%}

Diese Website kommt ohne Statistik, ohne Cookies und ohne eingebundene Inhalte fremder Anbieter aus. Schriften, Formeln und Bilder liegen auf demselben Server wie die Seiten. Ganz ohne Daten geht es trotzdem nicht, denn jeder Aufruf läuft über einen Server. Was dabei passiert, steht hier.

## Verantwortlich

Verantwortlich für diese Website bin ich, {{ site.author.name }}. Erreichbar bin ich über {% for link in kontakte %}{% unless forloop.first %}{% if forloop.last %} oder {% else %}, {% endif %}{% endunless %}[{{ link.label }}{% if link.handle %} ({{ link.handle }}){% endif %}]({{ link.url }}){% endfor %}.

## Hosting bei GitHub Pages

Die Website liegt bei GitHub Pages, einem Dienst der GitHub, Inc. in den USA. Bei jedem Aufruf erfassen deren Server technisch nötige Angaben: die IP-Adresse, die aufgerufene Adresse, Datum und Uhrzeit sowie die Browserkennung. Das gilt für jede Datei, die der Browser lädt, auch für verlinkte Seiten, die er vorab holt, damit ein Seitenwechsel schneller geht.

GitHub protokolliert laut [eigener Dokumentation](https://docs.github.com/de/pages/getting-started-with-github-pages/about-github-pages#data-collection) die IP-Adresse jedes Besuchers zu Sicherheitszwecken und speichert sie. Wie lange, legt GitHub fest. Ich kann diese Protokolle weder einsehen noch abschalten.

Zweck ist die sichere und stabile Auslieferung der Website, Rechtsgrundlage mein berechtigtes Interesse daran (Art. 6 Abs. 1 lit. f DSGVO). Ohne diese Angaben kann kein Server eine Seite ausliefern, sie sind für den Aufruf also nötig. GitHub ist nach dem EU-US Data Privacy Framework zertifiziert, für die Übermittlung in die USA gilt deshalb der Angemessenheitsbeschluss der EU-Kommission (Art. 45 DSGVO). Einzelheiten stehen in der [Datenschutzerklärung von GitHub](https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement).

## Speicher im Browser

Einige Bedienzustände merkt sich die Seite im Speicher des Browsers (localStorage und sessionStorage). Sie enthalten keine Kennung und nichts Persönliches und verlassen das Gerät nicht.

Bis zum Löschen im Browser bleiben:

- ob das Inhaltsverzeichnis einer Seite auf- oder zugeklappt ist
- ob ein Hinweis über der Blog-Übersicht schon geschlossen wurde
- Einstellungen im Kontextmenü der Formeln (MathJax), aber nur, wenn dort jemand etwas umstellt

Mit dem Schließen des Tabs enden:

- ob die Einschaltanimation des Titelbilds und der Hinweis auf den Einschaltknopf schon liefen
- ob der Bedienhinweis im Skill-Graphen schon erschien
- der Übergangseffekt beim Seitenwechsel (Zielseite und Zeitpunkt, nach wenigen Sekunden verworfen) und wann der Kanalwechsel-Effekt zuletzt lief

## Offline-Speicher

Beim ersten Besuch legt die Seite im Browser einen Offline-Speicher an (Service Worker). Der Browser lädt dafür die Seiten und Dateien dieser Website im Hintergrund und bewahrt sie auf, damit sie schneller laden und auch ohne Netz erreichbar bleiben. Darin liegen nur öffentliche Dateien der Website, nichts über den Besucher. Mit jeder neuen Fassung der Website ersetzt die Seite den alten Bestand.

Die gemerkten Bedienzustände und der Offline-Speicher dienen allein dazu, die aufgerufene Seite anzuzeigen und bedienbar zu halten (§ 25 Abs. 2 Nr. 2 TDDDG).

Entfernen lässt sich alles in den Browsereinstellungen, über die Websitedaten von grenzenloseschublade.github.io. Diese Adresse teilt sich die Website mit anderen Projekten desselben GitHub-Kontos, und Browser trennen gespeicherte Daten nach Adresse, nicht nach Projekt. Das Löschen entfernt deshalb auch deren Einträge.

## Links zu anderen Websites

Links etwa zu GitHub oder LinkedIn laden erst beim Anklicken etwas von dort. Ab dann gilt die Datenschutzerklärung des jeweiligen Anbieters.

## Rechte

Jeder Besucher hat das Recht auf Auskunft über die Daten zu seiner Person (Art. 15 DSGVO), auf Berichtigung (Art. 16), Löschung (Art. 17) und Einschränkung der Verarbeitung (Art. 18) und kann der Verarbeitung widersprechen (Art. 21). Ich selbst speichere keine Daten über Besucher. Anfragen zu den Protokollen bei GitHub leite ich an GitHub weiter, sie lassen sich auch direkt dorthin richten. Automatisierte Entscheidungen oder Profilbildung gibt es nicht.

Außerdem besteht das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren (Art. 77 DSGVO), etwa bei der für mich zuständigen Behörde in Nordrhein-Westfalen ([LDI NRW](https://www.ldi.nrw.de/)) oder bei der Behörde am eigenen Wohnort.

Stand: 6. Oktober 2026
