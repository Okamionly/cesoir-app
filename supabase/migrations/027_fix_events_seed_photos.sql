-- ========================================================================
-- Migration 027: Fix wrong cover photos on seeded events
-- ========================================================================
-- Production fix for Bug P1 (2026-04-27): "Afterwork Electro-Jazz —
-- La Grosse Radio" was rendering with an unrelated stock photo of
-- Scrabble tiles spelling "READ" (Unsplash ID photo-1546074177-ffdda98d214f).
-- Migration 020 has been corrected at source for fresh installs, but
-- existing databases need this UPDATE to propagate the fix without
-- re-running the seed.
--
-- New cover: photo-1514525253161-7a46d19cd819 — jazz/nightclub stage,
-- low-light, fits the electro-jazz afterwork vibe.
--
-- Idempotent: safe to re-run, only touches events whose cover_url is
-- still the old (wrong) Scrabble URL.
-- ========================================================================

UPDATE public.events
SET flyer_url = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80&auto=format'
WHERE title LIKE '%Afterwork Electro-Jazz%'
  AND flyer_url LIKE '%photo-1546074177-ffdda98d214f%';
