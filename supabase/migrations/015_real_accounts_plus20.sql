-- ========================================================================
-- Migration 015: +20 REAL user accounts (loginable via Supabase auth)
-- ========================================================================
-- Additive to migration 014 (which added 10 real accounts). Same pattern:
-- bcrypt-hashed password shared across all 20 so the user can log in from
-- the normal login form.
--
--   PASSWORD = CeSoir2026!  (same as 014)
--
-- UUID namespace: 4002-8002 (distinct from 013's 4000-8000 and 014's
-- 4001-8001 so no collisions).
--
-- 20 new @cesoir.app emails (all fictional, distinct from 014):
--   emma.garcia, louis.silva, clara.bernard, raphael.ferrari, jade.petit,
--   ethan.cohen, anais.thibault, gabriel.blanc, manon.mercier, hugo.lambert,
--   lea.fontaine, matteo.giraud, elena.robert, aaron.schmitt, chloe.renard,
--   noah.leroy, lucie.fischer, samuel.moreau, yasmine.attia, arthur.dupont
--
-- All 20 photos are NEW Unsplash portrait IDs — distinct from the 30 used
-- in 013+014.
--
-- Clean-up later (removes 014 + 015 in one shot):
--   DELETE FROM auth.users WHERE email LIKE '%@cesoir.app';
-- (profiles cascade via FK on auth.users).
-- ========================================================================

DO $$
DECLARE
  real_users jsonb := '[
    {"idx": 1,  "email": "emma.garcia@cesoir.app",      "name": "Emma",     "age": 26, "gender": "femme", "looking_for": "hommes", "photo": "1484399172022-72a90b12e3c1", "lat": 48.8708, "lng": 2.3650, "city": "Canal Saint-Martin", "bio": "Architecte junior, passionnee d''expos et de long dinners. Big fan de jazz le dimanche, toujours partante pour une vraie discussion.",    "modes": ["culture-club", "foodie-quest"]},
    {"idx": 2,  "email": "louis.silva@cesoir.app",      "name": "Louis",    "age": 29, "gender": "homme", "looking_for": "femmes", "photo": "1552058544-f2b08422138a",   "lat": 48.8675, "lng": 2.3637, "city": "Republique",          "bio": "Dev backend, coureur matinal. Cherche des plans spontanes apres le taf et quelqu''un pour tester les nouveaux spots du 10e.",              "modes": ["fit-date", "solo-diner"]},
    {"idx": 3,  "email": "clara.bernard@cesoir.app",    "name": "Clara",    "age": 24, "gender": "femme", "looking_for": "tous",   "photo": "1525134479668-1bee5c7c6845", "lat": 48.8645, "lng": 2.3762, "city": "Oberkampf",           "bio": "Illustratrice freelance, a fond sur les librairies inde et les rooftops d''ete. Dessine tout le temps, meme les inconnus dans le metro.",   "modes": ["culture-club", "night-owl"]},
    {"idx": 4,  "email": "raphael.ferrari@cesoir.app",  "name": "Raphael",  "age": 33, "gender": "homme", "looking_for": "femmes", "photo": "1527960471264-932f39eb5846", "lat": 48.8875, "lng": 2.3210, "city": "Batignolles",         "bio": "Consultant en strategie, escalade deux fois par semaine. Week-ends Fontainebleau, semaines bouchonnees. Amateur de vin orange.",            "modes": ["fit-date", "plus-one"]},
    {"idx": 5,  "email": "jade.petit@cesoir.app",       "name": "Jade",     "age": 27, "gender": "femme", "looking_for": "hommes", "photo": "1541534741688-6078c6bfb5c5", "lat": 48.8822, "lng": 2.3370, "city": "Pigalle",             "bio": "Chef de projet dans l''audiovisuel, traine dans les bars du 9e jusqu''a 2h. Fan de soul, de films coreens, de rires francs.",                "modes": ["night-owl", "foodie-quest"]},
    {"idx": 6,  "email": "ethan.cohen@cesoir.app",      "name": "Ethan",    "age": 31, "gender": "homme", "looking_for": "tous",   "photo": "1502378735452-bc7d86632805", "lat": 48.8724, "lng": 2.3822, "city": "Belleville",          "bio": "Prof de philo en lycee, ecrivain a mes heures. Balade au parc de Belleville au coucher, et debat toute la soiree si besoin.",              "modes": ["culture-club", "sober-tonight"]},
    {"idx": 7,  "email": "anais.thibault@cesoir.app",   "name": "Anais",    "age": 25, "gender": "femme", "looking_for": "tous",   "photo": "1495603889488-42d1d66e5523", "lat": 48.8566, "lng": 2.3622, "city": "Marais",              "bio": "Photographe, bouquins de mode et cappuccino avec mousse parfaite. Je cherche quelqu''un qui sait juste etre present sans forcer.",           "modes": ["plus-one", "breakup"]},
    {"idx": 8,  "email": "gabriel.blanc@cesoir.app",    "name": "Gabriel",  "age": 35, "gender": "homme", "looking_for": "femmes", "photo": "1534528741702-a0cfae58b707", "lat": 48.8530, "lng": 2.3692, "city": "Bastille",            "bio": "Kine du sport, passionne de cuisine du sud. Je grille tout au barbecue l''ete. Courses matinales au bord du canal.",                         "modes": ["fit-date", "foodie-quest"]},
    {"idx": 9,  "email": "manon.mercier@cesoir.app",    "name": "Manon",    "age": 28, "gender": "femme", "looking_for": "hommes", "photo": "1542909168-82c3e7fdca5c",   "lat": 48.8867, "lng": 2.3431, "city": "Montmartre",          "bio": "Productrice musicale, caetano veloso en boucle. Mon chat s''appelle Godard. Dispo pour une balade Montmartre sans touristes.",             "modes": ["culture-club", "dog-date"]},
    {"idx": 10, "email": "hugo.lambert@cesoir.app",     "name": "Hugo",     "age": 30, "gender": "homme", "looking_for": "femmes", "photo": "1488426862026-3ee34a7d66df", "lat": 48.8675, "lng": 2.3637, "city": "Republique",          "bio": "Avocat en droit des affaires, runner tres serieux (ou trop). Les dimanches c''est brunch puis flanerie au Marais.",                         "modes": ["fit-date", "new-in-town"]},
    {"idx": 11, "email": "lea.fontaine@cesoir.app",     "name": "Lea",      "age": 23, "gender": "femme", "looking_for": "tous",   "photo": "1531123414780-f74242c2b052", "lat": 48.8422, "lng": 2.3219, "city": "Montparnasse",        "bio": "Etudiante en medecine, stagiaire epuisee mais joyeuse. Je prefere une vraie conversation au 3e verre plutot qu''une soiree grosse ambiance.", "modes": ["sober-tonight", "solo-diner"]},
    {"idx": 12, "email": "matteo.giraud@cesoir.app",    "name": "Matteo",   "age": 34, "gender": "homme", "looking_for": "femmes", "photo": "1507442067783-55db1d7d79c9", "lat": 48.8315, "lng": 2.3549, "city": "Place d''Italie",    "bio": "Ingenieur en IA, grand fan de jazz. Je joue de la basse, mal, mais avec amour. Club du 13e tous les jeudis.",                                "modes": ["night-owl", "langue"]},
    {"idx": 13, "email": "elena.robert@cesoir.app",     "name": "Elena",    "age": 29, "gender": "femme", "looking_for": "tous",   "photo": "1507019403-1823c3c30dee",   "lat": 48.8708, "lng": 2.3650, "city": "Canal Saint-Martin",  "bio": "UX researcher chez une scale-up, bilingue italienne. Ramen du 10e, lectures en terrasse, et pas mal d''energie apres 20h.",                "modes": ["foodie-quest", "langue"]},
    {"idx": 14, "email": "aaron.schmitt@cesoir.app",    "name": "Aaron",    "age": 27, "gender": "homme", "looking_for": "tous",   "photo": "1513829596324-4bb2800c5efb", "lat": 48.8566, "lng": 2.3622, "city": "Marais",              "bio": "Graphiste, ancien prof de yoga. J''habite a cote du Marche des Enfants Rouges. Lundi sans alcool, vendredi sans regrets.",                   "modes": ["sober-tonight", "fit-date"]},
    {"idx": 15, "email": "chloe.renard@cesoir.app",     "name": "Chloe",    "age": 32, "gender": "femme", "looking_for": "hommes", "photo": "1563306406-e66174fa3787",   "lat": 48.8875, "lng": 2.3210, "city": "Batignolles",         "bio": "Traductrice litteraire, vegetarienne convaincue. Le week-end c''est vide-greniers et pates fraiches maison, toujours.",                      "modes": ["plus-one", "foodie-quest"]},
    {"idx": 16, "email": "noah.leroy@cesoir.app",       "name": "Noah",     "age": 22, "gender": "homme", "looking_for": "femmes", "photo": "1528375430426-53ec5f4b08d7", "lat": 48.8645, "lng": 2.3762, "city": "Oberkampf",           "bio": "Etudiant en cinema, deja 200 films vus cette annee. Je cherche quelqu''un pour dissequer un film apres la seance.",                           "modes": ["culture-club", "gamer-night"]},
    {"idx": 17, "email": "lucie.fischer@cesoir.app",    "name": "Lucie",    "age": 31, "gender": "femme", "looking_for": "tous",   "photo": "1531891437562-a180f48ab1db", "lat": 48.8724, "lng": 2.3822, "city": "Belleville",          "bio": "Designer produit, mutee de Berlin il y a 6 mois. Toujours a la recherche des meilleures brasseries artisanales du Nord-Est.",               "modes": ["new-in-town", "langue"]},
    {"idx": 18, "email": "samuel.moreau@cesoir.app",    "name": "Samuel",   "age": 38, "gender": "homme", "looking_for": "femmes", "photo": "1528740561666-dc2479dc08ab", "lat": 48.8530, "lng": 2.3692, "city": "Bastille",            "bio": "Journaliste politique, papa d''un border collie nomme Kepler. Courses du samedi matin, longues balades quai de la Rapee.",                  "modes": ["dog-date", "breakup"]},
    {"idx": 19, "email": "yasmine.attia@cesoir.app",    "name": "Yasmine",  "age": 26, "gender": "femme", "looking_for": "hommes", "photo": "1520813792240-56fc4a3765a7", "lat": 48.8822, "lng": 2.3370, "city": "Pigalle",             "bio": "Pharmacienne hospitaliere, passionnee de patisserie orientale. Mon baklava est legendaire et je le prouve si on matche.",                   "modes": ["foodie-quest", "sober-tonight"]},
    {"idx": 20, "email": "arthur.dupont@cesoir.app",    "name": "Arthur",   "age": 33, "gender": "homme", "looking_for": "tous",   "photo": "1536766820879-059fec98ec0a", "lat": 48.8867, "lng": 2.3431, "city": "Montmartre",          "bio": "Data scientist reconverti en independant. Pianiste du dimanche soir, amateur de whisky japonais et de films de Kore-eda.",                  "modes": ["night-owl", "culture-club"]}
  ]'::jsonb;

  u jsonb;
  real_uuid uuid;
  real_email text;
  is_online_val boolean;
  last_seen_offset interval;
  mode_key text;
  plain_password text := 'CeSoir2026!';
BEGIN
  FOR u IN SELECT jsonb_array_elements(real_users)
  LOOP
    -- Deterministic UUID per real user. Namespace 4002-8002 so it never
    -- collides with 4000-8000 (013) or 4001-8001 (014).
    real_uuid := ('00000000-0000-4002-8002-' || lpad((u->>'idx'), 12, '0'))::uuid;
    real_email := u->>'email';

    -- Spread online state: ~60% online (12/20)
    -- idx mod 10 < 6  →  idx 1,2,3,4,5,11,12,13,14,15 online = 10
    -- Add idx 8, 18 for total 12 online.
    is_online_val := ((u->>'idx')::int % 10) < 6
                     OR (u->>'idx')::int IN (8, 18);

    -- last_seen:
    --   online  → 1-55 min ago (recent)
    --   offline → 2-22 h ago  (within last day)
    IF is_online_val THEN
      last_seen_offset := ((((u->>'idx')::int * 7) % 55) + 1) * interval '1 minute';
    ELSE
      last_seen_offset := ((((u->>'idx')::int * 3) % 20) + 2) * interval '1 hour';
    END IF;

    -- 1. auth.users row with REAL bcrypt password hash.
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      is_super_admin
    ) VALUES (
      real_uuid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      real_email,
      extensions.crypt(plain_password, extensions.gen_salt('bf')),
      now(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object('seed_real', true, 'name', u->>'name', 'batch', 'plus20'),
      now() - interval '5 days',
      now(),
      '',
      '',
      '',
      '',
      false
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      encrypted_password = EXCLUDED.encrypted_password,
      email_confirmed_at = EXCLUDED.email_confirmed_at,
      updated_at = now();

    -- 2. profiles row
    INSERT INTO profiles (
      id,
      name,
      age,
      gender,
      looking_for,
      bio,
      avatar_url,
      location,
      city,
      is_online,
      is_verified,
      last_seen,
      created_at,
      updated_at,
      reliability_score,
      total_meetups
    ) VALUES (
      real_uuid,
      u->>'name',
      (u->>'age')::int,
      u->>'gender',
      u->>'looking_for',
      u->>'bio',
      'https://images.unsplash.com/photo-' || (u->>'photo') || '?w=600&h=800&fit=crop&crop=faces&auto=format&q=80',
      ST_SetSRID(ST_MakePoint((u->>'lng')::float, (u->>'lat')::float), 4326)::geography,
      u->>'city',
      is_online_val,
      true,
      now() - last_seen_offset,
      now() - interval '5 days',
      now(),
      4.5 + ((u->>'idx')::int % 5) * 0.1,
      ((u->>'idx')::int % 7) + 1
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      age = EXCLUDED.age,
      gender = EXCLUDED.gender,
      looking_for = EXCLUDED.looking_for,
      bio = EXCLUDED.bio,
      avatar_url = EXCLUDED.avatar_url,
      location = EXCLUDED.location,
      city = EXCLUDED.city,
      is_online = EXCLUDED.is_online,
      is_verified = EXCLUDED.is_verified,
      last_seen = EXCLUDED.last_seen,
      updated_at = now();

    -- 3. mode_activations rows
    FOR mode_key IN SELECT jsonb_array_elements_text(u->'modes')
    LOOP
      INSERT INTO mode_activations (
        user_id,
        mode,
        is_active,
        available_time,
        details,
        expires_at,
        created_at
      ) VALUES (
        real_uuid,
        mode_key,
        true,
        'Dispo ce soir',
        '{}'::jsonb,
        now() + interval '12 hours',
        now() - interval '1 hour'
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Migration 015: +20 real accounts inserted. Password = CeSoir2026!';
END $$;
