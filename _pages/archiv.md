---
title: "Archiv"
excerpt: "Alle Blogbeiträge chronologisch nach Jahren."
permalink: /archiv/
layout: single
author_profile: false
header:
  overlay_image: /assets/images/background.jpg
  overlay_filter: 0.5
  # Zahl bewusst ohne: bei wenigen Beiträgen arbeitet sie gegen die Seite.
  # Ab ca. 15–20 Beiträgen: caption: "%POST_COUNT% Beiträge seit 2025"
  caption: "Seit 2025"
show_date: false
read_time: false
---

Das Archiv sammelt alle Beiträge nach Jahren gruppiert. Die neuesten Beiträge mit Pagination stehen in der Blog‑Übersicht.

<div class="category-filter-container">
  <span class="filter-label">Jahresübersicht:</span>
  <div class="category-buttons archive-filter-buttons">
    {% assign postsByYear = site.posts | group_by_exp: 'post', 'post.date | date: "%Y"' %}
    {% for year in postsByYear %}
      <a href="#year-{{ year.name }}" class="btn btn--primary">{{ year.name }}</a>
    {% endfor %}
  </div>
  <div class="archive-nav-actions">
    <a href="{{ '/posts/' | relative_url }}" class="btn btn--outline">Zur Blog‑Übersicht</a>
  </div>
</div>

{% assign postsByYear = site.posts | group_by_exp: 'post', 'post.date | date: "%Y"' %}
{% for year in postsByYear %}
  <section id="year-{{ year.name }}" class="taxonomy__section">
    <h2 class="archive__subtitle">{{ year.name }}</h2>
    <div class="entries-{{ site.entries_layout | default: 'list' }} post-card-list">
      {% for post in year.items %}
        {% include archive-single.html %}
      {% endfor %}
    </div>
  </section>
{% endfor %}
