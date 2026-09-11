import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Mengambil kredensial Supabase dari environment variables
const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim();
const supabaseKey = (process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Kredensial Supabase tidak lengkap. Harap pastikan SUPABASE_URL dan SUPABASE_KEY telah diisi di file .env.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
console.log('⚡ Database: 100% Menggunakan Supabase Cloud');

// ==========================================
// OPERASI DATA (EKSKLUSIF SUPABASE)
// ==========================================

// 1. Dapatkan Semua Film / Serial
export async function getAllMovies(filters = {}) {
  let query = supabase.from('movies').select('*').order('created_at', { ascending: false });

  if (filters.type && filters.type !== 'all') {
    query = query.eq('type', filters.type);
  }

  if (filters.search) {
    const q = `%${filters.search.trim()}%`;
    query = query.or(`title.ilike.${q},genre.ilike.${q},description.ilike.${q}`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Supabase getAllMovies error:', error.message);
    throw error;
  }

  return data || [];
}

// 2. Dapatkan Film Berdasarkan ID
export async function getMovieById(id) {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.warn(`Supabase getMovieById (${id}) warning:`, error.message);
    return null;
  }

  return data;
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('movies')
    .insert([newMovie])
    .select()
    .single();

  if (error) {
    console.error('Supabase createMovie error:', error.message);
    throw error;
  }

  return data;
}

// 4. Update Film / Serial
export async function updateMovie(id, updateData) {
  const payload = {
    ...updateData,
    updated_at: new Date().toISOString()
  };
  if (payload.year !== undefined) payload.year = Number(payload.year);

  const { data, error } = await supabase
    .from('movies')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Supabase updateMovie error:', error.message);
    throw error;
  }

  return data;
}

// 5. Hapus Film / Serial
export async function deleteMovie(id) {
  const { error } = await supabase
    .from('movies')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase deleteMovie error:', error.message);
    throw error;
  }

  return true;
}
