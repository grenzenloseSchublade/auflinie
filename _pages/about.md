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

Beruflich und in eigenen Projekten dreht sich bei mir vieles um Technik, am liebsten dort, wo aus einer Idee etwas Greifbares wird, wie bei den [interaktiven Fraktalen]({{ '/mandelbrot/' | relative_url }}) oder im [Blog]({{ '/posts/' | relative_url }}). Den beruflichen Weg zeigt der [Lebenslauf]({{ '/cv/' | relative_url }}). In neue Themen tauche ich gern tief ein und verliere mich auch mal darin.

Auf dieser Seite geht es aber vor allem um das, was daneben passiert: ums Draußensein und darum, in Bewegung zu bleiben, um Ernährung, Schlaf und Ruhe. Dinge, die ich einfach gern tue.

<div class="about-motto-wrap">
  <p class="about-motto">anima sana in corpore sano</p>
</div>

## Achtsamkeit und Alltag

{% comment %} Quelle: Einsteins Gedanke steht in der Herbert-Spencer-Vorlesung „On the Method of Theoretical Physics“, Oxford, 10. 6. 1933. Die kurze Fassung ist eine Paraphrase, zuerst bei Roger Sessions, New York Times, 8. 1. 1950 (Quote Investigator, „Everything Should Be Made as Simple as Possible, But Not Simpler“, 2011, https://quoteinvestigator.com/2011/05/13/einstein-simple/). Deshalb „sinngemäß“ (FACH-3). {% endcomment %}
{% include section-epigraph.html text="Man sollte alles so einfach wie möglich machen, aber nicht einfacher." author="Albert Einstein (sinngemäß)" %}

Gesundheit entsteht im Alltag, aus vielen kleinen Entscheidungen: frisch kochen, bewusst durchatmen, rechtzeitig schlafen gehen. Meditation und Atemtechniken helfen mir, den Kopf zu sortieren. Vor allem sind sie ein Training darin, die eigene Aufmerksamkeit zu lenken.

## Sport und Bewegung

{% include section-epigraph.html text="Überzeugen durch Leistung." author="Unbekannt" %}

Am liebsten bin ich draußen unterwegs, mit dem Rad im Alltag und auf Reisen, wandernd in der Natur oder auf dem Wasser beim Stand-up-Paddling, Schwimmen und Surfen. Dort bekomme ich den Kopf am verlässlichsten frei. Der Rhythmus aus Strecke, Wetter und Anstrengung holt die Aufmerksamkeit aus dem Grübeln zurück ins Hier.

Dabei sammle ich Erlebnisse, die kein Fitnessstudio bieten kann: oben auf dem Pass anzukommen oder endlich die eine Welle zu erwischen.

## Yoga und Calisthenics

{% comment %} Quelle: keine. Sokrates hat nichts Schriftliches hinterlassen, bei Platon und Xenophon ist der Satz nicht belegt, im Netz wird er auch anderen zugeschrieben (etwa Philip Rosenthal). Inhaltlich am nächsten kommt Xenophon, Memorabilien 4,8,6, sinngemäß: Am besten leben die, die sich am meisten bemühen, möglichst gut zu werden. Deshalb „zugeschrieben“ (FACH-3). {% endcomment %}
{% include section-epigraph.html text="Wer glaubt, etwas zu sein, hat aufgehört, etwas zu werden." author="Sokrates (zugeschrieben)" %}

Yoga und Calisthenics sind meine regelmäßige Basis, und die beiden ergänzen sich gut. Calisthenics baut Kraft mit dem eigenen Körpergewicht auf, sauber und ohne Gerätepark. Yoga bringt Beweglichkeit, Balance und eine Ruhe, die Krafttraining allein nicht liefert.

Beides braucht Geduld, Fortschritt kommt in kleinen Schritten über Monate. Gerade das macht die Praxis für mich wertvoll. Was heute noch nicht klappt, ist mein nächstes Ziel.

## Was Medizin leisten kann und was nicht

{% comment %} Quelle: Paracelsus, Septem Defensiones, dritte Defension, 1538. Wortlaut sprachlich modernisiert, Original: „Alle ding sind gifft / vnd nichts ohn gifft / alleine die dosis macht das ein ding kein gifft ist.“ {% endcomment %}
{% include section-epigraph.html text="Alle Dinge sind Gift, und nichts ist ohne Gift; allein die Dosis macht, dass ein Ding kein Gift ist." author="Paracelsus" %}

Die moderne Medizin kann viel, vor allem wenn es akut wird. Bei vielen chronischen Beschwerden spielen aber auch Ernährung, Bewegung, Stress und Schlaf eine große Rolle, und dafür gibt es kein Rezept.

Ich nehme deshalb beides ernst, den ärztlichen Rat und meinen eigenen Teil. Dabei verlasse ich mich lieber auf Studien als auf Schlagzeilen.

## Kontakt

{% comment %} Kanäle und Kontaktkarten: author.links in _config.yml (contact: true) {% endcomment %}
{% assign kontakt = site.author.links | where: "contact", true | first %}
Austausch und Zusammenarbeit sind willkommen, am einfachsten über {{ kontakt.label }}.

{% include contact-cards.html %}
