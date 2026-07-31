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

    // Basis-Skills (generische Dev-Infra): bewusst ohne Projektkanten
    var foundations = new Set(Array.isArray(data.foundations) ? data.foundations : []);

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

    // Strukturierte Anzeige statt Komma-Fließtext: Skill als Mono-Label
    // (Formensprache der Gruppen-Titel), Projekte darunter mit ·-Trennern.
    // Aufbau per DOM-Knoten (kein innerHTML mit Datenwerten); aria-live
    // liest die Region weiterhin als einen zusammenhängenden Satz vor.
    function renderContext(label, projects, kind) {
      contextLine.textContent = '';

      var labelEl = document.createElement('span');
      labelEl.className = 'cv-skills__selection-skill';
      labelEl.textContent = label;
      contextLine.appendChild(labelEl);

      var roleEl = document.createElement('span');
      roleEl.className = 'cv-skills__selection-rolle';
      if (projects.length) {
        roleEl.textContent = ' — gemeinsam im Einsatz bei';
      } else if (kind === 'foundation') {
        roleEl.textContent = ' — Basis-Werkzeug, quer durch fast alle Projekte im Einsatz.';
      } else {
        roleEl.textContent = ' — Teil des Werkzeugkastens, ohne feste Projektzuordnung.';
      }
      contextLine.appendChild(roleEl);

      if (projects.length) {
        contextLine.appendChild(document.createElement('br'));
        var listEl = document.createElement('span');
        listEl.className = 'cv-skills__selection-projekte';
        listEl.textContent = projects.map(function (project) {
          return project.label;
        }).join(' · ');
        contextLine.appendChild(listEl);
      }
    }

    function applySelection(skillId) {
      var projects = skillProjects.get(skillId) || [];
      var hasProjects = projects.length > 0;
      var related = new Set();
      if (hasProjects) {
        projects.forEach(function (project) {
          project.skills.forEach(function (id) { related.add(id); });
        });
      }

      var selectedLabel = '';
      buttons.forEach(function (btn) {
        var id = btn.getAttribute('data-skill');
        var chip = btn.closest('.cv-skill-chip');
        var isSelected = id === skillId;
        if (isSelected) { selectedLabel = btn.textContent.trim(); }
        btn.setAttribute('aria-pressed', String(isSelected));
        chip.classList.toggle('is-selected', isSelected);
        chip.classList.toggle('is-related', hasProjects && !isSelected && related.has(id));
      });
      // Nur dimmen, wenn es echte Verwandtschaft gibt; Basis-/Einzel-Skills
      // ohne Projektkanten lassen die übrigen Chips unberührt.
      container.classList.toggle('has-selection', hasProjects);

      renderContext(selectedLabel, projects, foundations.has(skillId) ? 'foundation' : 'plain');
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
