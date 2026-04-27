# Heuristic Evaluation — CeSoir Dating App
**Date:** 2026-04-26
**Reviewer:** Expert review (code + screenshots)
**Flows evaluated:** Onboarding, Match → Conversation, Plan Creation

---

## Nielsen's 10 Heuristics Score

| # | Heuristic | Score (1-5) | Notes |
|---|---|---|---|
| 1 | Visibility of system status | 4 | Loading skeletons on /browse + spinner on submit buttons. Gap: `Suspense fallback={null}` on all three pages means a blank white flash before hydration — no spinner at all during that window. |
| 2 | Match between system and real world | 4 | Language is colloquial French ("Tu veux quoi ce soir ?", "C'est parti"). Gap: "Mode" is app-specific jargon introduced at step 2 without prior definition from the user's POV; geolocation accuracy in meters ("précision ~X m") is a developer metric, not user-friendly. |
| 3 | User control and freedom | 3 | Undo on /browse (RotateCcw) exists but is tiny (w-7 h-7, 14px icon) and unlabelled visually — easy to miss. No back button on signup steps 2 and 3 — user cannot correct a typo made on step 1 without reloading. Archive/delete on /chat are UI-only (non-persistent), so a "delete" action silently reappears on refresh — loss of perceived control. |
| 4 | Consistency and standards | 3 | /signup-quick uses white/light theme; /login uses a dark cinematic theme. Same brand, two radically different visual languages with no transition. "Continuer →" on step 1, "C'est parti →" on step 2, "Commencer à swiper →" on step 3 — no consistent CTA verb pattern. The plans/create submit button is labeled "Creer le plan" (missing accent on é). |
| 5 | Error prevention | 3 | Password field has no show/hide toggle — users cannot verify what they typed before submitting. Age field is `type="number"` on mobile which produces a numeric keyboard but allows non-integer decimals (e.g. 18.5) — caught only on submit. Plans/create: "Quand" field uses `datetime-local` with no minimum — user can set a plan in the past, caught only after server-side rejection (no client-side guard). |
| 6 | Recognition rather than recall | 4 | Mode cards on step 2 show name + tagline — no recall required. /browse mode switcher labels are visible. Gap: the star icon for "Super like" carries no text label; a first-time user must infer its cost in Roses without any tooltip or callout. |
| 7 | Flexibility and efficiency of use | 3 | No keyboard shortcut for swipe (left/right arrow keys not wired despite desktop viewport support). Icebreaker suggestions in /chat are not actionable — tapping one does nothing (no handler attached beyond a `button` with no `onClick`). No draft save on plans/create (navigate away = all lost). |
| 8 | Aesthetic and minimalist design | 4 | /browse and /signup-quick are clean and focused. Gap: /chat page stacks FlashNotes section + Quick-action row (Salons + Speed Dating) + Icebreakers section + Matches bar before showing any actual conversation — 4 rows of chrome before the primary content. |
| 9 | Help users recognize, diagnose, and recover from errors | 3 | Signup error messages are specific ("Email, mot de passe (8+), âge 18+"). Gap: on a network error during invite claim, the error is silently swallowed — user gets no feedback and may think the code was applied. /browse error state reads only the raw `error` string from the hook — could expose a technical message. Plans create: on failure, router falls back to `/plans` with no toast or message — the user does not know if creation succeeded or failed. |
| 10 | Help and documentation | 2 | /help exists and is linked from the geo-denied state on /browse. No contextual help anywhere in the signup flow (e.g. what "mode" means, why geolocation is needed). No onboarding tooltip or coach mark on /browse for first-run users (trackFirstTime fires analytics but shows nothing to the user). The icebreaker suggestions in /chat have no "how to use" hint. |

**Overall: 33/50**

---

## Cognitive Walkthroughs

### Task 1: Sign up as a new user (/signup-quick)

| Step | Action | Clarity (1=clear) | Visibility | Association | Feedback | Pass? |
|---|---|---|---|---|---|---|
| 1 | Land on step 1 from landing "Je rejoins" | 1 | Yes — full form visible | Yes — "Crée ton compte" heading | Progress bar shows step 1 of 3 | YES |
| 2 | Fill email + password + age | 1 | Yes | Yes | Inline focus ring on active field | YES |
| 3 | Understand password rule (8 chars) | 2 | Partial — only in placeholder, disappears on first char | Requires reading placeholder before typing | None — no live strength indicator | CONCERN |
| 4 | Submit step 1 ("Continuer →") | 1 | Yes | Yes | Button text changes to "Création..." | YES |
| 5 | Pick a mode on step 2 | 2 | Yes — 4 cards visible | Moderate — "mode" concept not explained prior | Selected card highlights with border + bg | YES |
| 6 | Understand geolocation status | 3 | Visible only via small text below the cards | User must read fine print to know if geo fired | Icon + text appear, but no explicit CTA to grant permission | CONCERN |
| 7 | Submit step 2 ("C'est parti →") | 1 | Yes | Yes | Button disabled until mode selected | YES |
| 8 | Read welcome screen (step 3) | 1 | Yes | Yes | Mode name shown, animated moon logo | YES |
| 9 | Enter browse ("Commencer à swiper →") | 1 | Yes | Yes | Navigates to /browse | YES |

**Issues:**
- Step 3: password validation is invisible during input — only surfaces on submit with a generic combined message mixing email, password and age into one string. User cannot tell which field is wrong.
- Step 6: if geolocation is denied at the OS level, the only feedback is passive text below the mode cards. No explicit prompt to open Settings. The user reaches /browse and hits the geo-denied state, which is a context switch and causes confusion.
- Step 1 → 2: no back navigation from step 2. A typo on step 1 forces full page reload + new account attempt.

### Task 2: Swipe right on /browse → match cinematic → /chat

| Step | Action | Visibility | Association | Feedback | Pass? |
|---|---|---|---|---|---|
| 1 | Understand the card is swipeable | Partial — no affordance hint on first load | Users familiar with Tinder will infer; new users may not | None — no first-run tooltip or swipe hint | CONCERN |
| 2 | Tap like button (heart) | Yes — large gradient circle | Yes | Sound + haptic + card animates | YES |
| 3 | Match occurs → cinematic overlay | Yes — full-screen takeover | Yes — clear "Match !" moment | Sound, haptic, confetti, animated avatar | YES |
| 4 | Navigate to conversation | Yes — CTA button in overlay | Yes — pre-filled starter visible | Tap → /chat/[id] | YES |
| 5 | Dismiss cinematic without chatting | Yes — X top-right + tap backdrop | Yes | Overlay exits with fade | YES |
| 6 | Find the match in /chat list | Partial — match appears in "Nouveaux matchs" bubble row | Requires knowing to look at top row, not main list | Unread badge on bubble | CONCERN |

**Issues:**
- No swipe affordance on first-run: the browse page has no coach mark, shimmer animation or "swipe pour explorer" text. First-time users on desktop especially have no clue the card is draggable.
- The undo button (RotateCcw, 14px, w-7) sits above the main action row in a visually weak position — users who swipe by accident are unlikely to discover it.
- Match cinematic auto-dismisses after 4s (`setTimeout 4000`). If the user is slow to read, the overlay disappears before they tap "Envoyer un message" — they lose the starter text and must find the match manually in /chat.

### Task 3: Create a plan (/plans → /plans/create → publish)

| Step | Action | Visibility | Association | Feedback | Pass? |
|---|---|---|---|---|---|
| 1 | Find the create CTA on /plans | Yes — gradient "+" pill in header | Yes | Magnetic hover animation | YES |
| 2 | Pick plan type | Yes — 3 large buttons | Yes — emoji + label | Selected button becomes gradient-filled | YES |
| 3 | Fill title (required) | Yes — asterisk present | Yes | Submit button grays out until 3+ chars | YES |
| 4 | Fill "Quand" datetime-local | Partial — native picker, no placeholder | Moderate — user must format date manually | No validation feedback until submit | CONCERN |
| 5 | Adjust "Participants max" with range slider | Yes — value shown inline | Yes | Number updates live | YES |
| 6 | Submit ("Creer le plan") | Yes | Yes | Button shows "Creation..." | PARTIAL |
| 7 | Confirm plan was published | NO — redirects to /plans or /plans/[id] with no success toast | User cannot tell if creation succeeded | Silent redirect | NO |

**Issues:**
- No success confirmation after plan creation: router.push() fires silently. If the user lands on /plans/[id] (success) or /plans (failure), both look similar enough to cause confusion.
- `datetime-local` with no minimum allows past dates, not caught client-side.
- Description and venue are optional but unlabelled as optional in the UI — only title has an asterisk. Users may feel uncertain about what is required.
- Venue is a free-text field with no autocomplete — friction for a location-sensitive app.
- No draft persistence — navigating back from create loses all input.

---

## Severity Summary

### Catastrophic (must fix before ship)

- **No feedback when plan creation fails.** `router.push("/plans")` on error is silent. Users will retry and create duplicates, or assume it worked when it didn't. Fix: add a toast on both success and failure. `/plans/create` lines 57-60.

### Major (high priority)

- **No back/edit navigation between signup steps.** Step 2 and 3 have no "← Retour" link. A user who made a typo on step 1 must reload and re-enter everything. Fix: wire `setStep(prev - 1)` on a back button in steps 2 and 3.
- **Password validation only fires on submit, message is combined.** Three fields produce one error string. Fix: per-field inline validation with individual messages.
- **Match cinematic auto-dismisses in 4s** — too fast for slow readers to tap CTA. Fix: remove the auto-dismiss `setTimeout` or extend to 8s + add a progress ring showing time remaining so the moment feels intentional rather than rushed.
- **No swipe affordance on first browse load.** Fix: a one-time coach mark (dismissed to localStorage) on the first card: a subtle animated arrow or "Swipe pour continuer" caption.
- **Icebreaker buttons in /chat have no onClick handler** — tapping them does nothing. Fix: wire to compose box pre-fill in `/chat/[id]` or remove until functional.

### Minor

- **`Suspense fallback={null}`** on signup-quick, browse, plans — blank flash on hydration. Fix: replace with a minimal spinner.
- **Geolocation granted on step 2 but user is not told what to do if denied.** Fix: add a one-line "Active la position dans tes réglages" with a Settings deep link below the passive status text.
- **"Creer le plan" missing accent** (é). Cosmetic but credibility-impacting for a French-language app.
- **Archive/delete in /chat are non-persistent** — silently reappears on refresh. Fix: either persist to Supabase or add a disclaimer "Cette action est temporaire".
- **Undo button** (14px RotateCcw) is visually weak and below discoverability threshold. Fix: increase to 20px + add a label "Annuler" below.

### Cosmetic

- Past-date selection allowed on datetime-local field — harmless client-side but confusing. Fix: add `min={new Date().toISOString().slice(0,16)}` to the input.
- Geolocation accuracy in meters ("précision ~43 m") is developer language. Replace with "Position detectée" (binary: yes/no) for most users.
- Progress bar `aria-valuenow={step}` is correct but the screen reader reads "Étape 2 sur 3" without naming what step 2 covers. Add `aria-label` that includes the step title.

---

## Prioritised Recommendations

1. **Week 1 (catastrophic + critical major):** Add success/failure toast to plan creation; add per-field password validation with show/hide toggle; add back navigation between signup steps; remove or extend the 4s match cinematic auto-dismiss.
2. **Week 2 (major):** First-run swipe coach mark on /browse; wire icebreaker buttons to compose pre-fill; replace `Suspense fallback={null}` with skeleton on the three critical pages.
3. **Sprint 3 (minor):** Persist archive/delete to Supabase; geolocation denied → Settings deep link on step 2; fix "Creer le plan" accent; strengthen undo button affordance.
4. **Backlog (cosmetic):** datetime-local minimum; geolocation wording; aria-label step names.
