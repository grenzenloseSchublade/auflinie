---
title: "Über mich"
excerpt: "Arbeit nimmt viel Zeit ein, aber nicht den ganzen Menschen."
permalink: /about/
layout: single
author_profile: true
toc: false
header:
  overlay_image: /assets/images/background.jpg
  overlay_filter: 0.5
  caption: "Abseits vom Schreibtisch"
person_schema: true # JSON-LD Person (head/custom.html)
---

Beruflich dreht sich bei mir vieles um Technik – am liebsten dort, wo aus einer Idee etwas Greifbares wird, wie bei den [interaktiven Fraktalen]({{ '/mandelbrot/' | relative_url }}) oder im [Blog]({{ '/posts/' | relative_url }}). In neue Themen tauche ich gern tief ein – und verliere mich auch mal darin.

Auf dieser Seite geht es aber vor allem um das, was daneben passiert: ums Draußensein und darum, in Bewegung zu bleiben, um Ernährung, Schlaf und Ruhe. Dinge, die ich einfach gerne tue.

<div class="about-motto-wrap">
  <p class="about-motto">anima sana in corpore sano</p>
</div>

## Achtsamkeit und Alltag

{% include section-epigraph.html text="Man sollte alles so einfach wie möglich machen, aber nicht einfacher." author="Albert Einstein" %}

Gesundheit ist kein Projekt mit Endtermin, sondern eine tägliche Praxis aus vielen kleinen Entscheidungen: frisch kochen statt bestellen, bewusst atmen statt durchhetzen, ausreichend schlafen statt noch eine Stunde Bildschirm. Meditation und Atemtechniken helfen, den Kopf zu sortieren – nicht als Ritual um seiner selbst willen, sondern als trainierbare Fähigkeit, Aufmerksamkeit zu lenken.

## Sport und Bewegung

{% include section-epigraph.html text="Überzeugen durch Leistung." author="Unbekannt" %}

Am liebsten draußen: mit dem Rad unterwegs – im Alltag wie auf Reisen –, wandernd in der Natur oder auf dem Wasser beim Stand-Up-Paddling, Schwimmen und Surfen. Bewegung im Freien ist die verlässlichste Art, den Kopf freizubekommen: Der Rhythmus aus Strecke, Wetter und Anstrengung holt die Aufmerksamkeit aus dem Grübeln zurück ins Hier.

Nebenbei entsteht dabei, was kein Training im Studio ersetzt: echte Erlebnisse – von der Passhöhe bis zur richtigen Welle.

## Yoga und Calisthenics

{% include section-epigraph.html text="Wer glaubt etwas zu sein, hat aufgehört etwas zu werden." author="Sokrates" %}

Yoga und Calisthenics sind die regelmäßige Basis – zwei Praxen, die sich ergänzen: Calisthenics baut Kraft mit dem eigenen Körpergewicht auf, sauber und ohne Gerätepark. Yoga bringt Beweglichkeit, Balance und die Ruhe, die harte Sätze allein nicht liefern.

Beides belohnt vor allem eines: Geduld. Fortschritt kommt in kleinen Schritten über Monate, nicht über Nacht. Genau das macht die Praxis wertvoll – sie ist ein ehrlicher Spiegel: Was heute nicht geht, zeigt, woran zu arbeiten sich lohnt.

## Was Medizin leisten kann – und was nicht

{% include section-epigraph.html text="Alle Dinge sind Gift, und nichts ist ohne Gift; allein die Dosis macht, dass ein Ding kein Gift ist." author="Paracelsus" %}

Die moderne Medizin ist beeindruckend, wo sie stark ist: in der Akutversorgung, der Diagnostik, der Chirurgie. Zugleich stößt sie dort an Grenzen, wo Gesundheit nicht repariert, sondern gelebt werden muss – bei chronischen Beschwerden, deren Ursachen in Ernährung, Bewegung, Stress und Schlaf liegen. Ein Rezept ist schneller ausgestellt als eine Lebensweise geändert – behandelt wird damit aber oft nur das Symptom. Und es fällt leichter, Verantwortung abzugeben, als sie dauerhaft selbst zu tragen.

Daraus folgt keine Ablehnung der Schulmedizin, sondern eine Arbeitsteilung: kritisch nachfragen, Studienlage statt Schlagzeilen – und den Teil selbst übernehmen, den keine Praxis verschreiben kann: den eigenen Alltag.

## Kontakt

{% comment %} Kanäle und Kontaktkarten: author.links in _config.yml (contact: true) {% endcomment %}
{% assign kontakt = site.author.links | where: "contact", true | first %}
Austausch und Zusammenarbeit sind willkommen – am einfachsten über {{ kontakt.label }}.

{% include contact-cards.html %}
