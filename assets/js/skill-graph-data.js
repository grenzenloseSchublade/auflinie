/**
 * skill-graph-data.js — gemeinsame Helfer des Skill-Features.
 *
 * Vorher lebten parseData und der Skill→Projekte-Map-Aufbau als wortgleiche
 * Kopien in skill-chips.js und skill-graph.js. renderSelection schreibt die
 * Auswahl-Anzeige (Konsole über den Chips, Info-Leiste im Graph-Sheet) und
 * braucht dafür als einziger Helfer das DOM (document.createElement).
 *
 * Ladereihenfolge: per defer VOR skill-chips.js bzw. skill-graph*.js
 * (_includes/scripts.html).
 */
(function (global) {
  'use strict';

  global.SkillGraphData = {
    /**
     * JSON-Tag [data-skill-graph-data] lesen und Schema prüfen.
     * @param {Element} tag     das script-Tag mit den Daten
     * @param {string}  prefix  Warn-Präfix des Aufrufers (z.B. 'skill-chips')
     * @returns {Object|null}
     */
    parse: function (tag, prefix) {
      let data;
      try {
        data = JSON.parse(tag.textContent);
      } catch (e) {
        console.warn(prefix + ': skill_graph-Daten nicht lesbar', e);
        return null;
      }
      if (!data || data.version !== 1 || !Array.isArray(data.projects)) {
        console.warn(prefix + ': unbekanntes skill_graph-Schema (erwartet version: 1)');
        return null;
      }
      return data;
    },

    /**
     * Skill-ID → [Projekte] aufbauen. Projekte ohne Pflichtfelder (id, label,
     * skills) werden mit Warnung übersprungen. Mit knownIds (Set) werden
     * unbekannte Skill-IDs gewarnt und herausgefiltert.
     * @returns {{ map: Map, projects: Array<{project: Object, ids: string[]}> }}
     *          projects = bereinigte Projektliste (für Kanten-Aufbau o.ä.)
     */
    buildSkillProjects: function (projects, opts) {
      const prefix = (opts && opts.prefix) || 'skill-graph';
      const knownIds = opts && opts.knownIds;
      const map = new Map();
      const cleaned = [];
      projects.forEach(function (project) {
        if (!project || !project.id || !project.label || !Array.isArray(project.skills)) {
          console.warn(prefix + ': Projekt ohne Pflichtfelder übersprungen', project);
          return;
        }
        const ids = project.skills.filter(function (id) {
          if (knownIds && !knownIds.has(id)) {
            console.warn(prefix + ': skill_graph.yml referenziert unbekannten Skill "' + id + '"');
            return false;
          }
          return true;
        });
        ids.forEach(function (id) {
          if (!map.has(id)) { map.set(id, []); }
          map.get(id).push(project);
        });
        cleaned.push({ project: project, ids: ids });
      });
      return { map: map, projects: cleaned };
    },

    /**
     * Auswahl-Anzeige im Konsolen-Format schreiben: Skill als Mono-Label,
     * Rolle, darunter die Projekte mit „ · “-Trennern. EINE Quelle für die
     * Konsole über den Chips (skill-chips.js) und die Info-Leiste im Graph-
     * Sheet (skill-graph.js), damit beide exakt gleich aussehen und lesen.
     * Aufbau per DOM-Knoten (kein innerHTML mit Datenwerten, SEC-1); aria-live
     * am Ziel liest die Region als einen zusammenhängenden Satz vor.
     * @param {Element} el        Ziel (Inhalt wird ersetzt)
     * @param {string}  label     Anzeigename des Skills
     * @param {Array<{label: string}>} projects  Projekte des Skills
     * @param {string}  kind      'foundation' (Basis-Werkzeug) oder 'plain'
     */
    renderSelection: function (el, label, projects, kind) {
      el.textContent = '';

      const labelEl = document.createElement('span');
      labelEl.className = 'cv-skills__selection-skill';
      labelEl.textContent = label;
      el.appendChild(labelEl);

      const roleEl = document.createElement('span');
      roleEl.className = 'cv-skills__selection-rolle';
      if (projects.length) {
        roleEl.textContent = ' – gemeinsam im Einsatz bei';
      } else if (kind === 'foundation') {
        roleEl.textContent = ' – Basis-Werkzeug, quer durch fast alle Projekte im Einsatz.';
      } else {
        roleEl.textContent = ' – Teil des Werkzeugkastens, ohne feste Projektzuordnung.';
      }
      el.appendChild(roleEl);

      if (projects.length) {
        el.appendChild(document.createElement('br'));
        const listEl = document.createElement('span');
        listEl.className = 'cv-skills__selection-projekte';
        listEl.textContent = projects.map(function (project) {
          return project.label;
        }).join(' · ');
        el.appendChild(listEl);
      }
    }
  };
})(typeof self !== 'undefined' ? self : window);
