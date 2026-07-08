/**
 * Skill-Chips — Klick-Hervorhebung (Stufe 1 des Skill-Features)
 *
 * Zuständigkeit: macht die Chip-Liste auf /cv/ interaktiv. Klick auf einen
 * Skill hebt alle über gemeinsame Projekte verbundenen Skills hervor und
 * zeigt die Projekte in der Kontextzeile; zweiter Klick oder Escape löst.
 *
 * Daten: _data/skill_graph.yml (Schema v1), als JSON-Tag
 * [data-skill-graph-data] im Markup (siehe _includes/cv/skills.html).
 * Kanten Skill↔Skill entstehen hier implizit über gemeinsame Projekte.
 *
 * Erweiterungspunkte:
 * - Event-Vertrag `auflinie:skill-select` (detail: {skill, source}) —
 *   andere Ansichten (z. B. das Graph-Panel, Stufe 2) synchronisieren sich
 *   darüber lose; eigener source-Wert ist 'chips', fremde Events werden
 *   ohne Re-Dispatch übernommen.
 * - Die Auswahl-Optik lebt vollständig im CSS (Zustände: .has-selection am
 *   Container, .is-selected/.is-related am Chip).
 */
(function () {
  'use strict';

  var SOURCE = 'chips';

  function parseData(tag) {
    var data;
    try {
      data = JSON.parse(tag.textContent);
    } catch (e) {
      console.warn('skill-chips: skill_graph-Daten nicht lesbar', e);
      return null;
    }
    if (!data || data.version !== 1 || !Array.isArray(data.projects)) {
      console.warn('skill-chips: unbekanntes skill_graph-Schema (erwartet version: 1)');
      return null;
    }
    return data;
  }

  function init() {
    var container = document.querySelector('.cv-skills');
    var dataTag = document.querySelector('script[data-skill-graph-data]');
    var contextLine = document.querySelector('[data-role="skill-context"]');
    if (!container || !dataTag || !contextLine) { return; }

    var data = parseData(dataTag);
    if (!data) { return; }

    // Skill-ID → Projekte (Pflichtfelder defensiv prüfen)
    var skillProjects = new Map();
    data.projects.forEach(function (project) {
      if (!project || !project.id || !project.label || !Array.isArray(project.skills)) {
        console.warn('skill-chips: Projekt ohne Pflichtfelder übersprungen', project);
        return;
      }
      project.skills.forEach(function (skillId) {
        if (!skillProjects.has(skillId)) { skillProjects.set(skillId, []); }
        skillProjects.get(skillId).push(project);
      });
    });

    var buttons = Array.prototype.slice.call(
      container.querySelectorAll('.cv-skill-chip__button[data-skill]')
    );
    var domSkills = new Set(buttons.map(function (btn) {
      return btn.getAttribute('data-skill');
    }));

    // Konsistenz-Warnung: Daten und Chips dürfen nicht auseinanderlaufen
    skillProjects.forEach(function (_projects, skillId) {
      if (!domSkills.has(skillId)) {
        console.warn('skill-chips: skill_graph.yml referenziert unbekannten Skill "' + skillId + '"');
      }
    });

    var defaultText = contextLine.textContent;
    var selected = null;

    function applySelection(skillId) {
      var projects = skillProjects.get(skillId) || [];
      var related = new Set();
      projects.forEach(function (project) {
        project.skills.forEach(function (id) { related.add(id); });
      });

      var selectedLabel = '';
      buttons.forEach(function (btn) {
        var id = btn.getAttribute('data-skill');
        var chip = btn.closest('.cv-skill-chip');
        var isSelected = id === skillId;
        if (isSelected) { selectedLabel = btn.textContent.trim(); }
        btn.setAttribute('aria-pressed', String(isSelected));
        chip.classList.toggle('is-selected', isSelected);
        chip.classList.toggle('is-related', !isSelected && related.has(id));
      });
      container.classList.add('has-selection');

      if (projects.length) {
        contextLine.textContent = selectedLabel + ' — gemeinsam im Einsatz bei: ' +
          projects.map(function (project) { return project.label; }).join(', ');
      } else {
        contextLine.textContent = selectedLabel + ' — noch keine Projektzuordnung hinterlegt.';
      }
      selected = skillId;
    }

    function clearSelection() {
      buttons.forEach(function (btn) {
        btn.setAttribute('aria-pressed', 'false');
        var chip = btn.closest('.cv-skill-chip');
        chip.classList.remove('is-selected', 'is-related');
      });
      container.classList.remove('has-selection');
      contextLine.textContent = defaultText;
      selected = null;
    }

    function dispatch() {
      document.dispatchEvent(new CustomEvent('auflinie:skill-select', {
        detail: { skill: selected, source: SOURCE }
      }));
    }

    container.addEventListener('click', function (event) {
      var btn = event.target.closest('.cv-skill-chip__button');
      if (!btn) { return; }
      var skillId = btn.getAttribute('data-skill');
      if (selected === skillId) { clearSelection(); } else { applySelection(skillId); }
      dispatch();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && selected !== null) {
        clearSelection();
        dispatch();
      }
    });

    // Lose Kopplung: Auswahl aus anderen Ansichten übernehmen (ohne Re-Dispatch)
    document.addEventListener('auflinie:skill-select', function (event) {
      if (!event.detail || event.detail.source === SOURCE) { return; }
      if (event.detail.skill === null) {
        if (selected !== null) { clearSelection(); }
      } else if (event.detail.skill !== selected) {
        applySelection(event.detail.skill);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
