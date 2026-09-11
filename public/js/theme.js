/**
 * BISA NONTON - Theme Manager (Light Mode Default & Dark Mode Toggle)
 */

(function () {
  const THEME_KEY = 'bisa_nonton_theme';
  // Default adalah 'light' sesuai permintaan user
  const currentTheme = localStorage.getItem(THEME_KEY) || 'light';

  // Terapkan tema langsung di awal untuk mencegah flash of unstyled theme
  document.documentElement.setAttribute('data-theme', currentTheme);

  document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
  });

  function initThemeToggle() {
    const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
    updateToggleButtons(document.documentElement.getAttribute('data-theme') || 'light');

    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const activeTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = activeTheme === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
        updateToggleButtons(newTheme);

        // Feedback toast kecil
        if (window.showToast) {
          window.showToast(`Beralih ke ${newTheme === 'light' ? 'Mode Terang' : 'Mode Gelap'} 🌓`);
        }
      });
    });
  }

  function updateToggleButtons(theme) {
    const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
    toggleBtns.forEach(btn => {
      const iconSpan = btn.querySelector('.theme-icon');
      const textSpan = btn.querySelector('.theme-text');

      if (theme === 'light') {
        if (iconSpan) iconSpan.textContent = '🌙';
        if (textSpan) textSpan.textContent = 'Mode Gelap';
        btn.setAttribute('title', 'Ganti ke Mode Gelap');
      } else {
        if (iconSpan) iconSpan.textContent = '☀️';
        if (textSpan) textSpan.textContent = 'Mode Terang';
        btn.setAttribute('title', 'Ganti ke Mode Terang');
      }
    });
  }
})();
