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
expandable_lists: true
header:
  overlay_image: /assets/images/background.jpg
  overlay_filter: 0.5
  caption: "Akademischer und beruflicher Werdegang"
---

<div class="about-container">
{% for section in site.data.cv_content %}
<span id="{{ section.section | slugify }}" class="section-anchor"></span>
<div class="cv-section-about-style">
  <h2 id="{{ section.section | slugify }}-heading"><i class="fas fa-{{ section.icon }}"></i> {{ section.section }}</h2>
  
  <div class="cv-section-content">
    {% if section.content %}
    <p>{{ section.content | markdownify | remove: '<p>' | remove: '</p>' }}</p>
    {% endif %}
    
    {% if section.experiences %}
      <div class="cv-entries-container-about-style experiences-container">
        {% include cv-experience-about-style.html experiences=section.experiences %}
      </div>
    {% endif %}

    {% if section.education %}
      <div class="cv-entries-container-about-style">
        {% include cv-education-about-style.html educations=section.education %}
      </div>
    {% endif %}

    {% if section.skill_categories %}
      {% include cv-skills-about-style.html skill_categories=section.skill_categories %}
    {% endif %}

    {% if section.languages %}
      {% include cv-languages-about-style.html languages=section.languages %}
    {% endif %}

  </div>
</div>
{% endfor %}
</div> 