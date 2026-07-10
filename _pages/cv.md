---
title: "Lebenslauf"
excerpt: "Elektrotechnik, eingebettete Systeme — und am Ende des Studiums kam Machine Learning dazu. Geblieben ist es seitdem."
permalink: /cv/
layout: single
author_profile: true
toc: true
toc_label: "Inhalt"
toc_icon: "list"
toc_sticky: true
toc_collapse: true
header:
  overlay_image: /assets/images/background.jpg
  overlay_filter: 0.5
  caption: "Stand: Juli 2026"
show_date: false
read_time: false
# Interaktives Skill-Feature (siehe _includes/cv/skills.html):
#   enabled = Klick-Hervorhebung, stage2 = experimentelles Graph-Panel
skill_graph:
  enabled: true
  stage2: true
---

<div class="about-container">
{% for section in site.data.cv_content %}
<div class="cv-section">
  {% unless section.intro %}
  <h2 id="{{ section.section | slugify }}"><i class="fas fa-{{ section.icon }}" aria-hidden="true"></i> {{ section.section }}</h2>
  {% endunless %}

  <div class="cv-section__content">
    {% if section.content %}
    <p>{{ section.content | markdownify | remove: '<p>' | remove: '</p>' }}</p>
    {% endif %}

    {% if section.experiences %}
      <ol class="cv-entries" aria-label="Beruflicher Werdegang, neueste zuerst">
        {% for experience in section.experiences %}
          {% include cv/entry.html title=experience.position org=experience.company location=experience.location period=experience.period description=experience.description items=experience.responsibilities items_label="Verantwortlichkeiten:" expandable=experience.expandable %}
        {% endfor %}
      </ol>
    {% endif %}

    {% if section.education %}
      <ol class="cv-entries" aria-label="Akademischer Werdegang, neueste zuerst">
        {% for education in section.education %}
          {% include cv/entry.html title=education.degree org=education.institution location=education.location period=education.period description=education.description items=education.achievements items_label="Besondere Erfolge:" expandable=education.expandable %}
        {% endfor %}
      </ol>
    {% endif %}

    {% if section.skill_groups %}
      {% include cv/skills.html skill_groups=section.skill_groups %}
    {% endif %}

    {% if section.languages %}
      {% include cv/languages.html languages=section.languages %}
    {% endif %}

  </div>
</div>
{% endfor %}
</div>
