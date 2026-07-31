---
title: "Blog"
excerpt: "Notizen aus Technik und Alltag — was ich baue, lerne und ausprobiere."
permalink: /posts/
blog_search: true
blog_notice:
  enabled: true
  id: "sommerpause-2026"
  title: "Sommerpause"
  text: "Aktuell entstehen keine neuen Beiträge — die bestehenden Inhalte bleiben natürlich verfügbar."
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
  caption: "Ohne festen Rhythmus"
show_date: false
read_time: false
---

{{ "Dieser Blog ist eine Sammelstelle für Themen, die mich nicht loslassen — von technischen Fragen aus der täglichen Arbeit bis zu Gedanken, die weit darüber hinausgehen. Mal geht es um das Wie hinter einer Lösung, mal um das Warum dahinter, mal einfach um etwas, das ich spannend fand und teilen wollte. Verschiedene Bereiche, verschiedene Blickwinkel — lose verbunden durch die Neugier dahinter." | markdownify }}

{% include blog-notice.html %}

<div class="guide-banner">
  <i class="fas fa-file-alt guide-banner__icon" aria-hidden="true"></i>
  <p class="guide-banner__text"><strong>Neu hier?</strong> Der Leitfaden zeigt, wie die Beiträge hier technisch entstehen. Und wer selbst einen Artikel schreiben möchte, kann ihn nach kurzer Absprache veröffentlichen — Kontakt am einfachsten über <a href="https://github.com/grenzenloseSchublade" target="_blank" rel="noopener noreferrer">GitHub</a>.</p>
  <a href="{{ "/posts/blogbeitrag-erstellen/" | relative_url }}" class="btn btn--outline guide-banner__btn">Zum Leitfaden <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
</div>

<div class="category-filter-container">
  <div class="blog-filter-row">
    <input id="blog-search-input" class="blog-search-input" type="search" placeholder="Beiträge auf dieser Seite durchsuchen..." aria-label="Blogsuche">
    <button id="blog-search-clear" class="btn btn--outline" type="button">Zurücksetzen</button>
    <a href="{{ '/archiv/' | relative_url }}" class="btn btn--outline">Archiv</a>
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