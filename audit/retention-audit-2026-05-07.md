# Retention Audit — CeSoir — 2026-05-07

**Status :** Wave 17 shippee en code, 24 migrations Supabase NON pushees. Toutes les features retention sont dormantes en prod.

---

## 1. Cohort analysis cible

| Cohorte | Tinder | Hinge | CeSoir target | Levier specifique |
|---|---|---|---|---|
| D1 | 25% | 35-40% | **40%** | "ce soir" = raison de revenir le soir suivant naturellement |
| D7 | 12-15% | 20-25% | **25%** | Crystal Ball + Streak = 2 pull daily actifs |
| D30 | 6-8% | 12-15% | **15%** | Mastery Tiers + Moments = progression visible |
| D60 | 3-5% | 7-10% | **10%** | Anti-ghost ecosystem, vibes reset, IRL confirms |

Le concept "ce soir" est le seul levier D1 structurel que Tinder/Hinge n'ont pas. L'user revient le soir suivant parce que le contexte (dispo, zone, humeur) change chaque jour — c'est une habitude a construire, pas un produit consultatif.

---

## 2. Engagement loops actuels — efficacite Wave 17

| Feature | Migration | Pull daily | Richesse | Risque |
|---|---|---|---|---|
| Streaks | 037 | Fort | Faible (visible mais passif) | Reset brutal = churn a J+2 |
| Crystal Ball | 041 | Tres fort | Tres fort (20h quotidien, reveal drama) | Pairing quality degrade si pool petit |
| Push messages | 033 | Fort | Moyen | Necessite VAPID keys + app.push_send_url (non deploye) |
| Push last-call | 034 | Fort | Fort (19h45 = urgence soir) | Idem — dormant |
| Anti-ghost decay | 045 | Indirect | Fort (dissuasion comportementale) | Trop agressif si grace period mal calibree |
| Mastery tiers | 046 | Faible | Fort (progression long terme) | Seuil 25 IRL = 6-9 mois a temps normal |
| Moments 24h | 047 | Moyen | Moyen (conversation hook) | Expiration trigger si pool matched faible |
| Vibes reset | 039 | Moyen | Faible | UTC midnight = friction FR (1h avance) |

Blocage critique : sans `supabase db push` + VAPID keys, Crystal Ball et push notifications sont morts. L'app tourne en mode v1 alors que le code est v3.

---

## 3. Top 5 churn triggers + mitigations

**Trigger 1 — "Nobody messages back" (ghosting subi)**
Cause principale de churn semaine 1. L'anti-ghost decay (045) penalise les ghosters via karma et visibility deboost — mais uniquement apres 14 jours. Les 7 premiers jours sont non proteges.
Mitigation : abaisser la grace period a 5 jours pour Signal C (silent collector). Ajouter suggestion auto "Brise la glace ?" 4h apres match sans message.

**Trigger 2 — Zero matches D3**
Pool insuffisant en beta Montpellier (<500 users). Le Crystal Ball garantit 1 match/jour mais seulement si `generate_daily_crystal_ball()` est appele (cron non configure).
Mitigation : configurer cron-job.org -> `/api/cron/crystal-ball` avant beta. En dessous de 200 users actifs, baisser le seuil de score matching de 70 a 55.

**Trigger 3 — "Same faces" (lassitude du pool)**
Pas de rotation suffisante quand le pool local est petit. Vibes daily reset (039) change les preferences mais pas les profils servis.
Mitigation : "Voyageur du soir" — profils actifs dans un rayon +20km inclus automatiquement apres 3 jours sans nouveau visage. Travel Passport (mig 040) supporte deja ce cas.

**Trigger 4 — "Got into a relationship" (success churn)**
Paradoxe positif. Risque : l'user ne met pas l'app en pause, il delete. Perte d'ambassadeur potentiel.
Mitigation : Pause Mode avec message "Tu nous manques, reviens quand tu veux" + email opt-in Moments de tes matches actifs (restent connectes sans swipe).

**Trigger 5 — "Privacy concerns"**
Wave 17 n'a pas de transparency dashboard. Ghost score visible par l'user (compute_ghost_score expose a authenticated) mais non affiche en UI.
Mitigation : page /compte/confidentialite affichant karma score, ghost score actuel, penalties actives. RGPD data export. Deja prevu ROADMAP Q2 mais non priorise.

---

## 4. Win-back campaigns

**D7 inactive — push "Ce soir ca s'anime"**
Texte : "3 profils actifs pres de toi ce soir. Ton Crystal Ball de demain t'attend."
Canal : OneSignal push (mig 033/034 une fois deployes).
Condition : 0 ouverture app depuis 6 jours. Max 1 envoi.

**D14 inactive — email personnalise**
Texte : "5 nouvelles personnes correspondent a tes modes depuis ta derniere visite."
Canal : Resend (deja configure). Personnalisation : modes preferes + arrondissement.
Condition : 13 jours sans session. Max 1 envoi.

**D30 inactive — sondage + offre**
Texte : "Tu nous manques. Dis-nous pourquoi tu es parti — 3 questions. Cadeau : 1 mois Premium offert."
Canal : Email Resend. Lien vers exit survey 3 questions (Typeform embed ou page /feedback).
Condition : 29 jours sans session. Max 1 envoi.

Regle absolue : silence apres D30 si aucune reponse. Ne pas spammer.

---

## 5. Premium upsell triggers

| Declencheur | Message | Placement |
|---|---|---|
| 5 likes restants aujourd'hui | "Plus que 5 roses. Premium = illimite." | Swipe card overlay |
| Streak 7 jours consecutifs | "7 jours de feu. Prends un Boost gratuit avec Premium." | StreakBadge -> modal |
| 1er IRL date confirme (mutual_at set) | "Tu es Apprenti maintenant. Rejoins le club Maitre." | Achievement unlock screen |
| Crystal Ball revele un match | "Voir sa bio complete ? Premium debloque tout." | Crystal Ball reveal modal |
| Match sans reponse 12h | "Envoie un super-like pour remonter. Premium = 3/semaine." | Conversation list |

---

## 6. Top 3 experiments retention Q3 2026

**Exp A — "Ce soir a 19h45" push sequence (post-push-deploy)**
Hypothese : le push last-call 19h45 (mig 034) augmente les ouvertures soir de 25%+. Tester 2 variantes de copy : urgence ("Plus que 2h pour matcher") vs social proof ("12 personnes actives dans ton quartier"). Mesure : CTR push + session soir D7.

**Exp B — Crystal Ball pairing quality threshold**
Hypothese : baisser le seuil de score matching de 70 a 55 en pool <300 users augmente le taux mutual reveal sans degrader la qualite percue. Mesure : taux a_liked AND b_liked / total rows, NPS post-reveal.

**Exp C — Streak rescue mechanic**
Hypothese : offrir une "bougie de sauvetage" (1 par semaine, utilisable pour ne pas casser un streak si absent 1 jour) reduit le churn D2-D3 de 15%. Mise en oeuvre : colonne `rescue_candles INTEGER DEFAULT 1` dans user_streaks, logique dans useStreak hook. Mesure : courbe retention D3 cohortes with/without rescue.

---

## Blocage prioritaire

Avant toute campagne retention : deployer les 24 migrations + VAPID keys + cron crystal-ball. Sans cela, 80% des loops retention ci-dessus sont inoperants. C'est le prerequis absolu avant beta Montpellier.
