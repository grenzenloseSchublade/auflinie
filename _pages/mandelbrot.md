---
title: "Die Welt der Fraktale"
excerpt: "Unendliche Muster aus einer einzigen Formel – interaktiv erkundbar, direkt im Browser."
permalink: /mandelbrot/
layout: single
author_profile: true
classes: 
  - wide
  - mandelbrot-page
  #- full-width-page
mathjax: true
fractal_panels: true
toc: true
toc_label: "Inhalt"
toc_icon: "list"
toc_collapse: true
header:
  overlay_image: /assets/images/background.jpg
  overlay_filter: 0.5
  caption: "In Echtzeit gerechnet"
  # Eigenes Vorschaubild beim Teilen statt des Site-Bilds (_config.yml og_image)
  og_image: /assets/images/mandelbrot-preview.jpg
  og_image_alt: "Ausschnitt der Mandelbrot-Menge mit spiralförmigen Ausläufern"
  actions:
    - label: "Interaktive Julia-Menge"
      url: "/mandelbrot/#julia-container"
    - label: "Mandelbrot-Julia-Explorer"
      url: "/mandelbrot/#explorer-container"
---

{% for section in site.data.mandelbrot.sections %}
{% assign heading_id = section.anchor | default: nil %}
{% unless heading_id %}{% assign heading_id = section.section | slugify %}{% endunless %}

{% unless section.intro %}
## <i class="fas fa-{{ section.icon }}" aria-hidden="true"></i> {{ section.section }}
{: id="{{ heading_id }}"}
{% endunless %}

{% comment %} nomarkdown (hier und bei den Unterabschnitten): markdownify hat den
Text schon gesetzt. Ohne die Klammer liest kramdown das Ergebnis ein zweites
Mal und macht aus dem Formelblock \[…\] einer Display-Formel in
_data/mandelbrot.yml ein „[…]“ (STYLEGUIDE MD-3). {% endcomment %}
{::nomarkdown}
{{ section.content | markdownify }}
{:/nomarkdown}

{% if section.include %}
  {% include {{ section.include }} %}
{% endif %}

{% if section.subsections %}
  {% for subsection in section.subsections %}
### {{ subsection.title }}

{::nomarkdown}
{{ subsection.content | markdownify }}
{:/nomarkdown}
  {% endfor %}
{% endif %}

{% endfor %}
