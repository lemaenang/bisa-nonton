/**
 * BISA NONTON - Main Application Logic
 * Memuat katalog film, menangani filter, pencarian, dan hero highlight.
 */

let allMovies = [];
let currentFilter = 'all';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  fetchMovies();
  setupFilterTabs();
  setupSearch();
});

// Mengambil daftar film dari API
async function fetchMovies() {
  const grid = document.getElementById('moviesGrid');
  grid.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⏳</div>
      <p>Memuat koleksi film & serial favorit...</p>
    </div>
  `;

  try {
    const res = await fetch('/api/movies');
    const result = await res.json();

    if (result.success && Array.isArray(result.data)) {
      allMovies = result.data;
      renderHero(allMovies[0]);
      renderCatalog();
    } else {
      showErrorState('Gagal memuat data koleksi.');
    }
  } catch (error) {
    console.error('Error fetching movies:', error);
    showErrorState('Tidak dapat terhubung ke server backend.');
  }
}

// Render Hero Highlight Banner
function renderHero(featuredMovie) {
  const heroBanner = document.getElementById('heroBanner');
  if (!featuredMovie) {
    heroBanner.style.display = 'none';
    return;
  }

  const bgImage = featuredMovie.backdrop_url || featuredMovie.cover_url;
  if (bgImage) {
    heroBanner.style.backgroundImage = `url('${bgImage}')`;
  }

  document.getElementById('heroBadge').textContent = featuredMovie.type === 'series' ? '🔥 Serial Pilihan' : '⭐ Film Unggulan';
  document.getElementById('heroTitle').textContent = featuredMovie.title;
  document.getElementById('heroYear').textContent = featuredMovie.year || '2024';
  document.getElementById('heroGenre').textContent = featuredMovie.genre || 'Favorit';
  document.getElementById('heroDesc').textContent = featuredMovie.description || 'Nonton film pilihan favorit berkualitas tinggi.';

  const playBtn = document.getElementById('heroPlayBtn');
  // Hapus listener lama jika ada
  const newPlayBtn = playBtn.cloneNode(true);
  playBtn.parentNode.replaceChild(newPlayBtn, playBtn);

  newPlayBtn.addEventListener('click', () => {
    if (window.playerInstance) {
      window.playerInstance.open(featuredMovie);
    }
  });

  heroBanner.style.display = 'flex';
}

// Render Katalog Kartu Film
function renderCatalog() {
  const grid = document.getElementById('moviesGrid');
  grid.innerHTML = '';

  // Filter berdasarkan tipe dan search query
  const filtered = allMovies.filter(item => {
    const matchType = currentFilter === 'all' || item.type === currentFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || 
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.genre && item.genre.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q));

    return matchType && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>Tidak Ada Film Ditemukan</h3>
        <p style="margin-top: 0.5rem; color: var(--text-dim);">Coba kata kunci lain atau tambahkan film baru melalui menu kelola film.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement('article');
    card.className = 'movie-card';

    const isSeries = item.type === 'series';
    const epCount = isSeries && Array.isArray(item.episodes) ? `${item.episodes.length} Ep` : '';
    const badgeText = isSeries ? `SERIAL ${epCount ? '• ' + epCount : ''}` : 'FILM';
    const badgeClass = isSeries ? 'badge-series' : 'badge-movie';
    const defaultCover = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80';

    card.innerHTML = `
      <div class="card-poster">
        <span class="card-badge ${badgeClass}">${badgeText}</span>
        <img src="${item.cover_url || defaultCover}" alt="${item.title}" loading="lazy" onerror="this.src='${defaultCover}'">
        <div class="card-overlay">
          <div class="card-play-btn">▶</div>
        </div>
      </div>
      <div class="card-info">
        <h3 class="card-title" title="${item.title}">${item.title}</h3>
        <div class="card-meta">
          <span>${item.year || ''}</span>
          <span>${item.genre || ''}</span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      if (window.playerInstance) {
        window.playerInstance.open(item);
      }
    });

    grid.appendChild(card);
  });
}

// Setup Tab Filter (Semua, Film, Serial)
function setupFilterTabs() {
  const tabs = document.querySelectorAll('.filter-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.getAttribute('data-type');
      renderCatalog();
    });
  });
}

// Setup Search Input
function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  let debounceTimeout;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      searchQuery = e.target.value;
      renderCatalog();
    }, 200);
  });
}

function showErrorState(message) {
  const grid = document.getElementById('moviesGrid');
  grid.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⚠️</div>
      <h3>Terjadi Kesalahan</h3>
      <p style="margin-top: 0.5rem; color: var(--text-dim);">${message}</p>
    </div>
  `;
}
