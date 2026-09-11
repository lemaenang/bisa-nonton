import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import * as movieService from './services/movieService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// === API ROUTES ===

// 1. Get All Movies (with optional query ?search=...&type=...)
app.get('/api/movies', async (req, res) => {
  try {
    const { search, type } = req.query;
    const movies = await movieService.getAllMovies({ search, type });
    res.json({ success: true, data: movies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Get Single Movie
app.get('/api/movies/:id', async (req, res) => {
  try {
    const movie = await movieService.getMovieById(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Film tidak ditemukan' });
    }
    res.json({ success: true, data: movie });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Create Movie / Series
app.post('/api/movies', async (req, res) => {
  try {
    const { title, cover_url, backdrop_url, description, type, year, genre, stream_url, episodes } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Judul film wajib diisi' });
    }

    const created = await movieService.createMovie({
      title: title.trim(),
      cover_url: cover_url?.trim() || '',
      backdrop_url: backdrop_url?.trim() || cover_url?.trim() || '',
      description: description?.trim() || '',
      type: type === 'series' ? 'series' : 'movie',
      year: year || new Date().getFullYear(),
      genre: genre?.trim() || 'Favorit',
      stream_url: stream_url?.trim() || '',
      episodes: Array.isArray(episodes) ? episodes : []
    });

    res.status(201).json({ success: true, data: created, message: 'Berhasil menambahkan film' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Update Movie / Series
app.put('/api/movies/:id', async (req, res) => {
  try {
    const updated = await movieService.updateMovie(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Film tidak ditemukan' });
    }
    res.json({ success: true, data: updated, message: 'Berhasil memperbarui data film' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Delete Movie / Series
app.delete('/api/movies/:id', async (req, res) => {
  try {
    const deleted = await movieService.deleteMovie(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Film tidak ditemukan' });
    }
    res.json({ success: true, message: 'Berhasil menghapus film' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Fallback untuk route admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Fallback untuk SPA / single page index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Jalankan listener jika bukan di lingkungan Vercel serverless
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🎬 Bisa Nonton Server running at:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`👉 Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`=========================================`);
  });
}

export default app;
