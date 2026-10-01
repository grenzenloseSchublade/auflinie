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
 *
 * Persistent-Shell-Kontrakt (spa-nav.js, siehe README-spa-nav.md): mount auf
 * spa:load (idempotent), teardown auf spa:unload. Der Container-Click ist
 * element-scoped (stirbt mit dem DOM); die zwei DOKUMENTWEITEN Listener
 * (keydown, auflinie:skill-select) hängen an einem AbortController und werden
 * im Teardown gelöst — sonst leakten sie über Swaps.
 */
(function () {
  'use strict';

  const SOURCE = 'chips';
  let controller = null;   // dokumentweite Listener dieses Mounts

  function mount(root) {
    const scope = root || document;
    const container = scope.querySelector('.cv-skills');
    const dataTag = scope.querySelector('script[data-skill-graph-data]');
    const contextLine = scope.querySelector('[data-role="skill-context"]');
    if (!container || !dataTag || !contextLine) { return; }
    if (container.hasAttribute('data-skill-chips-init')) { return; }   // idempotent
    container.setAttribute('data-skill-chips-init', '');

    const data = window.SkillGraphData.parse(dataTag, 'skill-chips');
    if (!data) { return; }

    if (controller) { controller.abort(); }
    controller = new AbortController();
    const signal = { signal: controller.signal };

    // Basis-Skills (generische Dev-Infra): bewusst ohne Projektkanten
    const foundations = new Set(Array.isArray(data.foundations) ? data.foundations : []);

    const buttons = Array.prototype.slice.call(
      container.querySelectorAll('.cv-skill-chip__button[data-skill]')
    );
    const domSkills = new Set(buttons.map(function (btn) {
      return btn.getAttribute('data-skill');
    }));

    // Skill-ID → Projekte (gemeinsamer Aufbau, warnt bei fehlenden
    // Pflichtfeldern und bei Skills, die keinen DOM-Chip haben)
    const skillProjects = window.SkillGraphData.buildSkillProjects(data.projects, {
      prefix: 'skill-chips',
      knownIds: domSkills
    }).map;

    const defaultText = contextLine.textContent;
    let selected = null;

    // Strukturierte Anzeige statt Komma-Fließtext: Skill als Mono-Label
    // (Formensprache der Gruppen-Titel), Projekte darunter mit ·-Trennern.
    // Aufbau per DOM-Knoten (kein innerHTML mit Datenwerten); aria-live
    // liest die Region weiterhin als einen zusammenhängenden Satz vor.
    function renderContext(label, projects, kind) {
      contextLine.textContent = '';

      const labelEl = document.createElement('span');
      labelEl.className = 'cv-skills__selection-skill';
      labelEl.textContent = label;
      contextLine.appendChild(labelEl);

      const roleEl = document.createElement('span');
      roleEl.className = 'cv-skills__selection-rolle';
      if (projects.length) {
        roleEl.textContent = ' – gemeinsam im Einsatz bei';
      } else if (kind === 'foundation') {
        roleEl.textContent = ' – Basis-Werkzeug, quer durch fast alle Projekte im Einsatz.';
      } else {
        roleEl.textContent = ' – Teil des Werkzeugkastens, ohne feste Projektzuordnung.';
      }
      contextLine.appendChild(roleEl);

      if (projects.length) {
        contextLine.appendChild(document.createElement('br'));
        const listEl = document.createElement('span');
        listEl.className = 'cv-skills__selection-projekte';
        listEl.textContent = projects.map(function (project) {
          return project.label;
        }).join(' · ');
        contextLine.appendChild(listEl);
      }
    }

    function applySelection(skillId) {
      const projects = skillProjects.get(skillId) || [];
      const hasProjects = projects.length > 0;
      const related = new Set();
      if (hasProjects) {
        projects.forEach(function (project) {
          project.skills.forEach(function (id) { related.add(id); });
        });
      }

      let selectedLabel = '';
      buttons.forEach(function (btn) {
        const id = btn.getAttribute('data-skill');
        const chip = btn.closest('.cv-skill-chip');
        const isSelected = id === skillId;
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
        const chip = btn.closest('.cv-skill-chip');
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

    // Element-scoped (Container lebt in .initial-content) -> stirbt mit dem DOM.
    container.addEventListener('click', function (event) {
      const btn = event.target.closest('.cv-skill-chip__button');
      if (!btn) { return; }
      const skillId = btn.getAttribute('data-skill');
      if (selected === skillId) { clearSelection(); } else { applySelection(skillId); }
      dispatch();
    }, signal);

    // DOKUMENTWEIT -> an den AbortController (Teardown auf spa:unload).
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && selected !== null) {
        clearSelection();
        dispatch();
      }
    }, signal);

    // Lose Kopplung: Auswahl aus anderen Ansichten übernehmen (ohne Re-Dispatch)
    document.addEventListener('auflinie:skill-select', function (event) {
      if (!event.detail || event.detail.source === SOURCE) { return; }
      if (event.detail.skill === null) {
        if (selected !== null) { clearSelection(); }
      } else if (event.detail.skill !== selected) {
        applySelection(event.detail.skill);
      }
    }, signal);
  }

  function teardown() { if (controller) { controller.abort(); controller = null; } }

  window.spaModule({ mount: mount, teardown: teardown });
})();
