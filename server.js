import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
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

// === STREAMING PROXY ENDPOINT (Mengatasi CORS pada link m3u8 eksternal) ===
app.get('/api/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('Missing url parameter');
  }

  try {
    const upstreamUrl = new URL(targetUrl);
    
    // Header CORS bebas untuk browser
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
    };
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const response = await fetch(upstreamUrl.toString(), {
      headers,
      redirect: 'follow'
    });

    if (!response.ok) {
      return res.status(response.status).send(`Upstream error: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const isM3U8 = targetUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('application/x-mpegURL');

    if (isM3U8) {
      // Baca manifest m3u8 dan ubah URL segment agar melewati proxy
      const m3u8Text = await response.text();
      const lines = m3u8Text.split(/\r?\n/);
      const rewrittenLines = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        // Jika baris adalah URL segment (tidak diawali #)
        if (!trimmed.startsWith('#')) {
          const resolvedUrl = new URL(trimmed, upstreamUrl).toString();
          return `/api/proxy?url=${encodeURIComponent(resolvedUrl)}`;
        }

        // Handle URI kunci enkripsi (#EXT-X-KEY:...,URI="...")
        if (trimmed.startsWith('#EXT-X-KEY:') && trimmed.includes('URI="')) {
          return trimmed.replace(/URI="([^"]+)"/, (match, uri) => {
            const resolvedUri = new URL(uri, upstreamUrl).toString();
            return `URI="/api/proxy?url=${encodeURIComponent(resolvedUri)}"`;
          });
        }

        // Handle URI map (#EXT-X-MAP:...,URI="...")
        if (trimmed.startsWith('#EXT-X-MAP:') && trimmed.includes('URI="')) {
          return trimmed.replace(/URI="([^"]+)"/, (match, uri) => {
            const resolvedUri = new URL(uri, upstreamUrl).toString();
            return `URI="/api/proxy?url=${encodeURIComponent(resolvedUri)}"`;
          });
        }

        return line;
      });

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      return res.send(rewrittenLines.join('\n'));
    } else {
      // Ini adalah segmen video (.pict, .ts, dsb.)
      res.setHeader('Content-Type', 'video/mp2t');
      if (response.headers.get('content-length')) {
        res.setHeader('Content-Length', response.headers.get('content-length'));
      }
      if (response.headers.get('content-range')) {
        res.setHeader('Content-Range', response.headers.get('content-range'));
        res.status(206);
      }

      Readable.fromWeb(response.body).pipe(res);
    }
  } catch (err) {
    console.error('Proxy error for URL:', targetUrl, err.message);
    if (!res.headersSent) {
      res.status(500).send(`Proxy error: ${err.message}`);
    }
  }
});

// === ADMIN AUTHENTICATION MIDDLEWARE & ENDPOINTS ===
const getAdminPassword = () => process.env.ADMIN_PASSWORD || 'admin123';

function verifyAdminAuth(req, res, next) {
  const expectedPassword = getAdminPassword();
  const authPass = req.headers['x-admin-password'];
  
  if (!authPass || authPass !== expectedPassword) {
    return res.status(401).json({ 
      success: false, 
      message: 'Akses ditolak: Password admin diperlukan atau salah.' 
    });
  }
  next();
}

// Endpoint Verifikasi Password Admin
app.post('/api/admin/verify', (req, res) => {
  const { password } = req.body;
  const expectedPassword = getAdminPassword();
  
  if (!password || password !== expectedPassword) {
    return res.status(401).json({ 
      success: false, 
      message: 'Password salah. Silakan coba lagi.' 
    });
  }
  
  res.json({ 
    success: true, 
    message: 'Password benar! Akses panel admin diberikan.' 
  });
});

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

// 3. Create Movie / Series (Protected with verifyAdminAuth)
app.post('/api/movies', verifyAdminAuth, async (req, res) => {
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

// 4. Update Movie / Series (Protected with verifyAdminAuth)
app.put('/api/movies/:id', verifyAdminAuth, async (req, res) => {
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

// 5. Delete Movie / Series (Protected with verifyAdminAuth)
app.delete('/api/movies/:id', verifyAdminAuth, async (req, res) => {
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
