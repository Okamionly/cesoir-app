-- ========================================================================
-- Migration 013: Seed 20 demo profiles
-- ========================================================================
-- Creates 20 realistic French demo user profiles to populate /browse, /feed,
-- /map. Each profile has:
--   - auth.users row (seed-XX@cesoir-demo.local, no password — demo only)
--   - profiles row with Unsplash avatar, Paris location, French bio
--   - mode_activations rows (2-3 modes per profile)
--
-- All demo rows are namespaced via email suffix @cesoir-demo.local so they
-- can be cleanly deleted later:
--   DELETE FROM auth.users WHERE email LIKE '%@cesoir-demo.local';
-- (profiles cascade-delete via FK on auth.users).
-- ========================================================================

-- Deterministic UUIDs so re-running the migration stays idempotent via
-- ON CONFLICT. We use namespaced UUIDs derived from a seed.
DO $$
DECLARE
  demo_users jsonb := '[
    {"idx": 1,  "name": "Camille",  "age": 26, "gender": "femme",  "looking_for": "hommes", "photo": "1494790108755-2616b612b593", "lat": 48.8530, "lng": 2.3692, "city": "Bastille",          "bio": "Photographe freelance, passionnee par les expos et les rooftops au sunset. Toujours partante pour un bon cafe et une vraie discussion.",           "modes": ["culture-club", "foodie-quest"]},
    {"idx": 2,  "name": "Thomas",   "age": 29, "gender": "homme",  "looking_for": "femmes", "photo": "1507003211169-0a1dd7228f2d", "lat": 48.8566, "lng": 2.3622, "city": "Marais",            "bio": "Inge software le jour, grimpeur le weekend. Cherche quelqu''un qui aime les vrais plans spontanes, pas les soirees netflix.",                       "modes": ["fit-date", "solo-diner"]},
    {"idx": 3,  "name": "Sarah",    "age": 24, "gender": "femme",  "looking_for": "tous",   "photo": "1438761681033-6461ffad8d80", "lat": 48.8822, "lng": 2.3370, "city": "Pigalle",           "bio": "Journaliste culturelle, accro aux cinemas d''art et aux petits bars de Pigalle. Viens me raconter ta derniere lecture.",                          "modes": ["culture-club", "night-owl"]},
    {"idx": 4,  "name": "Lucas",    "age": 31, "gender": "homme",  "looking_for": "femmes", "photo": "1500648767791-00dcc994a43e", "lat": 48.8724, "lng": 2.3822, "city": "Belleville",        "bio": "Chef dans un bistrot de Belleville. Mon +1 ideal : quelqu''un qui ne dit pas ''je mange de tout'' sans savoir ce que ca veut dire.",             "modes": ["foodie-quest", "plus-one"]},
    {"idx": 5,  "name": "Lea",      "age": 27, "gender": "femme",  "looking_for": "hommes", "photo": "1534528741775-53994a69daeb", "lat": 48.8867, "lng": 2.3431, "city": "Montmartre",        "bio": "Prof de yoga le matin, DJ occasionnelle le soir. Montmartre est mon terrain de jeu — je connais les meilleurs escaliers au coucher du soleil.",   "modes": ["fit-date", "night-owl"]},
    {"idx": 6,  "name": "Antoine",  "age": 33, "gender": "homme",  "looking_for": "femmes", "photo": "1506794778202-cad84cf45f1d", "lat": 48.8875, "lng": 2.3210, "city": "Batignolles",       "bio": "Architecte, passionne de vieux immeubles haussmanniens et de design japonais. On peut parler brutalisme ou sushis, au choix.",                    "modes": ["culture-club", "foodie-quest"]},
    {"idx": 7,  "name": "Clara",    "age": 22, "gender": "femme",  "looking_for": "tous",   "photo": "1531746020798-e6953c6e8e04", "lat": 48.8645, "lng": 2.3762, "city": "Oberkampf",         "bio": "Etudiante en design, jeune parisienne depuis 1 an. Je cherche des locaux pour me montrer le Paris que les touristes ne voient pas.",              "modes": ["new-in-town", "culture-club"]},
    {"idx": 8,  "name": "Hugo",     "age": 28, "gender": "homme",  "looking_for": "femmes", "photo": "1566492031773-4f4e44671857", "lat": 48.8708, "lng": 2.3650, "city": "Canal St-Martin",   "bio": "Developpeur remote, coureur matinal le long du canal. Je suis le gars qui connait toutes les cafes wifi corrects du 10eme.",                      "modes": ["fit-date", "solo-diner"]},
    {"idx": 9,  "name": "Emma",     "age": 30, "gender": "femme",  "looking_for": "hommes", "photo": "1521252659862-eec69941b071", "lat": 48.8530, "lng": 2.3692, "city": "Bastille",          "bio": "Psy en liberal, lectrice compulsive, fan de podcasts. Je cherche quelqu''un qui sait ecouter et qui a des opinions tranchees.",                   "modes": ["culture-club", "solo-diner"]},
    {"idx": 10, "name": "Maxime",   "age": 26, "gender": "homme",  "looking_for": "tous",   "photo": "1507591064344-4c6ce005b128", "lat": 48.8566, "lng": 2.3622, "city": "Marais",            "bio": "Musicien, je joue dans un groupe indie pop. Mes concerts sont gratuits pour un bon +1. Bonus : je fais le meilleur spritz du 3eme.",               "modes": ["plus-one", "night-owl"]},
    {"idx": 11, "name": "Ines",     "age": 25, "gender": "femme",  "looking_for": "hommes", "photo": "1517841905240-472988babdf9", "lat": 48.8822, "lng": 2.3370, "city": "Pigalle",           "bio": "Fleuriste de quartier, fan de marches couverts et de ceramique. Je propose : brunch + chine aux Puces de Vanves samedi.",                           "modes": ["foodie-quest", "sober-tonight"]},
    {"idx": 12, "name": "Paul",     "age": 34, "gender": "homme",  "looking_for": "femmes", "photo": "1519085360753-af0119f7cbe7", "lat": 48.8724, "lng": 2.3822, "city": "Belleville",        "bio": "Proprietaire d''un petit bar a vins. Apres 23h c''est mon moment prefere. Si tu aimes parler pinot jusqu''a 2h, on s''entendra.",             "modes": ["night-owl", "foodie-quest"]},
    {"idx": 13, "name": "Chloe",    "age": 28, "gender": "femme",  "looking_for": "tous",   "photo": "1487412720507-e7ab37603c6f", "lat": 48.8867, "lng": 2.3431, "city": "Montmartre",        "bio": "Illustratrice, chienne Border Collie nomme Pixel. On est les deux un peu hyperactifs. Preference pour les balades au Parc Monceau.",             "modes": ["dog-date", "culture-club"]},
    {"idx": 14, "name": "Matteo",   "age": 32, "gender": "homme",  "looking_for": "femmes", "photo": "1472099645785-5658abf4ff4e", "lat": 48.8875, "lng": 2.3210, "city": "Batignolles",       "bio": "Italien a Paris depuis 5 ans. J''echange volontiers italien contre ton francais imparfait mais charmant. Spritz obligatoire.",                    "modes": ["langue", "foodie-quest"]},
    {"idx": 15, "name": "Louise",   "age": 23, "gender": "femme",  "looking_for": "hommes", "photo": "1496440737103-cd596325d314", "lat": 48.8645, "lng": 2.3762, "city": "Oberkampf",         "bio": "Barmaid dans un speakeasy, aspirante pattissiere. Mode sober tonight : the matcha + patisserie qui font de l''oeil rue de la Roquette.",           "modes": ["sober-tonight", "foodie-quest"]},
    {"idx": 16, "name": "Nathan",   "age": 27, "gender": "homme",  "looking_for": "femmes", "photo": "1560250097-0b93528c311a",     "lat": 48.8708, "lng": 2.3650, "city": "Canal St-Martin",   "bio": "Game dev, fan de JdR et de board games. Ma soirée ideale : une partie de Catan avec des inconnus qui finit en vraie amitie.",                      "modes": ["gamer-night", "solo-diner"]},
    {"idx": 17, "name": "Juliette", "age": 35, "gender": "femme",  "looking_for": "tous",   "photo": "1544005313-94ddf0286df2",     "lat": 48.8530, "lng": 2.3692, "city": "Bastille",          "bio": "Consultante en transition, recemment installee a Paris apres 7 ans a Berlin. J''adore decouvrir les quartiers avec quelqu''un qui les aime.",     "modes": ["new-in-town", "culture-club"]},
    {"idx": 18, "name": "Gabriel",  "age": 30, "gender": "homme",  "looking_for": "femmes", "photo": "1492562080023-ab3db95bfbce", "lat": 48.8566, "lng": 2.3622, "city": "Marais",            "bio": "Avocat en droit social, marathonien amateur. Entre deux dossiers je cours le long de la Seine. Envie d''un footing + brunch dimanche ?",            "modes": ["fit-date", "plus-one"]},
    {"idx": 19, "name": "Manon",    "age": 29, "gender": "femme",  "looking_for": "hommes", "photo": "1554151228-14d9def656e4",     "lat": 48.8822, "lng": 2.3370, "city": "Pigalle",           "bio": "Realisatrice documentaire, chat roux nomme Miles Davis. Je prepare un film sur les noctambules parisiens, ca tombe bien.",                          "modes": ["night-owl", "culture-club"]},
    {"idx": 20, "name": "Arthur",   "age": 38, "gender": "homme",  "looking_for": "femmes", "photo": "1564564321837-a57b7070ac4f", "lat": 48.8724, "lng": 2.3822, "city": "Belleville",        "bio": "Editeur de livres d''art, tout juste divorce, pas du tout presse. Cherche conversations intelligentes et silences confortables.",                 "modes": ["breakup", "culture-club"]}
  ]'::jsonb;

  u jsonb;
  demo_uuid uuid;
  demo_email text;
  is_online_val boolean;
  last_seen_offset interval;
  mode_key text;
BEGIN
  FOR u IN SELECT jsonb_array_elements(demo_users)
  LOOP
    -- Deterministic UUID per demo user (so re-runs are idempotent)
    demo_uuid := ('00000000-0000-4000-8000-' || lpad((u->>'idx'), 12, '0'))::uuid;
    demo_email := 'seed-' || lpad((u->>'idx'), 2, '0') || '@cesoir-demo.local';

    -- 60% online spread: idx 1,2,3,5,6,8,9,11,12,14,15,17,20 = online
    is_online_val := ((u->>'idx')::int % 5) <> 0 AND ((u->>'idx')::int % 7) <> 0;
    is_online_val := is_online_val OR ((u->>'idx')::int IN (1, 3, 5, 8, 11, 14, 17, 20));
    -- Simplify: deterministic ~60%
    is_online_val := ((u->>'idx')::int % 10) < 6;

    -- Recent last_seen: 1-55 min ago
    last_seen_offset := ((((u->>'idx')::int * 7) % 55) + 1) * interval '1 minute';

    -- 1. auth.users (minimal row — no password, no confirmation)
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
      email_change
    ) VALUES (
      demo_uuid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      demo_email,
      '',
      now(),
      jsonb_build_object('provider', 'seed', 'providers', ARRAY['seed']),
      jsonb_build_object('demo', true, 'seed_name', u->>'name'),
      now() - interval '30 days',
      now(),
      '',
      '',
      '',
      ''
    )
    ON CONFLICT (id) DO NOTHING;

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
      demo_uuid,
      u->>'name',
      (u->>'age')::int,
      u->>'gender',
      u->>'looking_for',
      u->>'bio',
      'https://images.unsplash.com/photo-' || (u->>'photo') || '?w=600&h=800&fit=crop&crop=faces&auto=format&q=80',
      ST_SetSRID(ST_MakePoint((u->>'lng')::float, (u->>'lat')::float), 4326)::geography,
      u->>'city',
      is_online_val,
      true, -- demo profiles all verified for better showcase
      now() - last_seen_offset,
      now() - interval '30 days',
      now(),
      4.5 + ((u->>'idx')::int % 5) * 0.1,
      ((u->>'idx')::int % 8) + 1
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

    -- 3. mode_activations (one row per listed mode)
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
        demo_uuid,
        mode_key,
        true,
        'Dispo ce soir',
        '{}'::jsonb,
        now() + interval '12 hours',
        now() - interval '2 hours'
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Seed complete: 20 demo profiles inserted/updated';
END $$;
