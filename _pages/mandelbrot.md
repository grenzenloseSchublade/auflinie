---
title: "Die Welt der Fraktale"
excerpt: "Unendliche Muster aus einer einzigen Formel — interaktiv erkundbar, direkt im Browser."
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
  caption: "Interaktive Erkundungen fraktaler Welten"
  actions:
    - label: "Interaktive Julia-Menge"
      url: "/mandelbrot/#julia-container"
    - label: "Mandelbrot-Julia-Explorer"
      url: "/mandelbrot/#explorer-container"
---

{% for section in site.data.mandelbrot.sections %}
{% assign heading_id = section.anchor | default: nil %}
{% unless heading_id %}{% assign heading_id = section.section | slugify %}{% endunless %}

## <i class="fas fa-{{ section.icon }}" aria-hidden="true"></i> {{ section.section }}
{: id="{{ heading_id }}"}

{{ section.content | markdownify }}

{% if section.include %}
  {% include {{ section.include }} %}
{% endif %}

{% if section.subsections %}
  {% for subsection in section.subsections %}
### {{ subsection.title }}

{{ subsection.content | markdownify }}
  {% endfor %}
{% endif %}

{% endfor %}
