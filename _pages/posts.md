---
title: "Blog"
excerpt: "Projekte, Gedanken und technische Experimente."
permalink: /posts/
layout: single
author_profile: false
pagination:
  enabled: true
  collection: posts
  per_page: 6
  sort_field: "date"
  sort_reverse: true
header:
  overlay_image: /assets/images/background.jpg
  overlay_filter: 0.5
  caption: "Einblicke und Experimente"
show_date: false
read_time: false
---

{{ "Hier finden Sie Beiträge zu Technik, Projekten und dem, was mich gerade beschäftigt. Ohne festen Rhythmus – dafür mit dem Anspruch, dass jeder Beitrag einen Mehrwert bietet." | markdownify }}

<div class="guide-banner">
  <i class="fas fa-file-alt guide-banner__icon" aria-hidden="true"></i>
  <p class="guide-banner__text"><strong>Neu hier?</strong> Der Leitfaden erklärt Technik, Stil und Prozess hinter den Blogbeiträgen.</p>
  <a href="{{ "/posts/blogbeitrag-erstellen/" | relative_url }}" class="btn btn--outline guide-banner__btn">Zum Leitfaden <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
</div>

<div class="category-filter-container">
  <div class="blog-filter-row">
    <input id="blog-search-input" class="blog-search-input" type="search" placeholder="Beiträge auf dieser Seite durchsuchen..." aria-label="Blogsuche">
    <button id="blog-search-clear" class="btn btn--outline" type="button">Zurücksetzen</button>
    <a href="{{ '/archiv/' | relative_url }}" class="btn blog-archive-button">Archiv</a>
  </div>
</div>

<div class="entries-{{ site.entries_layout | default: 'list' }} post-card-list" id="blog-entries">
  {% for post in paginator.posts %}
    <div class="post-item" data-search="{{ post.title | strip | downcase }} {{ post.excerpt | strip | downcase }}">
      {% include archive-single.html %}
    </div>
  {% endfor %}
</div>

<div id="blog-empty-message" class="notice notice--warning blog-empty-message">
  <p><i class="fas fa-exclamation-circle"></i> Keine Beiträge für diese Suche gefunden.</p>
</div>

{% include paginator.html %}