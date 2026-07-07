/**
 * Back to Top Button
 * Zeigt einen Button zum Zurückkehren an den Seitenanfang,
 * wenn die Seite lang genug ist und der Benutzer nach unten gescrollt hat.
 */
(function() {
  'use strict';
  
  const SCROLL_THRESHOLD = 888; // Pixel nach unten gescrollt
  const MIN_PAGE_HEIGHT_RATIO = 1.5; // Seite muss 150% des Viewports sein
  const THROTTLE_MS = 16; // ~60fps
  
  /**
   * Throttle-Funktion für Performance
   */
  function throttle(func, limit) {
    let inThrottle = false;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  
  /**
   * Initialisiert den Back to Top Button
   */
  function initBackToTop() {
    const btn = document.querySelector('.back-to-top');
    if (!btn) return;
    
    /**
     * Prüft ob der Button sichtbar sein soll
     */
    function checkVisibility() {
      const viewportHeight = window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      const scrollPosition = window.scrollY;
      
      // Seite muss lang genug sein UND genug gescrollt
      const isLongPage = pageHeight > viewportHeight * MIN_PAGE_HEIGHT_RATIO;
      const isScrolled = scrollPosition > SCROLL_THRESHOLD;
      
      btn.classList.toggle('visible', isLongPage && isScrolled);

      // Über dem Footer parken, statt ihn zu überdecken
      const footer = document.querySelector('.page__footer');
      if (footer) {
        const fr = footer.getBoundingClientRect();
        btn.classList.toggle('back-to-top--above-footer', fr.top < window.innerHeight);
      }
    }
    
    /**
     * Scrollt sanft zum Seitenanfang
     */
    function scrollToTop() {
      // Moderne Browser mit smooth scroll
      if ('scrollBehavior' in document.documentElement.style) {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      } else {
        // Fallback für ältere Browser
        window.scrollTo(0, 0);
      }
    }
    
    // Event Listener
    const throttledCheck = throttle(checkVisibility, THROTTLE_MS);
    
    window.addEventListener('scroll', throttledCheck, { passive: true });
    window.addEventListener('resize', throttledCheck, { passive: true });
    
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      scrollToTop();
    });
    
    // Initial Check
    checkVisibility();
  }
  
  // DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBackToTop);
  } else {
    initBackToTop();
  }
})();
