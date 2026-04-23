-- ========================================================================
-- Migration 020: Seed 10 Montpellier events (launch day catalogue)
-- ========================================================================
-- Curated catalogue for the Soirées launch. Ten real venues across
-- Montpellier, dates spread across the next 14 days so the list screen
-- always has 4–5 upcoming options.
--
-- Venues (authoritative Montpellier nightlife):
--   1.  Rockstore          — 20 rue de Verdun                (43.6086, 3.8786)
--   2.  L'Antirouille      — 12 rue Anatole France           (43.6067, 3.8801)
--   3.  Panama Café        — 5 rue du Pila Saint-Gely         (43.6129, 3.8763)
--   4.  Black Sheep Pub    — 40 rue de l'Aiguillerie          (43.6123, 3.8752)
--   5.  Le Dôme (Rooftop)  — 9 rue du Bayle                   (43.6106, 3.8773)
--   6.  La Barbote         — 22 rue Terral                    (43.6104, 3.8758)
--   7.  Secret Place       — 25 rue Saint-Côme                (43.6113, 3.8765)
--   8.  Salle Rabelais     — 27 boulevard Sarrail             (43.6112, 3.8805)
--   9.  Cargo Club         — Route de Palavas                 (43.5731, 3.8956)
--   10. La Grosse Radio    — 8 rue du Plan d'Agde             (43.6078, 3.8790)
--
-- Flyer images: Unsplash photo IDs (commercial use allowed, hotlinkable).
-- Every URL uses `?w=1200&q=80&auto=format` for reasonable transfer size.
--
-- Timing anchor: reference date is migration apply date. Using relative
-- offsets (`CURRENT_DATE + N`) keeps the seed fresh across re-runs.
-- ========================================================================

INSERT INTO public.events (
  slug, title, description, flyer_url,
  venue_name, venue_address, venue_location, city_slug,
  starts_at, ends_at, door_price_eur, ticket_url,
  categories, lineup, featured, source
) VALUES
-- #1 — Techno vendredi Rockstore (J+2)
(
  'rockstore-techno-night-2026-04-25',
  'Techno Warehouse — Rockstore',
  'Soirée techno signature du Rockstore. Trois DJs internationaux, lights immersive, 500 clubbers. Bar ouvert jusqu''à 4h.',
  'https://images.unsplash.com/photo-1571266028243-7d06f5066e2b?w=1200&q=80&auto=format',
  'Rockstore', '20 rue de Verdun, 34000 Montpellier',
  ST_SetSRID(ST_MakePoint(3.8786, 43.6086), 4326)::geography,
  'montpellier',
  (CURRENT_DATE + 2)::timestamptz + interval '21 hours',
  (CURRENT_DATE + 3)::timestamptz + interval '4 hours',
  15.00, 'https://shotgun.live/fr/events/rockstore-techno',
  ARRAY['techno','club','dj_set']::public.event_category[],
  ARRAY['Kobosil','Héctor Oaks','LSDXOXO']::text[],
  true, 'manual_curated'
),

-- #2 — Jazz Quartet jeudi L'Antirouille (J+1)
(
  'antirouille-jazz-quartet-2026-04-24',
  'Jazz Quartet Live — L''Antirouille',
  'Quartet montpelliérain revisite les standards de Coltrane et Mingus. Format intimiste, concert assis, cocktails d''après.',
  'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1200&q=80&auto=format',
  'L''Antirouille', '12 rue Anatole France, 34000 Montpellier',
  ST_SetSRID(ST_MakePoint(3.8801, 43.6067), 4326)::geography,
  'montpellier',
  (CURRENT_DATE + 1)::timestamptz + interval '20 hours',
  (CURRENT_DATE + 2)::timestamptz + interval '0 hours',
  12.00, NULL,
  ARRAY['jazz','live_music','bar']::public.event_category[],
  ARRAY['Louis Matute Quartet']::text[],
  false, 'manual_curated'
),

-- #3 — House Rooftop dimanche Le Dôme (J+3)
(
  'dome-rooftop-sunset-house-2026-04-26',
  'Sunset House — Le Dôme Rooftop',
  'Coucher de soleil sur les toits de Montpellier, house tech profonde. Vue 360°, apéro tapas, vibes dimanche.',
  'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=1200&q=80&auto=format',
  'Le Dôme', '9 rue du Bayle, 34000 Montpellier',
  ST_SetSRID(ST_MakePoint(3.8773, 43.6106), 4326)::geography,
  'montpellier',
  (CURRENT_DATE + 3)::timestamptz + interval '18 hours',
  (CURRENT_DATE + 3)::timestamptz + interval '23 hours',
  10.00, 'https://shotgun.live/fr/events/dome-sunset',
  ARRAY['house','rooftop','apero','dj_set']::public.event_category[],
  ARRAY['Folamour','Voilaaa']::text[],
  true, 'manual_curated'
),

-- #4 — Soirée étudiante électro Panama mercredi (J+7)
(
  'panama-student-electro-night-2026-04-30',
  'Étudiant·e·s en Folie — Panama Café',
  'Soirée étudiante hebdo : électro, pop, hip-hop. Shots à 3€, entrée libre avant 23h avec carte étudiante.',
  'https://images.unsplash.com/photo-1524824267900-2fa9cbf7a506?w=1200&q=80&auto=format',
  'Panama Café', '5 rue du Pila Saint-Gely, 34000 Montpellier',
  ST_SetSRID(ST_MakePoint(3.8763, 43.6129), 4326)::geography,
  'montpellier',
  (CURRENT_DATE + 7)::timestamptz + interval '22 hours',
  (CURRENT_DATE + 8)::timestamptz + interval '3 hours',
  NULL, NULL,
  ARRAY['electro','pop','hip_hop','club','gratuit']::public.event_category[],
  ARRAY['DJ Loris','DJ Nayla']::text[],
  false, 'manual_curated'
),

-- #5 — Hip Hop Night samedi Black Sheep (J+1 = +1 en fait 8)
(
  'black-sheep-hip-hop-night-2026-05-02',
  'Hip Hop Night — Black Sheep',
  'Pub anglais, ambiance intime, DJ set hip-hop old-school & boom bap. Bières artisanales, pas d''entrée.',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80&auto=format',
  'Black Sheep Pub', '40 rue de l''Aiguillerie, 34000 Montpellier',
  ST_SetSRID(ST_MakePoint(3.8752, 43.6123), 4326)::geography,
  'montpellier',
  (CURRENT_DATE + 9)::timestamptz + interval '21 hours 30 minutes',
  (CURRENT_DATE + 10)::timestamptz + interval '2 hours',
  0.00, NULL,
  ARRAY['hip_hop','bar','dj_set','gratuit']::public.event_category[],
  ARRAY['DJ Cut Killer','DJ Sya Styles']::text[],
  false, 'manual_curated'
),

-- #6 — Reggae & Dub vendredi La Barbote (J+9)
(
  'barbote-reggae-dub-session-2026-05-02',
  'Reggae Dub Session — La Barbote',
  'Soirée sound system. Bass lourdes, vibes Kingston 1975. Plancha jerk chicken sur place.',
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80&auto=format',
  'La Barbote', '22 rue Terral, 34000 Montpellier',
  ST_SetSRID(ST_MakePoint(3.8758, 43.6104), 4326)::geography,
  'montpellier',
  (CURRENT_DATE + 9)::timestamptz + interval '21 hours',
  (CURRENT_DATE + 10)::timestamptz + interval '2 hours',
  8.00, NULL,
  ARRAY['reggae','bar','live_music','dj_set']::public.event_category[],
  ARRAY['Lion Heart Sound','Dubamix']::text[],
  false, 'manual_curated'
),

-- #7 — Rock indé samedi Secret Place (J+10)
(
  'secret-place-indie-rock-2026-05-03',
  'Indie Rock Showcase — Secret Place',
  'Trois groupes indé locaux + un groupe invité de Toulouse. Concert + DJ set after jusqu''à 3h.',
  'https://images.unsplash.com/photo-1501612780327-45045538702b?w=1200&q=80&auto=format',
  'Secret Place', '25 rue Saint-Côme, 34000 Montpellier',
  ST_SetSRID(ST_MakePoint(3.8765, 43.6113), 4326)::geography,
  'montpellier',
  (CURRENT_DATE + 10)::timestamptz + interval '20 hours 30 minutes',
  (CURRENT_DATE + 11)::timestamptz + interval '3 hours',
  14.00, 'https://shotgun.live/fr/events/secret-place-indie',
  ARRAY['rock','indie','live_music','club']::public.event_category[],
  ARRAY['Feu! Chatterton tribute','Tout Petit Monde','Lysistrata']::text[],
  false, 'manual_curated'
),

-- #8 — Afrobeat & Amapiano Cargo (J+11)
(
  'cargo-afrobeat-amapiano-night-2026-05-04',
  'Afrobeat & Amapiano — Cargo Club',
  'Grand club en bord de mer. Line-up 100% afro-sound, dancefloor outdoor. Shuttle depuis centre-ville.',
  'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=1200&q=80&auto=format',
  'Cargo Club', 'Route de Palavas, 34970 Lattes',
  ST_SetSRID(ST_MakePoint(3.8956, 43.5731), 4326)::geography,
  'montpellier',
  (CURRENT_DATE + 11)::timestamptz + interval '23 hours',
  (CURRENT_DATE + 12)::timestamptz + interval '6 hours',
  18.00, 'https://shotgun.live/fr/events/cargo-afrobeat',
  ARRAY['afro','house','club','open_air','dj_set']::public.event_category[],
  ARRAY['DJ Enimoney','Major League DJz','Ayuune Sule']::text[],
  true, 'manual_curated'
),

-- #9 — Afterwork jazz/electro jeudi Grosse Radio (J+6)
(
  'grosse-radio-afterwork-2026-04-30',
  'Afterwork Electro-Jazz — La Grosse Radio',
  'Sortie bureau 19h-minuit. Cocktails signature, fusion jazz/electro, food truck ceviche à l''extérieur.',
  'https://images.unsplash.com/photo-1546074177-ffdda98d214f?w=1200&q=80&auto=format',
  'La Grosse Radio', '8 rue du Plan d''Agde, 34000 Montpellier',
  ST_SetSRID(ST_MakePoint(3.8790, 43.6078), 4326)::geography,
  'montpellier',
  (CURRENT_DATE + 7)::timestamptz + interval '19 hours',
  (CURRENT_DATE + 8)::timestamptz + interval '0 hours',
  0.00, NULL,
  ARRAY['jazz','electro','afterwork','bar','apero','gratuit']::public.event_category[],
  ARRAY['DJ Ema','DJ Lukas']::text[],
  false, 'manual_curated'
),

-- #10 — Culture / Expo mardi Salle Rabelais (J+5)
(
  'rabelais-expo-nocturne-2026-04-29',
  'Expo Nocturne — Salle Rabelais',
  'Vernissage exposition photo "Méditerranée 2050". Visite guidée 19h, concert acoustique 21h, bar vin nature.',
  'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=1200&q=80&auto=format',
  'Salle Rabelais', '27 boulevard Sarrail, 34000 Montpellier',
  ST_SetSRID(ST_MakePoint(3.8805, 43.6112), 4326)::geography,
  'montpellier',
  (CURRENT_DATE + 6)::timestamptz + interval '19 hours',
  (CURRENT_DATE + 6)::timestamptz + interval '23 hours',
  5.00, NULL,
  ARRAY['culture','expo','apero','live_music']::public.event_category[],
  ARRAY['Photographe Inès Di Folco','Trio acoustique Lumine']::text[],
  false, 'manual_curated'
);
