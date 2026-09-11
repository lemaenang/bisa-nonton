/**
 * BISA NONTON - Admin Panel Logic
 * Mengelola penambahan, pembaruan, dan penghapusan film/serial.
 */

let adminMovies = [];
let isEditMode = false;

// DOM Elements
const adminTableBody = document.getElementById('adminTableBody');
const adminSearchInput = document.getElementById('adminSearchInput');
const statTotal = document.getElementById('statTotal');
const statMovies = document.getElementById('statMovies');
const statSeries = document.getElementById('statSeries');

// Modal Elements
const modal = document.getElementById('movieFormModal');
const modalTitle = document.getElementById('modalFormTitle');
const btnOpenAddModal = document.getElementById('btnOpenAddModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const btnCancelModal = document.getElementById('btnCancelModal');
const movieForm = document.getElementById('movieForm');

// Form Inputs
const formMovieId = document.getElementById('formMovieId');
const formTitle = document.getElementById('formTitle');
const formCover = document.getElementById('formCover');
const coverPreviewImg = document.getElementById('coverPreviewImg');
const previewPlaceholder = document.getElementById('previewPlaceholder');
const formYear = document.getElementById('formYear');
const formGenre = document.getElementById('formGenre');
const formDesc = document.getElementById('formDesc');
const typeMovieRadio = document.getElementById('typeMovie');
const typeSeriesRadio = document.getElementById('typeSeries');
const movieStreamSection = document.getElementById('movieStreamSection');
const seriesStreamSection = document.getElementById('seriesStreamSection');
const formStreamUrl = document.getElementById('formStreamUrl');
const btnAddEpisode = document.getElementById('btnAddEpisode');
const episodeInputsContainer = document.getElementById('episodeInputsContainer');

document.addEventListener('DOMContentLoaded', () => {
  loadAdminMovies();
  setupEventListeners();
});

function setupEventListeners() {
  // Buka Modal Tambah
  btnOpenAddModal.addEventListener('click', () => openAddModal());

  // Tutup Modal
  modalCloseBtn.addEventListener('click', () => closeModal());
  btnCancelModal.addEventListener('click', () => closeModal());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Ganti Tipe Konten (Film vs Serial)
  typeMovieRadio.addEventListener('change', () => toggleContentType('movie'));
  typeSeriesRadio.addEventListener('change', () => toggleContentType('series'));

  // Live Preview Cover Image
  formCover.addEventListener('input', (e) => updateCoverPreview(e.target.value));

  // Tambah Episode
  btnAddEpisode.addEventListener('click', () => addEpisodeRow());

  // Form Submit
  movieForm.addEventListener('submit', handleFormSubmit);

  // Search Filter
  adminSearchInput.addEventListener('input', () => renderAdminTable());
}

// Mengambil data dari API
async function loadAdminMovies() {
  try {
    const res = await fetch('/api/movies');
    const result = await res.json();
    if (result.success && Array.isArray(result.data)) {
      adminMovies = result.data;
      updateStats();
      renderAdminTable();
    }
  } catch (error) {
    console.error('Error loading admin movies:', error);
    showToast('Gagal memuat data koleksi dari backend.');
  }
}

// Update Statistik
function updateStats() {
  statTotal.textContent = adminMovies.length;
  statMovies.textContent = adminMovies.filter(m => m.type === 'movie').length;
  statSeries.textContent = adminMovies.filter(m => m.type === 'series').length;
}

// Render Tabel Admin
function renderAdminTable() {
  adminTableBody.innerHTML = '';
  const q = adminSearchInput.value.toLowerCase().trim();

  const filtered = adminMovies.filter(m => {
    return !q || 
      (m.title && m.title.toLowerCase().includes(q)) ||
      (m.genre && m.genre.toLowerCase().includes(q));
  });

  if (filtered.length === 0) {
    adminTableBody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          Tidak ada data film atau serial yang sesuai.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(item => {
    const tr = document.createElement('tr');
    const isSeries = item.type === 'series';
    const defaultCover = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&auto=format&fit=crop&q=80';

    // Stream info column
    let streamInfo = '';
    if (isSeries) {
      const epLen = (item.episodes || []).length;
      streamInfo = `<span style="color: #ff6b8b; font-weight: 600;">📺 ${epLen} Episode Tersedia</span>`;
    } else {
      const url = item.stream_url || '';
      const displayUrl = url.length > 40 ? url.substring(0, 37) + '...' : url;
      streamInfo = url ? `<span style="font-family: monospace; font-size: 0.8rem; color: var(--text-dim);" title="${url}">${displayUrl}</span>` : '<span style="color: var(--text-dim);">Belum ada link stream</span>';
    }

    tr.innerHTML = `
      <td>
        <div class="movie-thumb-cell">
          <img src="${item.cover_url || defaultCover}" class="movie-thumb" alt="${item.title}" onerror="this.src='${defaultCover}'">
          <div>
            <div class="movie-cell-title">${item.title}</div>
            <div class="movie-cell-meta">${item.year || '-'} • ${item.genre || 'Favorit'}</div>
          </div>
        </div>
      </td>
      <td>
        <span class="card-badge ${isSeries ? 'badge-series' : 'badge-movie'}" style="position: static;">
          ${isSeries ? 'SERIAL' : 'FILM'}
        </span>
      </td>
      <td>
        ${streamInfo}
      </td>
      <td style="text-align: right;">
        <div class="table-actions" style="justify-content: flex-end;">
          <button class="action-btn btn-edit" onclick="editMovie('${item.id}')" title="Edit">
            ✏️ Edit
          </button>
          <button class="action-btn btn-delete" onclick="deleteMovie('${item.id}', '${escapeHtml(item.title)}')" title="Hapus">
            🗑️ Hapus
          </button>
        </div>
      </td>
    `;

    adminTableBody.appendChild(tr);
  });
}

// Buka Modal Tambah Film
function openAddModal() {
  isEditMode = false;
  modalTitle.textContent = 'Tambah Koleksi Film / Serial Baru';
  movieForm.reset();
  formMovieId.value = '';
  formYear.value = new Date().getFullYear();
  typeMovieRadio.checked = true;
  toggleContentType('movie');
  updateCoverPreview('');
  episodeInputsContainer.innerHTML = '';

  modal.classList.add('active');
}

// Buka Modal Edit Film
window.editMovie = function(id) {
  const item = adminMovies.find(m => m.id === id);
  if (!item) return;

  isEditMode = true;
  modalTitle.textContent = `Edit Koleksi: ${item.title}`;
  formMovieId.value = item.id;
  formTitle.value = item.title || '';
  formCover.value = item.cover_url || '';
  formYear.value = item.year || new Date().getFullYear();
  formGenre.value = item.genre || '';
  formDesc.value = item.description || '';

  updateCoverPreview(item.cover_url);

  if (item.type === 'series') {
    typeSeriesRadio.checked = true;
    toggleContentType('series');
    formStreamUrl.value = '';
    renderEpisodeInputs(item.episodes || []);
  } else {
    typeMovieRadio.checked = true;
    toggleContentType('movie');
    formStreamUrl.value = item.stream_url || '';
    episodeInputsContainer.innerHTML = '';
  }

  modal.classList.add('active');
};

// Toggle Tampilan Form antara Film Biasa dan Serial
function toggleContentType(type) {
  if (type === 'series') {
    movieStreamSection.style.display = 'none';
    seriesStreamSection.style.display = 'block';
    formStreamUrl.removeAttribute('required');

    if (episodeInputsContainer.children.length === 0) {
      addEpisodeRow(1, 'Episode 1', '');
    }
  } else {
    movieStreamSection.style.display = 'block';
    seriesStreamSection.style.display = 'none';
    formStreamUrl.setAttribute('required', 'true');
  }
}

// Render baris-baris episode untuk form serial
function renderEpisodeInputs(episodes) {
  episodeInputsContainer.innerHTML = '';
  if (episodes.length === 0) {
    addEpisodeRow(1, 'Episode 1', '');
    return;
  }
  episodes.forEach(ep => {
    addEpisodeRow(ep.episode_number, ep.title, ep.stream_url);
  });
}

// Tambah 1 baris input episode
function addEpisodeRow(num, title = '', url = '') {
  const currentCount = episodeInputsContainer.children.length;
  const epNum = num || (currentCount + 1);

  const row = document.createElement('div');
  row.className = 'episode-input-row';
  row.innerHTML = `
    <input type="number" class="form-control ep-num" value="${epNum}" placeholder="Ep #" title="Nomor Episode" style="text-align: center;">
    <input type="text" class="form-control ep-title" value="${title || `Episode ${epNum}`}" placeholder="Judul Episode">
    <input type="url" class="form-control ep-url" value="${url || ''}" placeholder="Link stream .m3u8" required>
    <button type="button" class="del-ep-btn" title="Hapus Episode">✕</button>
  `;

  row.querySelector('.del-ep-btn').addEventListener('click', () => {
    row.remove();
  });

  episodeInputsContainer.appendChild(row);
}

// Live Preview Cover Image
function updateCoverPreview(url) {
  if (url && url.trim()) {
    coverPreviewImg.src = url.trim();
    coverPreviewImg.style.display = 'block';
    previewPlaceholder.style.display = 'none';

    coverPreviewImg.onerror = () => {
      coverPreviewImg.style.display = 'none';
      previewPlaceholder.style.display = 'block';
      previewPlaceholder.textContent = 'Invalid URL';
    };
  } else {
    coverPreviewImg.style.display = 'none';
    previewPlaceholder.style.display = 'block';
    previewPlaceholder.textContent = 'Preview';
  }
}

// Handle Simpan (Tambah / Edit)
async function handleFormSubmit(e) {
  e.preventDefault();

  const title = formTitle.value.trim();
  if (!title) {
    showToast('Judul film wajib diisi!');
    return;
  }

  const type = typeSeriesRadio.checked ? 'series' : 'movie';
  const cover_url = formCover.value.trim();
  const year = parseInt(formYear.value) || new Date().getFullYear();
  const genre = formGenre.value.trim();
  const description = formDesc.value.trim();

  let stream_url = '';
  let episodes = [];

  if (type === 'movie') {
    stream_url = formStreamUrl.value.trim();
    if (!stream_url) {
      showToast('Link streaming video wajib diisi untuk film biasa!');
      return;
    }
  } else {
    // Serial: ambil data dari baris episode
    const rows = episodeInputsContainer.querySelectorAll('.episode-input-row');
    if (rows.length === 0) {
      showToast('Tambahkan minimal 1 episode untuk serial TV!');
      return;
    }

    rows.forEach((r, idx) => {
      const epNum = parseInt(r.querySelector('.ep-num').value) || (idx + 1);
      const epTitle = r.querySelector('.ep-title').value.trim() || `Episode ${epNum}`;
      const epUrl = r.querySelector('.ep-url').value.trim();

      if (epUrl) {
        episodes.push({
          id: `ep-${Date.now()}-${idx}`,
          episode_number: epNum,
          title: epTitle,
          stream_url: epUrl
        });
      }
    });

    if (episodes.length === 0) {
      showToast('Pastikan link stream episode sudah diisi!');
      return;
    }
  }

  const payload = {
    title,
    type,
    cover_url,
    backdrop_url: cover_url,
    year,
    genre,
    description,
    stream_url,
    episodes
  };

  const saveBtn = document.getElementById('btnSaveMovie');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Menyimpan...';

  try {
    let res;
    if (isEditMode) {
      const id = formMovieId.value;
      res = await fetch(`/api/movies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    const data = await res.json();
    if (data.success) {
      showToast(isEditMode ? 'Film berhasil diperbarui! ✨' : 'Film berhasil ditambahkan! 🎬');
      closeModal();
      await loadAdminMovies();
    } else {
      showToast(data.message || 'Gagal menyimpan film.');
    }
  } catch (error) {
    console.error('Error saving movie:', error);
    showToast('Terjadi kesalahan saat menyimpan data.');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = '💾 Simpan Film';
  }
}

// Hapus Film
window.deleteMovie = async function(id, title) {
  if (!confirm(`Apakah Anda yakin ingin menghapus "${title}" dari koleksi?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/movies/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (data.success) {
      showToast(`"${title}" berhasil dihapus.`);
      await loadAdminMovies();
    } else {
      showToast(data.message || 'Gagal menghapus film.');
    }
  } catch (error) {
    console.error('Error deleting movie:', error);
    showToast('Terjadi kesalahan saat menghapus film.');
  }
};

function closeModal() {
  modal.classList.remove('active');
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  if (!toast || !toastMsg) return;
  toastMsg.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
