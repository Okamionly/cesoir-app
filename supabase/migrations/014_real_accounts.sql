-- ========================================================================
-- Migration 014: 10 REAL user accounts (loginable via Supabase auth)
-- ========================================================================
-- Additive to migration 013 (20 demo profiles). These 10 accounts differ:
--
--   Demo (013) : email seed-XX@cesoir-demo.local, empty encrypted_password
--                → cannot log in, just DB rows for UI display
--
--   Real (014) : email firstname.lastname@cesoir.app, bcrypt-hashed password
--                → user can log in via the login form with
--                  PASSWORD = CeSoir2026!  (same for all 10)
--
-- All 10 accounts share the same password for simplicity — change later if
-- needed via Supabase dashboard.
--
-- Clean-up later:
--   DELETE FROM auth.users WHERE email LIKE '%@cesoir.app';
-- (profiles cascade via FK on auth.users).
-- ========================================================================

DO $$
DECLARE
  real_users jsonb := '[
    {"idx": 1,  "email": "ines.moreau@cesoir.app",   "name": "Ines",    "age": 27, "gender": "femme", "looking_for": "hommes", "photo": "1558898479-33c0057a5d12", "lat": 48.8649, "lng": 2.3800, "city": "Republique",     "bio": "Journaliste mode, j''ecris sur les createurs emergents parisiens. Le dimanche c''est marche aux Puces + brunch a Belleville.",            "modes": ["culture-club", "foodie-quest"]},
    {"idx": 2,  "email": "alex.dubois@cesoir.app",   "name": "Alex",    "age": 30, "gender": "homme", "looking_for": "femmes", "photo": "1508214751196-bcfd4ca60f91", "lat": 48.8575, "lng": 2.3515, "city": "Chatelet",       "bio": "Product manager dans une startup fintech, triathlete du weekend. Je cours, je nage, je code — et je cuisine correctement l''italien.", "modes": ["fit-date", "solo-diner"]},
    {"idx": 3,  "email": "sofia.leclerc@cesoir.app", "name": "Sofia",   "age": 25, "gender": "femme", "looking_for": "tous",   "photo": "1524502397800-2eeaad7c3fe5", "lat": 48.8836, "lng": 2.3446, "city": "Abbesses",       "bio": "Doctorante en histoire de l''art, pianiste amatrice. Je connais toutes les expos gratuites du mois et les boulangeries du 18e.",         "modes": ["culture-club", "sober-tonight"]},
    {"idx": 4,  "email": "tom.nguyen@cesoir.app",    "name": "Tom",     "age": 28, "gender": "homme", "looking_for": "femmes", "photo": "1509967419530-da38b4704bc6", "lat": 48.8741, "lng": 2.3601, "city": "Gare du Nord",   "bio": "Ingenieur mecanique, passionne velo vintage. J''ai remonte un Peugeot 1970 — toi aussi tu veux apprendre a reparer ta chaine ?",            "modes": ["fit-date", "plus-one"]},
    {"idx": 5,  "email": "lila.benali@cesoir.app",   "name": "Lila",    "age": 26, "gender": "femme", "looking_for": "hommes", "photo": "1502823403499-6ccfcf4fb453", "lat": 48.8606, "lng": 2.3376, "city": "Palais Royal",   "bio": "Avocate en droit de la culture, accro aux petits cinemas d''art et essai. Viens avec un vrai avis sur le dernier Farhadi.",               "modes": ["culture-club", "night-owl"]},
    {"idx": 6,  "email": "nathan.roux@cesoir.app",   "name": "Nathan",  "age": 32, "gender": "homme", "looking_for": "tous",   "photo": "1503185912284-5271ff81b9a8", "lat": 48.8690, "lng": 2.3091, "city": "Ternes",         "bio": "Chef patissier au Meurice, puis freelance. Mes preferes : le nuage au chocolat et les balades au parc Monceau apres le service.",           "modes": ["foodie-quest", "dog-date"]},
    {"idx": 7,  "email": "zoe.martin@cesoir.app",    "name": "Zoe",     "age": 24, "gender": "femme", "looking_for": "tous",   "photo": "1531427186611-ecfd6d936c79", "lat": 48.8584, "lng": 2.3938, "city": "Nation",         "bio": "Community manager dans la musique, DJ les vendredis. Je connais les meilleurs bars electro du 11e/12e — on va danser ?",                    "modes": ["night-owl", "langue"]},
    {"idx": 8,  "email": "julien.chen@cesoir.app",   "name": "Julien",  "age": 29, "gender": "homme", "looking_for": "femmes", "photo": "1541534741688-6078c6bfb5c5", "lat": 48.8456, "lng": 2.3750, "city": "Place d''Italie", "bio": "Medecin generaliste, boxeur amateur. Apres mes gardes j''aime juste un dim sum a Chinatown et un bon film HK des annees 90.",           "modes": ["fit-date", "foodie-quest"]},
    {"idx": 9,  "email": "marie.lefevre@cesoir.app", "name": "Marie",   "age": 33, "gender": "femme", "looking_for": "hommes", "photo": "1509909756405-be0199881695", "lat": 48.8915, "lng": 2.3215, "city": "Batignolles",    "bio": "Designer UX dans l''edition jeunesse, maman d''un lapin nain nomme Pepito. Oui je suis cliche, non je ne changerai pas.",                   "modes": ["plus-one", "breakup"]},
    {"idx": 10, "email": "adam.rossi@cesoir.app",    "name": "Adam",    "age": 31, "gender": "homme", "looking_for": "femmes", "photo": "1551836022-deb4988cc6c0", "lat": 48.8785, "lng": 2.3500, "city": "Opera",          "bio": "Pianiste jazz, je joue dans un club du 9e deux soirs par semaine. Sinon dispo pour un verre tranquille et une vraie conversation.",        "modes": ["night-owl", "new-in-town"]}
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
    -- Deterministic UUID per real user. Namespace 4001-8001 so it never
    -- collides with the 4000-8000 namespace used by migration 013.
    real_uuid := ('00000000-0000-4001-8001-' || lpad((u->>'idx'), 12, '0'))::uuid;
    real_email := u->>'email';

    -- Spread online state: 70% online for better showcase
    is_online_val := ((u->>'idx')::int % 10) < 7;

    -- Recent last_seen: 1-45 min ago
    last_seen_offset := ((((u->>'idx')::int * 5) % 45) + 1) * interval '1 minute';

    -- 1. auth.users row with REAL bcrypt password hash.
    -- extensions.crypt() + extensions.gen_salt('bf') comes from pgcrypto.
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
      jsonb_build_object('seed_real', true, 'name', u->>'name'),
      now() - interval '7 days',
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

    -- 2. profiles row (schema matches 013)
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
      now() - interval '7 days',
      now(),
      4.6 + ((u->>'idx')::int % 4) * 0.1,
      ((u->>'idx')::int % 6) + 2
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

  RAISE NOTICE 'Migration 014: 10 real accounts inserted. Password = CeSoir2026!';
END $$;
