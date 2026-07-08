(() => {
  const clickWindowMs = 350;
  const stateByScope = new WeakMap();

  const getVar = (el, name) =>
    getComputedStyle(el).getPropertyValue(name).trim();

  const getScope = (trigger) =>
    trigger.closest(".neon-name") || document.documentElement;

  const getState = (scope) => {
    const existing = stateByScope.get(scope);
    if (existing) return existing;
    const defaults = {
      dotBefore: getVar(scope, "--neon-umlaut-dot-color-before"),
      dotAfter: getVar(scope, "--neon-umlaut-dot-color-after"),
      glowStrongBefore: getVar(scope, "--neon-umlaut-dot-glow-strong-before"),
      glowStrongAfter: getVar(scope, "--neon-umlaut-dot-glow-strong-after"),
      glowMidBefore: getVar(scope, "--neon-umlaut-dot-glow-mid-before"),
      glowMidAfter: getVar(scope, "--neon-umlaut-dot-glow-mid-after"),
      glowSoftBefore: getVar(scope, "--neon-umlaut-dot-glow-soft-before"),
      glowSoftAfter: getVar(scope, "--neon-umlaut-dot-glow-soft-after"),
    };
    const state = {
      defaults,
      clickCount: 0,
      clickTimer: null,
      orbitMode: "default",
      finishTimer: null,
      popinTimer: null,
      orbitStartTimeMs: 0,
    };
    stateByScope.set(scope, state);
    return state;
  };

  const setColorMode = (scope, state, mode) => {
    const style = scope.style;
    if (mode === "accent") {
      style.setProperty(
        "--neon-umlaut-dot-color-before",
        getVar(scope, "--neon-umlaut-accent-before") || "#00ffff"
      );
      style.setProperty(
        "--neon-umlaut-dot-color-after",
        getVar(scope, "--neon-umlaut-accent-after") || "#ff00cc"
      );
      style.setProperty(
        "--neon-umlaut-dot-glow-strong-before",
        getVar(scope, "--neon-umlaut-accent-glow-before") || "rgba(0, 255, 255, 0.85)"
      );
      style.setProperty(
        "--neon-umlaut-dot-glow-mid-before",
        getVar(scope, "--neon-umlaut-accent-glow-mid-before") || "rgba(0, 255, 255, 0.7)"
      );
      style.setProperty(
        "--neon-umlaut-dot-glow-soft-before",
        getVar(scope, "--neon-umlaut-accent-glow-soft-before") || "rgba(0, 255, 255, 0.5)"
      );
      style.setProperty(
        "--neon-umlaut-dot-glow-strong-after",
        getVar(scope, "--neon-umlaut-accent-glow-after") || "rgba(255, 0, 204, 0.85)"
      );
      style.setProperty(
        "--neon-umlaut-dot-glow-mid-after",
        getVar(scope, "--neon-umlaut-accent-glow-mid-after") || "rgba(255, 0, 204, 0.7)"
      );
      style.setProperty(
        "--neon-umlaut-dot-glow-soft-after",
        getVar(scope, "--neon-umlaut-accent-glow-soft-after") || "rgba(255, 0, 204, 0.5)"
      );
      return;
    }
    style.setProperty("--neon-umlaut-dot-color-before", state.defaults.dotBefore);
    style.setProperty("--neon-umlaut-dot-color-after", state.defaults.dotAfter);
    style.setProperty("--neon-umlaut-dot-glow-strong-before", state.defaults.glowStrongBefore);
    style.setProperty("--neon-umlaut-dot-glow-strong-after", state.defaults.glowStrongAfter);
    style.setProperty("--neon-umlaut-dot-glow-mid-before", state.defaults.glowMidBefore);
    style.setProperty("--neon-umlaut-dot-glow-mid-after", state.defaults.glowMidAfter);
    style.setProperty("--neon-umlaut-dot-glow-soft-before", state.defaults.glowSoftBefore);
    style.setProperty("--neon-umlaut-dot-glow-soft-after", state.defaults.glowSoftAfter);
  };

  const clearTimers = (state) => {
    if (state.clickTimer) {
      window.clearTimeout(state.clickTimer);
      state.clickTimer = null;
    }
    if (state.finishTimer) {
      window.clearTimeout(state.finishTimer);
      state.finishTimer = null;
    }
    if (state.popinTimer) {
      window.clearTimeout(state.popinTimer);
      state.popinTimer = null;
    }
  };

  const stopOrbitSmooth = (scope, state) => {
    clearTimers(state);
    scope.style.setProperty("--neon-orbit-color-mode", "default");
    setColorMode(scope, state, "default");
    // Variablen zurücksetzen auf CSS-Defaults
    scope.style.removeProperty("--neon-orbit-radius-em");
    scope.style.removeProperty("--neon-orbit-radius");
    scope.style.removeProperty("--neon-orbit-center-y");
    scope.style.removeProperty("--neon-orbit-origin-y");
    scope.classList.remove("orbit-running");
    scope.classList.remove("orbit-finish");
    scope.classList.remove("orbit-popin");
    scope.classList.remove("orbit-scatter");
  };

  // Generiert zufällige Bildschirmpositionen für die Scatter-Animation
  const generateScatterPositions = (scope) => {
    const randomRange = (min, max) => Math.random() * (max - min) + min;
    const randomSign = () => (Math.random() > 0.5 ? 1 : -1);
    
    // 4 zufällige Wegpunkte für jeden Punkt (before und after)
    for (let i = 1; i <= 4; i++) {
      // Punkt "before" - zufällige Positionen über den Bildschirm
      scope.style.setProperty(
        `--neon-scatter-x${i}-before`,
        `${randomSign() * randomRange(15, 45)}vw`
      );
      scope.style.setProperty(
        `--neon-scatter-y${i}-before`,
        `${randomSign() * randomRange(10, 40)}vh`
      );
      
      // Punkt "after" - andere zufällige Positionen
      scope.style.setProperty(
        `--neon-scatter-x${i}-after`,
        `${randomSign() * randomRange(15, 45)}vw`
      );
      scope.style.setProperty(
        `--neon-scatter-y${i}-after`,
        `${randomSign() * randomRange(10, 40)}vh`
      );
    }
  };

  const getAngle = (el, pseudo) => {
    if (!el) return null;
    const transform = getComputedStyle(el, pseudo).transform;
    if (!transform || transform === "none") return null;
    const values =
      transform.match(/matrix3d\\(([^)]+)\\)/) ||
      transform.match(/matrix\\(([^)]+)\\)/);
    if (!values) return null;
    const parts = values[1].split(",").map((v) => parseFloat(v.trim()));
    const [a, b] = parts;
    return Math.atan2(b, a) * (180 / Math.PI);
  };

  const toMs = (value) => {
    if (!value) return 0;
    const num = parseFloat(value);
    if (Number.isNaN(num)) return 0;
    return value.includes("ms") ? num : num * 1000;
  };

  // Scatter-Animation für 2-Klick Beenden (Punkte fliegen wild über den Bildschirm)
  const scatterOrbitSequence = (scope, state, target) => {
    clearTimers(state);

    let angleBefore = getAngle(target, "::before");
    let angleAfter = getAngle(target, "::after");

    if (angleBefore === null || angleAfter === null) {
      const periodMs = toMs(getVar(scope, "--neon-orbit-period")) || 6400;
      const rampMs = toMs(getVar(scope, "--neon-orbit-ramp-duration")) || 1200;
      const startDelayMs = toMs(getVar(scope, "--neon-orbit-start-delay")) || 600;
      const elapsed =
        performance.now() - state.orbitStartTimeMs - startDelayMs - rampMs;
      const phase = ((Math.max(0, elapsed) % periodMs) / periodMs) * 360;
      // Spiral-Endwinkel: before bei 360°, after bei 540° (180° versetzt)
      if (angleBefore === null) angleBefore = 360 + phase;
      if (angleAfter === null) angleAfter = 540 + phase;
    }

    scope.style.setProperty("--neon-orbit-start-angle-before", `${angleBefore}deg`);
    scope.style.setProperty("--neon-orbit-start-angle-after", `${angleAfter}deg`);

    // Generiere zufällige Positionen für die Scatter-Animation
    generateScatterPositions(scope);

    requestAnimationFrame(() => {
      scope.classList.remove("orbit-running");
      scope.classList.remove("orbit-finish");
      scope.classList.remove("orbit-popin");
      scope.classList.add("orbit-scatter");
    });

    // Scatter-Animation dauert 3 Sekunden
    const scatterDuration = getVar(scope, "--neon-orbit-scatter-duration") || "3s";

    state.finishTimer = window.setTimeout(() => {
      scope.classList.remove("orbit-scatter");
      stopOrbitSmooth(scope, state);
      state.orbitMode = "default";
      state.clickCount = 0;
      scope.style.setProperty("--neon-orbit-opacity", "1");
      void scope.offsetWidth;
    }, parseFloat(scatterDuration) * 1000 + 200);
  };

  // Explosion-Animation für 3-Klick Beenden (originale Finish-Animation)
  const finishOrbitSequence = (scope, state, target) => {
    clearTimers(state);

    let angleBefore = getAngle(target, "::before");
    let angleAfter = getAngle(target, "::after");

    if (angleBefore === null || angleAfter === null) {
      const periodMs = toMs(getVar(scope, "--neon-orbit-period")) || 6400;
      const rampMs = toMs(getVar(scope, "--neon-orbit-ramp-duration")) || 1200;
      const startDelayMs = toMs(getVar(scope, "--neon-orbit-start-delay")) || 600;
      const elapsed =
        performance.now() - state.orbitStartTimeMs - startDelayMs - rampMs;
      const phase = ((Math.max(0, elapsed) % periodMs) / periodMs) * 360;
      // Spiral-Endwinkel: before bei 360°, after bei 540° (180° versetzt)
      if (angleBefore === null) angleBefore = 360 + phase;
      if (angleAfter === null) angleAfter = 540 + phase;
    }

    scope.style.setProperty("--neon-orbit-start-angle-before", `${angleBefore}deg`);
    scope.style.setProperty("--neon-orbit-start-angle-after", `${angleAfter}deg`);

    requestAnimationFrame(() => {
      scope.classList.remove("orbit-running");
      scope.classList.add("orbit-finish");
      scope.classList.remove("orbit-popin");
      scope.classList.remove("orbit-scatter");
    });

    const finishDuration =
      getVar(scope, "--neon-orbit-finish-duration") || "3.4s";
    const popDuration =
      getVar(scope, "--neon-orbit-pop-duration") || "0.4s";

    state.finishTimer = window.setTimeout(() => {
      scope.classList.remove("orbit-finish");
      scope.classList.add("orbit-popin");

      state.popinTimer = window.setTimeout(() => {
        scope.classList.remove("orbit-popin");
        stopOrbitSmooth(scope, state);
        state.orbitMode = "default";
        state.clickCount = 0;
        scope.style.setProperty("--neon-orbit-opacity", "1");
        void scope.offsetWidth;
      }, parseFloat(popDuration) * 1000);
    }, parseFloat(finishDuration) * 1000);
  };

  const startOrbit = (scope, state, mode) => {
    clearTimers(state);
    state.orbitStartTimeMs = performance.now();
    scope.style.setProperty("--neon-orbit-color-mode", mode);
    setColorMode(scope, state, mode);
    
    // Orbit-Parameter je nach Modus
    // WICHTIG: --neon-orbit-center-y und --neon-orbit-radius werden in ALLEN Keyframes verwendet
    // (Ramp, Spin, Finish, Scatter) - Änderungen hier wirken sich auf alle Animationen aus
    if (mode === "default") {
      // 2-Klick: Größerer Orbit (0.7em), Mittelpunkt in der Mitte des "u"
      scope.style.setProperty("--neon-orbit-radius-em", "0.7");
      scope.style.setProperty("--neon-orbit-radius", "0.7em");
      scope.style.setProperty("--neon-orbit-center-y", "0.29em");
    } else {
      // 3-Klick: Kleinerer Orbit (0.4em), Mittelpunkt ÜBER dem "u"
      scope.style.setProperty("--neon-orbit-radius-em", "0.4");
      scope.style.setProperty("--neon-orbit-radius", "0.4em");
      scope.style.setProperty("--neon-orbit-center-y", "-0.5em");
    }
    
    scope.classList.add("orbit-running");
    scope.classList.remove("orbit-finish");
    scope.classList.remove("orbit-popin");
    scope.classList.remove("orbit-scatter");
  };

  const toggleOrbit = (scope, state, mode, target) => {
    if (scope.classList.contains("orbit-finish") || scope.classList.contains("orbit-popin") || scope.classList.contains("orbit-scatter")) {
      return;
    }
    const running = scope.classList.contains("orbit-running");
    if (running) {
      // Beim Beenden: Animation basierend auf mode Parameter (Klickzahl)
      // Die Validierung (passende Klickzahl) erfolgt in handleClicks
      if (mode === "accent") {
        // 3-Klick Ende: Explosion-Animation
        finishOrbitSequence(scope, state, target);
        return;
      }
      // 2-Klick Ende: Scatter-Animation (Punkte fliegen wild)
      scatterOrbitSequence(scope, state, target);
      return;
    }
    state.orbitMode = mode;
    startOrbit(scope, state, mode);
  };

  const handleClicks = (scope, state, target) => {
    const running = scope.classList.contains("orbit-running");
    
    if (state.clickCount === 2) {
      // 2-Klick: Ignorieren wenn Animation mit 3-Klick gestartet wurde
      if (running && state.orbitMode === "accent") {
        state.clickCount = 0;
        state.clickTimer = null;
        return;
      }
      toggleOrbit(scope, state, "default", target);
    } else if (state.clickCount >= 3) {
      // 3-Klick: Ignorieren wenn Animation mit 2-Klick gestartet wurde
      if (running && state.orbitMode === "default") {
        state.clickCount = 0;
        state.clickTimer = null;
        return;
      }
      toggleOrbit(scope, state, "accent", target);
    }
    state.clickCount = 0;
    state.clickTimer = null;
  };

  const triggers = document.querySelectorAll(".neon-orbit-trigger");
  if (!triggers.length) return;

  triggers.forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      const scope = getScope(event.currentTarget);
      const state = getState(scope);
      const target = scope.querySelector(".neon-umlaut");
      if (!target) return;
      state.clickCount += 1;
      if (state.clickTimer) {
        window.clearTimeout(state.clickTimer);
      }
      state.clickTimer = window.setTimeout(
        () => handleClicks(scope, state, target),
        clickWindowMs
      );
    });

    el.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      const scope = getScope(event.currentTarget);
      const state = getState(scope);
      const target = scope.querySelector(".neon-umlaut");
      if (!target) return;
      state.clickCount += 1;
      if (state.clickTimer) {
        window.clearTimeout(state.clickTimer);
      }
      state.clickTimer = window.setTimeout(
        () => handleClicks(scope, state, target),
        clickWindowMs
      );
    });
  });

  // Dauer-Animationen (box-/text-shadow = Paint-teuer) pausieren, sobald der
  // Schriftzug aus dem Viewport gescrollt ist — die Klasse wirkt per CSS nur,
  // wenn keine Choreografie läuft (siehe _neon-base.scss), damit deren
  // Timer-Zustandsmaschine nicht aus dem Tritt gerät
  if ("IntersectionObserver" in window) {
    const paintObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("neon-paused", !entry.isIntersecting);
      });
    });
    document.querySelectorAll(".neon-name").forEach((el) => paintObserver.observe(el));
  }
})();
