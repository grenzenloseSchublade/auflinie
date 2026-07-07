---
title: "Curriculum Vitae"
excerpt: "Elektrotechnik, Eingebettete Systeme, Machine Learning – ein Werdegang zwischen Theorie und Praxis"
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
  caption: "Akademischer und beruflicher Werdegang"
---

<div class="about-container">
{% for section in site.data.cv_content %}
<div class="cv-section">
  <h2 id="{{ section.section | slugify }}"><i class="fas fa-{{ section.icon }}" aria-hidden="true"></i> {{ section.section }}</h2>

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

    {% if section.skill_categories %}
      {% include cv/skills.html skill_categories=section.skill_categories %}
    {% endif %}

    {% if section.languages %}
      {% include cv/languages.html languages=section.languages %}
    {% endif %}

  </div>
</div>
{% endfor %}
</div>
