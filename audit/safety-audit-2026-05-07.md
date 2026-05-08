# Safety Audit — CeSoir — 2026-05-07

Auditeur : Safety Officer agent  
Scope : features safety féminine, code source + migrations

---

## 1. SOS Button (triple-tap ☾)

**Statut : IMPLEMENTÉ — gaps critiques**

- Triple-tap détecté via `click` + `touchend` sur `[data-logo-moon]` ou textContent `☾`. Fenêtre 600ms (spec = 500ms — léger dépassement, acceptable).
- Countdown 30s avant déclenchement, puis `triggerSOS()` : log `sos_events` (mig 016) + SMS via `supabase.functions.invoke("send-sms")`.
- GPS haute précision (enableHighAccuracy: true, timeout 10s), fallback gracieux si refus.

**Gaps :**

- **GAP-SOS-1 (CRITIQUE)** : La détection `target.textContent?.trim() === "☾"` est fragile. Si le logo est un `<img>` ou une `<svg>` sans textContent, le triple-tap échoue silencieusement. Aucun élément trouvé avec `data-logo-moon` dans les composants TopNav/BottomNav (l'attribut n'est assigné nulle part hormis le sélecteur dans SOSButton et useTutorial). Le SOS stealth peut ne jamais se déclencher en situation réelle.
- **GAP-SOS-2** : La modal rouge s'affiche au déclenchement (`fixed inset-0 z-[900]`) — non stealth. En situation de danger, un agresseur voit l'écran passer au rouge avec "SOS Activé". La spec demande "no UI visible".
- **GAP-SOS-3** : Edge function `send-sms` référencée mais non auditée (pas dans `src/app/api/`). Si non déployée, les contacts ne reçoivent rien — aucun fallback visible pour l'utilisatrice.
- **GAP-SOS-4** : `trusted_contacts` requête Supabase au déclenchement (lazy fetch). Si 0 contacts configurés (cas fréquent nouveaux comptes), le SOS log en DB mais n'alerte personne.

---

## 2. Block / Report

**Statut : IMPLÉMENTÉ — coverage correcte**

- `user_blocks` (mig 016) : bidirectionnel, RLS, `no_self_block`. Intégré dans `nearby_profiles` et SELECT profiles (mig 024).
- `user_reports` (mig 016) : 9 raisons (`fake_profile`, `harassment`, `inappropriate_content`, `spam`, `underage`, `violence_threat`, `catfish`, `scam`, `other`). Auto-hide profil après 3 signalements distincts en 48h (trigger `trg_auto_hide`).
- `ReportSheet.tsx` : 7 raisons UI (manque `violence_threat` et `catfish` par rapport au schema — delta mineur).
- Modération : `moderation_queue` (mig 016), `user_strikes` (progressive : warning / timeout_24h / timeout_7d / ban_permanent).
- `moderate-message/route.ts` : OpenAI `omni-moderation-latest`, auth-gatée, rate-limit 60/min. Fallback gracieux si clé absente.
- `moderate-photo/route.ts` : Sightengine nudity-2.0 + offensive, auth-gatée, rate-limit strict (5/h).

**Gaps :**

- **GAP-REPORT-1** : Block depuis swipe card non confirmé dans le code — `ReportSheet` est un composant autonome, mais aucune intégration visible dans `SwipeCard.tsx` (à vérifier côté consommateur).
- **GAP-REPORT-2** : Pas d'auto-block immédiat à la soumission d'un report (le sheet indique "Ce profil sera aussi bloqué automatiquement" mais `useSafety.reportUser` n'appelle pas `blockUser` en cascade).
- **GAP-REPORT-3** : `evidence_urls` dans `user_reports` existe en schema mais aucun mécanisme de screenshot auto n'est implémenté.

---

## 3. Pre-meet Safety

**Statut : PARTIEL**

- Safety tips statiques dans `/safety` page (6 tips texte).
- Check-in 30min configurable : log `checkins` Supabase, SMS aux contacts `alert_no_checkin` si missed. Géoloc fallback vers lat/lng=0 avec log warn explicite (CR-005 corrigé).
- QR check-in IRL (mig 042) : mutual scan, anti-replay DB, +30 karma badge "verified-date".

**Gaps :**

- **GAP-PREMEET-1** : Pas de flow "partager le plan du date" — aucun lien shareable "j'ai un date ce soir avec X à Y à Z" envoyable à un ami hors-app.
- **GAP-PREMEET-2** : Push notif post-RDV ("tout va bien ?") n'existe pas. `/api/push/last-call` existe mais non branché sur le délai post-plan.
- **GAP-PREMEET-3** : Safe meeting tips non injectés avant confirmation du premier RDV (pas de modale pre-RDV). Tips disponibles uniquement si l'utilisatrice navigue vers `/safety` manuellement.

---

## 4. Géo Safety

**Statut : SOLIDE**

- Grid-snap 500m (mig 024, `ST_SnapToGrid 0.005°`). Distance arrondie au km (mig 026, anti-trilatération CVE-2014-style).
- Block bidirectionnel dans `nearby_profiles` ET SELECT `profiles`.
- `/map` utilise `lat_rough`/`lng_rough` via `matching.ts` (ligne 464-465) — confirmé. Les pins map ne révèlent pas la position précise.
- `useHotspots` lit `online_hotspot_profiles()` RPC (grid-snapped).
- `LocationShare` dans chat envoie les coords précises de l'utilisatrice elle-même à son match — opt-in explicite, acceptable pour matched uniquement.

**Gap :**

- **GAP-GEO-1** : `LocationCard` affiche `lat.toFixed(4), lng.toFixed(4)` en overlay sur la carte (ligne 118) — 4 décimales = précision ~11m. Quand une utilisatrice partage sa position dans le chat, l'affichage trahit sa position exacte. À arrondir à 2 décimales (~1km).

---

## 5. Voice Messages Safety

**Statut : PARTIEL**

- Bucket `voice-messages` privé (mig 031), 1MB cap, MIME restreint.
- Signed URL 1h, RLS participant-only.
- Modération : aucune. `moderate-message` cible le texte uniquement. Pas de transcription Whisper, pas de classifier audio.

**Gap :**

- **GAP-VOICE-1** : Pas de modération du contenu audio. Un contenu harcelant vocal passe sans détection automatique. Flow report clip vocal : non implémenté (pas de bouton "signaler ce message vocal").

---

## 6. Photo Safety

**Statut : PARTIEL**

- Sightengine server-side (`moderate-photo`) + nsfwjs client-side (double layer).
- `profile_verifications` (mig 016) : selfie, phone, video, social, document.
- `SelfieVerification.tsx` : composant existant.

**Gaps :**

- **GAP-PHOTO-1** : Pas de reverse image search anti-catfish intégré dans le pipeline upload (agent `cesoir-anti-catfish` référencé en mémoire projet mais non trouvé dans le code source).
- **GAP-PHOTO-2** : Pas de détection PII dans les bios (numéro de téléphone, email, réseaux sociaux dans le texte).
- **GAP-PHOTO-3** : Auto-blur en attendant modération non confirmé côté UI — Sightengine n'est appelé que sur flag/ambiguous, pas systématiquement sur chaque upload.

---

## 7. Emergency Response

**Statut : PARTIEL**

- 3919 présent dans `/safety` page (`<a href="tel:3919">`). Correct.
- Help center (`/help`) avec catégorie "safety" et articles structurés.
- Pas de lien vers associations partenaires (En Avant Toute(s), Nous Toutes) dans l'app.
- Pas de FAQ inline "Que faire si..." dans le contexte du chat ou swipe.

---

## Top 5 Priorités P0/P1

| Priorité | ID | Gap | Impact | Effort |
|---|---|---|---|---|
| P0 | GAP-SOS-1 | `data-logo-moon` non assigné sur le logo lune — SOS stealth mort | Critique vie humaine | 30min |
| P0 | GAP-SOS-2 | SOS non stealth (fond rouge visible) — dangereux en présence d'agresseur | Critique vie humaine | 2h |
| P0 | GAP-REPORT-2 | Report sans block auto en cascade — la victime reste exposée | Élevé | 1h |
| P1 | GAP-GEO-1 | LocationCard affiche coords 4 décimales (~11m) dans le chat | Élevé géo-stalking | 15min |
| P1 | GAP-PREMEET-3 | Pas de modale safety pre-RDV avant confirmation date | Moyen prévention | 3h |

---

## Patches recommandés

**GAP-SOS-1** : Ajouter `data-logo-moon="true"` sur l'élément logo lune dans TopNav et BottomNav.

**GAP-SOS-2** : Mode stealth — au lieu du fond rouge, déclencher en background silencieux (vibration longue + flash bref < 200ms). Afficher la confirmation seulement quand l'utilisatrice quitte la proximité ou après 5min.

**GAP-REPORT-2** : Dans `useSafety.reportUser`, appeler `blockUser(reportedUserId)` en parallèle de l'insert report.

**GAP-GEO-1** : `LocationCard.tsx` ligne 118 — changer `toFixed(4)` en `toFixed(2)`.

**GAP-PREMEET-3** : Injecter une BottomSheet safety avant `confirm-irl` avec les 3 tips clés + lien `/safety`.

---

*Fichiers clés : `src/components/app/SOSButton.tsx`, `src/lib/useSafety.ts`, `src/app/(app)/safety/page.tsx`, `src/components/app/ReportSheet.tsx`, `src/components/chat/LocationShare.tsx`, `supabase/migrations/016_trust_safety_tables.sql`, `supabase/migrations/024_location_privacy.sql`, `supabase/migrations/026_distance_from_grid.sql`*
