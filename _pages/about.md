---
title: "Über mich"
excerpt: "Ingenieur, Problemlöser, Autodidakt — wer hinter den Projekten steckt."
permalink: /about/
layout: single
classes: wide
author_profile: true
toc: false
header:
  overlay_image: /assets/images/background.jpg
  overlay_filter: 0.5
  caption: "Der Mensch hinter den Projekten"
---

<div class="about-container">
{% assign sections_by_name = site.data.about | group_by: "section" %}

<div class="about-intro">
  <details>
    <summary class="about-intro__summary">
      <div class="about-intro__icon">
        <i class="fas fa-file-alt" aria-hidden="true"></i>
      </div>
      <h3 class="about-intro__title">Über diese Seite – Entstehung und Philosophie</h3>
    </summary>
    <div class="about-intro__content">
      <p>
        Diese Seite dokumentiert Projekte, Experimente und Gedanken – entstanden aus der Überzeugung, dass technisches Wissen durch Teilen wertvoller wird.
        <br>
        <br>
        Der autodidaktische Ansatz prägt diese Arbeit: Für jedes Projekt eigne ich mir schrittweise die notwendigen Grundlagen an und gehe Herausforderungen so lange an, bis das gewünschte Ergebnis erreicht ist.
      </p>
    </div>
  </details>
</div>

{% for section in site.data.about %}
  {% if section.section != "Kontakt" and section.section != "Inspirierende Zitate" %}
    <div class="about-section {{ section.css_class }}">
      <h2 id="{{ section.section | slugify }}"><i class="fas fa-{{ section.icon }}" aria-hidden="true"></i> {{ section.section }}</h2>

      {% if section.intro %}
        <p>{{ section.intro }}</p>
      {% endif %}

      {% if section.content %}
        <p>{{ section.content }}</p>
      {% endif %}
      
      {% if section.interests %}
        {% include about-interests.html interests=section.interests %}
      {% endif %}
      
      {% if section.skills %}
        {% include about-skills.html skill_categories=section.skills %}
      {% endif %}
    </div>
  {% endif %}
{% endfor %}

<!-- Kontakt und Zitate nebeneinander -->
<div class="contact-quotes-container">
  {% for section in site.data.about %}
    {% if section.section == "Kontakt" or section.section == "Inspirierende Zitate" %}
      <div class="about-section">
        <h2 id="{{ section.section | slugify }}"><i class="fas fa-{{ section.icon }}" aria-hidden="true"></i> {{ section.section }}</h2>
        
        {% if section.content %}
          <p>{{ section.content }}</p>
        {% endif %}
        
        {% if section.contact_info %}
          <div class="contact-container">
            {% include about-contact.html contact_info=section.contact_info %}
          </div>
        {% endif %}
        
        {% if section.quote %}
          <div class="quote-container">
            <div class="quote-text">
              <p>"{{ section.quote.text }}"</p>
            </div>
            <div class="quote-author">
              <p>— {{ section.quote.author }}</p>
            </div>
          </div>
        {% endif %}
        
        {% if section.quotes %}
          <div class="quotes-container">
          {% for quote in section.quotes %}
            <div class="quote-container">
              <div class="quote-text">
                <p>"{{ quote.text }}"</p>
              </div>
              <div class="quote-author">
                <p>— {{ quote.author }}</p>
              </div>
            </div>
          {% endfor %}
          </div>
        {% endif %}
      </div>
    {% endif %}
  {% endfor %}
</div>
</div> 