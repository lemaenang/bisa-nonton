-- ========================================================
-- BISA NONTON - Supabase Database Schema
-- Salin dan jalankan skrip ini di SQL Editor dashboard Supabase Anda
-- ========================================================

-- 1. Buat Tabel Movies
CREATE TABLE IF NOT EXISTS public.movies (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    backdrop_url TEXT,
    type TEXT NOT NULL DEFAULT 'movie', -- 'movie' atau 'series'
    year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    genre TEXT DEFAULT 'Favorit',
    stream_url TEXT,
    episodes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Izinkan siapa saja membaca katalog film (Public Read)
CREATE POLICY "Public can view movies" 
ON public.movies 
FOR SELECT 
USING (true);

-- 4. Policy: Izinkan penambahan film (Insert)
CREATE POLICY "Public can insert movies" 
ON public.movies 
FOR INSERT 
WITH CHECK (true);

-- 5. Policy: Izinkan pembaruan film (Update)
CREATE POLICY "Public can update movies" 
ON public.movies 
FOR UPDATE 
USING (true);

-- 6. Policy: Izinkan penghapusan film (Delete)
CREATE POLICY "Public can delete movies" 
ON public.movies 
FOR DELETE 
USING (true);

-- 7. Insert Data Sampel Awal (Opsional)
INSERT INTO public.movies (id, title, description, cover_url, backdrop_url, type, year, genre, stream_url, episodes)
VALUES 
(
    'm-sample-01',
    'Demon Slayer: Kimetsu no Yaiba',
    'Tanjiro Kamado berjuang menyelamatkan adiknya yang telah berubah menjadi iblis sambil membasmi para iblis jahat.',
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1600&auto=format&fit=crop&q=80',
    'movie',
    2024,
    'Action, Animation, Fantasy',
    'https://stream.playcdn.de/playlist/f6d90656d4868a0eddebc7674872ea9a/3/480.m3u8?x=1',
    '[]'::jsonb
),
(
    's-sample-02',
    'Cyberpunk: Edge Runners',
    'Di kota masa depan yang penuh kekerasan dan teknologi tinggi, seorang anak jalanan berusaha bertahan hidup dengan menjadi seorang edgerunner.',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&auto=format&fit=crop&q=80',
    'series',
    2023,
    'Sci-Fi, Action',
    '',
    '[
      {"id": "ep-1", "episode_number": 1, "title": "Episode 1: Awal Mula", "stream_url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"},
      {"id": "ep-2", "episode_number": 2, "title": "Episode 2: Menembus Batas", "stream_url": "https://stream.playcdn.de/playlist/f6d90656d4868a0eddebc7674872ea9a/3/480.m3u8?x=1"},
      {"id": "ep-3", "episode_number": 3, "title": "Episode 3: Pertarungan Terakhir", "stream_url": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"}
    ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
