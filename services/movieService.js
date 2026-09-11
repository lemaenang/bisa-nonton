import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'data', 'movies.json');

// Cek Kredensial Supabase Kustom dari Environment Variables
const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_KEY?.trim();

const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

if (isSupabaseConfigured) {
  console.log('⚡ Menggunakan Database Supabase Kustom');
} else {
  console.log('📁 Menggunakan Database Lokal (data/movies.json)');
}

// ==========================================
// OPERASI DATA (HYBRID: SUPABASE / LOKAL JSON)
// ==========================================

// 1. Dapatkan Semua Film / Serial
export async function getAllMovies(filters = {}) {
  if (supabase) {
    try {
      let query = supabase.from('movies').select('*').order('created_at', { ascending: false });

      if (filters.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }

      if (filters.search) {
        const q = `%${filters.search.trim()}%`;
        query = query.or(`title.ilike.${q},genre.ilike.${q},description.ilike.${q}`);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data;
      }
      console.warn('Gagal membaca dari Supabase, beralih ke data lokal:', error?.message);
    } catch (err) {
      console.error('Supabase fetch error:', err);
    }
  }

  return getLocalMovies(filters);
}

// 2. Dapatkan Film Berdasarkan ID
export async function getMovieById(id) {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('movies').select('*').eq('id', id).single();
      if (!error && data) return data;
    } catch (err) {
      console.error('Supabase getMovieById error:', err);
    }
  }

  const localMovies = await getLocalMovies();
  return localMovies.find(m => m.id === id) || null;
}

// 3. Tambah Film / Serial Baru
export async function createMovie(movieData) {
  const newMovie = {
    id: movieData.id || `mov_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    title: movieData.title || 'Tanpa Judul',
    description: movieData.description || '',
    cover_url: movieData.cover_url || '',
    backdrop_url: movieData.backdrop_url || movieData.cover_url || '',
    type: movieData.type || 'movie',
    year: movieData.year ? Number(movieData.year) : new Date().getFullYear(),
    genre: movieData.genre || 'Favorit',
    stream_url: movieData.stream_url || '',
    episodes: Array.isArray(movieData.episodes) ? movieData.episodes : [],
    created_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('movies').insert([newMovie]).select().single();
      if (!error && data) return data;
      console.error('Supabase insert error, menyimpan ke file lokal:', error);
    } catch (err) {
      console.error('Supabase createMovie error:', err);
    }
  }

  // Simpan ke file lokal JSON
  const movies = await getLocalMovies();
  movies.unshift(newMovie);
  await saveLocalMovies(movies);
  return newMovie;
}

// 4. Update Film / Serial
export async function updateMovie(id, updateData) {
  if (supabase) {
    try {
      const payload = {
        ...updateData,
        updated_at: new Date().toISOString()
      };
      if (payload.year !== undefined) payload.year = Number(payload.year);

      const { data, error } = await supabase.from('movies').update(payload).eq('id', id).select().single();
      if (!error && data) return data;
      console.error('Supabase update error:', error);
    } catch (err) {
      console.error('Supabase updateMovie error:', err);
    }
  }

  // Update di file lokal JSON
  const movies = await getLocalMovies();
  const index = movies.findIndex(m => m.id === id);
  if (index === -1) return null;

  const existing = movies[index];
  const updatedMovie = {
    ...existing,
    ...updateData,
    id: existing.id,
    year: updateData.year !== undefined ? Number(updateData.year) : existing.year,
    episodes: Array.isArray(updateData.episodes) ? updateData.episodes : existing.episodes,
    updated_at: new Date().toISOString()
  };

  movies[index] = updatedMovie;
  await saveLocalMovies(movies);
  return updatedMovie;
}

// 5. Hapus Film / Serial
export async function deleteMovie(id) {
  if (supabase) {
    try {
      const { error } = await supabase.from('movies').delete().eq('id', id);
      if (!error) return true;
      console.error('Supabase delete error:', error);
    } catch (err) {
      console.error('Supabase deleteMovie error:', err);
    }
  }

  // Hapus dari file lokal JSON
  const movies = await getLocalMovies();
  const filtered = movies.filter(m => m.id !== id);
  if (filtered.length === movies.length) return false;

  await saveLocalMovies(filtered);
  return true;
}

// ==========================================
// HELPER LOKAL FILESYSTEM
// ==========================================
async function getLocalMovies(filters = {}) {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    let movies = JSON.parse(data);

    if (filters.type && filters.type !== 'all') {
      movies = movies.filter(m => m.type === filters.type);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      movies = movies.filter(m => 
        (m.title && m.title.toLowerCase().includes(q)) ||
        (m.genre && m.genre.toLowerCase().includes(q)) ||
        (m.description && m.description.toLowerCase().includes(q))
      );
    }

    return movies;
  } catch (error) {
    console.error('Error reading local movies data:', error);
    return [];
  }
}

async function saveLocalMovies(movies) {
  await fs.writeFile(DATA_FILE, JSON.stringify(movies, null, 2), 'utf-8');
}
