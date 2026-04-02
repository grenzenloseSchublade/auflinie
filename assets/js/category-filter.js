/**
 * Kategoriefilterung für Blogbeiträge
 * Ermöglicht das dynamische Filtern von Beiträgen nach Kategorien ohne Seitenneuladen
 */
document.addEventListener('DOMContentLoaded', function() {
  const filterButtons = document.querySelectorAll('.filter-category');
  const postsContainer = document.getElementById('posts-container');
  const yearlyGroupsView = document.getElementById('yearly-groups-view');
  const emptyMessage = document.getElementById('empty-category-message');
  const allPostItems = document.querySelectorAll('.post-item');
  
  // Filterlogik
  filterButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Aktiven Button markieren
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      const selectedCategory = this.getAttribute('data-category');
      
      // Posts filtern
      if (selectedCategory === 'all') {
        // Alle Jahres-Sektionen anzeigen
        document.querySelectorAll('.taxonomy__section').forEach(section => {
          section.style.display = 'block';
        });
        
        // Alle Posts anzeigen
        allPostItems.forEach(post => {
          post.style.display = 'block';
        });
        
        // Leere-Nachricht verbergen
        emptyMessage.style.display = 'none';
      } else {
        // Wir zeigen Beiträge nur in der jeweiligen Jahres-Sektion
        let visiblePostsCount = 0;
        
        // Alle Posts prüfen und nach Kategorie filtern
        allPostItems.forEach(post => {
          const postCategories = (post.getAttribute('data-categories') || '').split(/\s+/);
          if (postCategories.includes(selectedCategory)) {
            post.style.display = 'block';
            visiblePostsCount++;
          } else {
            post.style.display = 'none';
          }
        });
        
        // Jahres-Sektionen prüfen und verstecken, wenn sie keine sichtbaren Posts haben
        document.querySelectorAll('.taxonomy__section').forEach(section => {
          const visiblePostsInSection = section.querySelectorAll('.post-item[style="display: block;"]');
          section.style.display = visiblePostsInSection.length > 0 ? 'block' : 'none';
        });
        
        // Leere-Kategorie-Nachricht anzeigen, wenn keine Beiträge gefunden wurden
        if (visiblePostsCount === 0) {
          emptyMessage.style.display = 'block';
        } else {
          emptyMessage.style.display = 'none';
        }
      }
    });
  });
  
  // URL-Parameter prüfen für initiale Kategorie
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get('category');
  
  if (categoryParam) {
    const categoryButton = document.querySelector(`.filter-category[data-category="${categoryParam}"]`);
    if (categoryButton) {
      categoryButton.click();
    }
  }
}); 