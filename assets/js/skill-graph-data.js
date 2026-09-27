/**
 * Skill-Feature — gemeinsame, DOM-freie Helfer (Muster: skill-graph-sim.js).
 *
 * Vorher lebten parseData und der Skill→Projekte-Map-Aufbau als wortgleiche
 * Kopien in skill-chips.js und skill-graph.js. Der Persistent-Shell-Helfer
 * (window.spaModule) liegt sitewide in spa-module.js.
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
      var data;
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
      var prefix = (opts && opts.prefix) || 'skill-graph';
      var knownIds = opts && opts.knownIds;
      var map = new Map();
      var cleaned = [];
      projects.forEach(function (project) {
        if (!project || !project.id || !project.label || !Array.isArray(project.skills)) {
          console.warn(prefix + ': Projekt ohne Pflichtfelder übersprungen', project);
          return;
        }
        var ids = project.skills.filter(function (id) {
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
    }
  };

  // window.spaModule (Persistent-Shell-Kontrakt) lebt sitewide in
  // assets/js/spa-module.js — auch Nicht-Skill-Module (Fraktal-Panels)
  // brauchen ihn.
})(typeof self !== 'undefined' ? self : window);
