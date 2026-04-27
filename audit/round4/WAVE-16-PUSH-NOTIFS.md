# Wave 16 — Bet #4: Web Push Notifications (match + message)

> **Status:** Spec ready for engineer pickup.
> **Owner:** TBD.
> **Estimated effort:** ~14h end-to-end (P0 unblock for PWA installability).
> **Goal:** deliver real push notifications for two events — `new_match` and `new_message` — to logged-in users on Android Chrome / desktop / iOS 16.4+ (PWA installed).

---

## 1. Architecture (text diagram)

```
[Browser - logged-in user]                           [Supabase Postgres]
       |                                                     |
       |  1. Settings page toggle "Notifications push"       |
       |  -> usePushNotifications.subscribe()                |
       |     - Notification.requestPermission()              |
       |     - registration.pushManager.subscribe(VAPID_PUB) |
       |                                                     |
       |  2. POST /api/push/subscribe                        |
       |  ----------------------------------------> [Next.js API route]
       |                                              - upsert row in
       |                                                push_subscriptions
       |                                              - returns 201
       |                                                     |
       |                                              [Supabase realtime trigger]
       |                                              ON INSERT INTO conversations
       |                                              ON INSERT INTO messages
       |                                              -> calls Edge Function
       |                                                     |
       |                                              [Supabase Edge Function:
       |                                               send-push]
       |                                              - reads push_subscriptions
       |                                                for recipient_id
       |                                              - signs payload with
       |                                                VAPID_PRIVATE_KEY (web-push)
       |                                              - POSTs to FCM/Apple/Mozilla
       |                                                push endpoint
       |                                                     |
[Service Worker]  <----------- push event payload ----------+
       |
       | self.addEventListener('push', ...)
       |  -> showNotification(title, options)
       |
       | self.addEventListener('notificationclick', ...)
       |  -> openWindow(targetUrl)
[User taps notification] -> CeSoir tab focused / opened on chat or profile
```

Two layers do the work:
1. **Subscribe layer** (already 70% built, just missing env + endpoint)
2. **Send layer** (entirely missing — needs Edge Function + DB trigger)

---

## 2. Existing Infrastructure Inventory

### Service Worker — `public/sw.js`
**Status:** Push handler already implemented (lines 152-236). Ready to use as-is.
- `push` event handler reads JSON payload, supports per-tag actions (`cesoir-match`, `cesoir-message`, `cesoir-plan`)
- `notificationclick` handler focuses existing tab and navigates, or opens new window
- Action buttons wired: "Voir le profil" / "Envoyer un message" for matches, "Repondre" for messages
- Vibration pattern set: `[100, 50, 100]`
- Bypass list correctly excludes `supabase.co` URLs from caching (PII boundary)

**No changes required to sw.js.** The handler will work the moment a push arrives.

### Push subscription hook — `src/lib/usePushNotifications.ts`
**Status:** Built but DEAD due to missing env vars.
- Reads `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (line 28) — currently empty string in production
- Reads `NEXT_PUBLIC_PUSH_SUBSCRIPTION_URL` (line 54) — currently undefined, falls back to `logger.warn("push_subscription_url_missing")` and returns silently
- `subscribe()` flow is correct: requests permission → ensures SW → calls `pushManager.subscribe()` → POSTs subscription to backend
- `unsubscribe()` flow is correct: DELETE on backend + `subscription.unsubscribe()` locally

**Required:** wire env vars + create the backend endpoint. No hook code changes.

### Database — `push_subscriptions` table
**Status:** Referenced in cleanup code but the migration creating it does NOT exist.
- `src/app/api/account/delete/route.ts:105` lists `push_subscriptions` for cascade deletion on account deletion (so the cleanup story is already designed)
- No migration file in `supabase/migrations/` creates this table
- The audit/round3/pwa.md report (gap #5) confirms this is a P0 blocker

**Action:** create migration `029_push_subscriptions.sql` (see step 4).

### Edge Functions
**Status:** None exist. `supabase/functions/` directory does not exist in repo.
- The project uses Next.js API routes (`src/app/api/**`) for most server-side work, NOT Supabase Edge Functions
- Recommendation: keep convention. Use a Next.js API route + a Postgres trigger that calls the route via `pg_net.http_post()` (Supabase has the extension enabled by default).
- Alternative: Supabase Edge Function. Adds a new infra surface but is the standard pattern. For this spec we use the **Next.js API route** approach to match existing conventions.

### Dependencies — `package.json`
**Status:** `web-push` library is NOT installed. Required.
- `npm install web-push` (server-side signing of push payloads with VAPID private key)
- `npm install -D @types/web-push` (TypeScript types)

### Existing notifications-related UI
- `src/app/(app)/profile/notifications/page.tsx` — toggle UI for in-app notification preferences (matches/messages/likes/...). **This is per-event opt-in, NOT the master push permission switch.** The push opt-in needs a separate row at the top: "Activer les notifications push" → calls `subscribe()`/`unsubscribe()` from the hook.
- `src/lib/useLiveNotifications.ts` — drives in-app notification banner from realtime queries. Unrelated to push, but useful pattern reference.
- `src/components/app/MatchCinematic.tsx` — full-screen takeover when a match happens IN-APP. Push is only for when the app is **closed** or **backgrounded**. Both layers must coexist.

---

## 3. Implementation Steps (in order)

### Step 1 — Generate VAPID keys (engineer task, 5 min)
**Do not run from inside Claude.** Engineer runs locally:
```bash
npx web-push generate-vapid-keys
```
Output:
```
Public Key: BFx... (87 chars, base64url)
Private Key: jZ8... (43 chars, base64url)
```
**Store immediately** in 1Password / Vercel encrypted env. Never commit either key to git.

### Step 2 — Add env vars (10 min)
**Files:**
- `.env.sample` — add placeholders + documentation:
  ```
  # Push notifications (Wave 16 - Bet #4)
  # Generate via: npx web-push generate-vapid-keys
  NEXT_PUBLIC_VAPID_PUBLIC_KEY=
  VAPID_PRIVATE_KEY=
  VAPID_SUBJECT=mailto:contact@cesoir.app
  NEXT_PUBLIC_PUSH_SUBSCRIPTION_URL=/api/push/subscribe
  ```
- **Vercel dashboard** — add the same 4 vars to Production + Preview + Development scopes. `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` must NOT have the `NEXT_PUBLIC_` prefix (server-only).

### Step 3 — Create the push_subscriptions migration (30 min)
**File:** `supabase/migrations/029_push_subscriptions.sql` (new)
```sql
-- Wave 16 Bet #4 — push_subscriptions table for web push delivery.
-- One row per (user_id, endpoint). Endpoint is the unique key from
-- pushManager.subscribe() and is what web-push needs to send a notification.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,           -- public key from subscription.toJSON().keys.p256dh
  auth TEXT NOT NULL,             -- auth secret from subscription.toJSON().keys.auth
  user_agent TEXT,                -- diagnostic only
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON push_subscriptions (user_id);

-- RLS: a user can only see / delete their own subscriptions.
-- Inserts go through the service-role key from the API route.
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own_subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE push_subscriptions IS
  'Web push subscription endpoints. One row per device.
   Used by /api/push/subscribe (write) and the send-push trigger (read with service role).';
```
Apply via `supabase db push` or `mcp__supabase__apply_migration`.

### Step 4 — API route to save/delete subscriptions (1.5h)
**File:** `src/app/api/push/subscribe/route.ts` (new)
```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Uses the SERVICE ROLE key — bypasses RLS for the write because the row
// must be insertable from the server even though the user can only read
// their own rows via RLS.
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const { subscription } = await req.json();
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return NextResponse.json({ error: "invalid_subscription" }, { status: 400 });
  }

  // Auth: read the user from the Supabase session cookie.
  // (The hook should attach the user's JWT in Authorization header — adapt
  // to whichever pattern the rest of /api/* uses; check src/lib/supabase.ts
  // for the SSR client helper.)
  const supabase = adminClient();
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: user.id,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    user_agent: req.headers.get("user-agent") ?? null,
    last_used_at: new Date().toISOString(),
  }, { onConflict: "user_id,endpoint" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json();
  if (!endpoint) return NextResponse.json({ error: "missing_endpoint" }, { status: 400 });

  const supabase = adminClient();
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await supabase.from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);
  return NextResponse.json({ ok: true });
}
```
**Tweak `usePushNotifications.ts`** to forward the user's JWT in `sendSubscriptionToServer` / `removeSubscriptionFromServer` so the API can authenticate. Get the token from `supabase.auth.getSession()`.

### Step 5 — API route to send a push (2h)
**File:** `src/app/api/push/send/route.ts` (new)

This is called server-side only (from a Postgres trigger via `pg_net.http_post`, NOT directly from the browser). Validates a shared secret header to prevent abuse.

```ts
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function POST(req: NextRequest) {
  // Shared secret check — only Postgres triggers should call this.
  const secret = req.headers.get("x-internal-secret");
  if (secret !== process.env.PUSH_INTERNAL_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { user_id, payload } = await req.json();
  // payload shape: { title, body, tag, url, chatUrl?, profileUrl? }
  // tag drives the SW action buttons: 'cesoir-match' | 'cesoir-message'

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user_id);

  if (!subs || subs.length === 0) {
    return NextResponse.json({ ok: true, delivered: 0 });
  }

  const stalEndpoints: string[] = [];
  const results = await Promise.allSettled(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      );
    } catch (err: any) {
      // 404 / 410 = endpoint expired -> delete from DB
      if (err.statusCode === 404 || err.statusCode === 410) {
        stalEndpoints.push(s.endpoint);
      }
      throw err;
    }
  }));

  if (stalEndpoints.length > 0) {
    await supabase.from("push_subscriptions")
      .delete()
      .in("endpoint", stalEndpoints);
  }

  return NextResponse.json({
    ok: true,
    delivered: results.filter(r => r.status === "fulfilled").length,
    failed: results.filter(r => r.status === "rejected").length,
  });
}
```

**Add env var:** `PUSH_INTERNAL_SECRET=<random 32 chars>` to Vercel + .env.sample.

### Step 6 — Postgres triggers for the two events (2h)
**File:** `supabase/migrations/030_push_triggers.sql` (new)
```sql
-- Wave 16 Bet #4 — Postgres triggers that fire pushes on new match / new message.
-- Uses pg_net (already enabled via 002_new_features.sql).

CREATE EXTENSION IF NOT EXISTS pg_net;

-- Helper to call /api/push/send with the project URL.
-- The URL must be set as a Postgres setting once at deploy time:
--   ALTER DATABASE postgres SET app.push_send_url TO 'https://cesoir.app/api/push/send';
--   ALTER DATABASE postgres SET app.push_internal_secret TO '<value>';
-- (Or hardcode for now — the engineer can decide.)

CREATE OR REPLACE FUNCTION send_push_notification(
  p_user_id UUID,
  p_payload JSONB
) RETURNS VOID AS $$
DECLARE
  send_url TEXT := current_setting('app.push_send_url', true);
  secret   TEXT := current_setting('app.push_internal_secret', true);
BEGIN
  IF send_url IS NULL OR secret IS NULL THEN
    RAISE NOTICE 'push send skipped — settings missing';
    RETURN;
  END IF;
  PERFORM net.http_post(
    url := send_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', secret
    ),
    body := jsonb_build_object('user_id', p_user_id, 'payload', p_payload)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────
-- Trigger 1: new mutual match
-- Fires when conversations row is inserted (existing schema uses `conversations`
-- for matches — see useBadges.ts comment around line 336).
-- Reads recipient name from profiles for the body.
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION on_new_match_send_push() RETURNS TRIGGER AS $$
DECLARE
  user_a_name TEXT;
  user_b_name TEXT;
BEGIN
  SELECT name INTO user_a_name FROM profiles WHERE id = NEW.user_a;
  SELECT name INTO user_b_name FROM profiles WHERE id = NEW.user_b;

  -- Push to user_a about user_b
  PERFORM send_push_notification(NEW.user_a, jsonb_build_object(
    'title', 'C''est un match !',
    'body', user_b_name || ' veut te rencontrer ce soir',
    'tag', 'cesoir-match',
    'url', '/chat/' || NEW.id,
    'chatUrl', '/chat/' || NEW.id,
    'profileUrl', '/profile/' || NEW.user_b
  ));
  -- Push to user_b about user_a
  PERFORM send_push_notification(NEW.user_b, jsonb_build_object(
    'title', 'C''est un match !',
    'body', user_a_name || ' veut te rencontrer ce soir',
    'tag', 'cesoir-match',
    'url', '/chat/' || NEW.id,
    'chatUrl', '/chat/' || NEW.id,
    'profileUrl', '/profile/' || NEW.user_a
  ));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_new_match_push
  AFTER INSERT ON conversations
  FOR EACH ROW EXECUTE FUNCTION on_new_match_send_push();

-- ─────────────────────────────────────────
-- Trigger 2: new chat message
-- Fires on messages INSERT, pushes to the recipient (the OTHER user in the
-- conversation). Skips if recipient is the sender (defensive).
-- Respects user_settings.notifications_prefs.messages = false.
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION on_new_message_send_push() RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  sender_name  TEXT;
  prefs        JSONB;
  preview      TEXT;
BEGIN
  SELECT
    CASE WHEN c.user_a = NEW.sender_id THEN c.user_b ELSE c.user_a END
  INTO recipient_id
  FROM conversations c WHERE c.id = NEW.conversation_id;

  IF recipient_id IS NULL OR recipient_id = NEW.sender_id THEN
    RETURN NEW;
  END IF;

  -- Honor user settings
  SELECT notifications_prefs INTO prefs
  FROM user_settings WHERE user_id = recipient_id;
  IF prefs IS NOT NULL AND (prefs->>'messages')::boolean = false THEN
    RETURN NEW;
  END IF;

  SELECT name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
  preview := LEFT(COALESCE(NEW.content, ''), 80);

  PERFORM send_push_notification(recipient_id, jsonb_build_object(
    'title', sender_name,
    'body', preview,
    'tag', 'cesoir-message',
    'url', '/chat/' || NEW.conversation_id,
    'chatUrl', '/chat/' || NEW.conversation_id
  ));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_new_message_push
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION on_new_message_send_push();
```
**Verify column names** before applying — confirm `conversations.user_a`/`user_b` and `messages.sender_id`/`conversation_id`/`content` match the actual schema (see `src/lib/supabase-types.generated.ts`).

### Step 7 — Settings page wiring (1.5h)
**File:** `src/app/(app)/profile/notifications/page.tsx` (edit existing)

Add a master push toggle ABOVE the per-event toggles. The per-event toggles already exist and write to `user_settings.notifications_prefs` — those control whether a given user receives a push for that event type (the trigger reads them). The new master toggle controls the BROWSER permission + subscription.

Insert near line 113 (just inside the main `<div>`, before `<h1>`):
```tsx
import { usePushNotifications } from "@/lib/usePushNotifications";

// ... inside component
const push = usePushNotifications();

const handlePushToggle = async () => {
  if (push.isSubscribed) {
    await push.unsubscribe();
  } else {
    const ok = await push.subscribe();
    if (!ok && push.permission === "denied") {
      // Permission denied — show how to re-enable in browser settings
      toast("Tu as bloqué les notifications. Active-les dans les réglages du navigateur.", "error");
    }
  }
};

// Render block (place above the existing toggles list):
<div className="mb-4 p-4 rounded-2xl border border-accent/40 bg-accent/5">
  <div className="flex items-center justify-between gap-3">
    <div className="flex-1">
      <p className="text-[14px] font-bold">Notifications push</p>
      <p className="text-[11px] text-text-muted">
        {!push.isSupported
          ? "Ton navigateur ne supporte pas les notifications push"
          : push.permission === "denied"
            ? "Bloquees — debloque dans les reglages du navigateur"
            : push.isSubscribed
              ? "Activees - tu recevras les nouveaux matchs et messages"
              : "Recois un signal quand tu as un match ou un message"}
      </p>
    </div>
    <button
      role="switch"
      aria-checked={push.isSubscribed}
      aria-label="Notifications push"
      disabled={!push.isSupported || push.permission === "denied" || push.isLoading}
      onClick={handlePushToggle}
      className={`relative w-12 h-7 rounded-full transition-colors disabled:opacity-50 ${
        push.isSubscribed ? "bg-accent" : "bg-border"
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${
        push.isSubscribed ? "translate-x-5" : "translate-x-0"
      }`} />
    </button>
  </div>
</div>
```

### Step 8 — Permission UX framing (post-first-match prompt) (2h)
**File:** `src/components/app/MatchCinematic.tsx` (edit) OR new `src/components/app/PushPermissionPrompt.tsx`.

Per WCAG / HIG / Mozilla guidance: never call `Notification.requestPermission()` cold. Always show a custom in-app dialog explaining the value FIRST, then call the native prompt only if the user accepts.

**Trigger logic** (file: `src/lib/useFirstMatchPushPrompt.ts`, new):
- Listen for the same realtime channel `MatchCinematic` listens to (or piggyback on its callback)
- On the user's FIRST EVER match (count = 1 in conversations), set localStorage flag `cesoir_pushPromptSeen = true` and show the soft prompt 5 seconds AFTER the cinematic dismisses
- If `Notification.permission !== "default"` skip entirely (already decided)

**Soft prompt UI**:
- Bottom sheet, dismissable, 2 CTAs:
  - "Activer les notifications" → calls `push.subscribe()`
  - "Plus tard" → dismiss, sets flag, never re-shown automatically (re-prompt only via /profile/notifications page)
- Copy: *"Active les notifications pour ne rater aucun match. Tu peux les couper a tout moment dans tes reglages."*

**A11y**:
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the title
- Focus trap inside the sheet (already a pattern in the codebase — see `MatchCinematic`)
- ESC closes (treat as "Plus tard")

### Step 9 — Update account-deletion cleanup (10 min)
**File:** `src/app/api/account/delete/route.ts`

Already lists `push_subscriptions` in `TABLES_TO_CLEAN` (line 105). Once the table exists, deletion will cascade automatically via the FK constraint. **No change needed**, but verify the route still passes its tests after the migration is applied.

---

## 4. Risks & Mitigations

### iOS Safari restrictions
- **iOS 16.4+ required** — push only works on iOS when the PWA is INSTALLED to home screen via "Add to Home Screen". Browser tab notifications do not work.
- **No notifications in Safari tab** — even installed PWA apps can be denied if the user is in iOS Low Power Mode, Focus Mode, or Do Not Disturb.
- **Mitigation:** detect iOS + non-installed state, show a "Install CeSoir to receive notifications" prompt instead of the push toggle. Use `window.matchMedia('(display-mode: standalone)').matches`.

### Chrome FCM quirks
- Chrome's push endpoint is `fcm.googleapis.com/wp/...`. No additional config needed (web-push handles it), but FCM has its own anti-spam: if you push too frequently to one user, FCM may throttle.
- **Mitigation:** respect user_settings.notifications_prefs (already wired in trigger); add a per-user rate limit later (P1) if abuse appears.

### Denied permission flow
- Once a user clicks "Block" on the native prompt, you cannot re-prompt. Browser only re-prompts after the user manually clears site permissions.
- **Mitigation:**
  - Always show our own custom prompt FIRST (step 8)
  - On the settings page, when `permission === "denied"`, render text explaining how to re-enable in browser settings (not a button)
  - Track via PostHog: `push_permission_blocked` event for funnel analysis

### Unsubscribe flow
- If a user disables push and re-enables, `pushManager.subscribe()` returns the SAME subscription (idempotent). The `upsert` in step 4 handles this.
- If the browser invalidates a subscription (extension change, profile reset), the next push call returns 410 Gone. The `send` route in step 5 already deletes stale endpoints on 404/410.

### Service Worker race
- The push handler runs even if the page is closed. If a payload references `/chat/<convId>` and the user has not opened the app since the conversation was created, navigation works as expected (Next.js will server-render with auth).
- **Risk:** `notificationclick` opens a new window if no existing tab. Make sure the start URL doesn't redirect to `/login` when user is logged in via cookie. Confirmed — `(app)/layout.tsx` reads the session.

### Cross-device duplicates
- A user with push enabled on phone + desktop will get TWO notifications per match. This is the standard web-push behaviour and what users expect on Android. iOS will only get one because PWAs are per-device-installed.
- **No mitigation needed.** Note in product copy.

---

## 5. Estimated Effort

| Step | Description | Hours |
|------|-------------|-------|
| 1 | Generate VAPID keys | 0.1 |
| 2 | Add env vars (.env.sample + Vercel) | 0.2 |
| 3 | Migration `029_push_subscriptions.sql` | 0.5 |
| 4 | API route POST/DELETE `/api/push/subscribe` + hook auth wiring | 1.5 |
| 5 | API route POST `/api/push/send` (web-push lib + secret check) | 2.0 |
| 6 | Postgres triggers `030_push_triggers.sql` | 2.0 |
| 7 | Settings page master toggle | 1.5 |
| 8 | Soft prompt + first-match trigger | 2.0 |
| 9 | Account deletion verify | 0.2 |
| - | Manual QA (Chrome desktop + Android Chrome + iOS PWA install) | 2.0 |
| - | PostHog event wiring + monitoring dashboard | 1.0 |
| - | Buffer / debug | 1.0 |
| **Total** | | **~14 hours** |

---

## 6. Success Metrics

Track in PostHog from day 1.

| Metric | Target | Notes |
|--------|--------|-------|
| **Opt-in rate** | 35% within 7 days of release | % of active users who allow push permission. Cold = ~15-20%; with post-first-match framing, target 35%. Tinder/Bumble industry benchmark = 40-50%. |
| **Subscription persistence** | 80% after 30 days | % of users still subscribed 30 days after opting in. Drops indicate value disconnect. |
| **Push delivery rate** | >95% | (Pushes sent / Pushes acknowledged by browser endpoint). Failures here = browser/OS issues, not our bug. |
| **Click-through rate (matches)** | 35% within 1h | Users who tap the match push within 1h of receiving it. Anything <20% = framing/timing problem. |
| **Click-through rate (messages)** | 50% within 1h | Higher because users actively want to read messages. <30% = we're sending too late or too noisy. |
| **D1 retention delta** | +5pp for opt-in users | Push opt-ins should retain better than non-opt-ins. If not, push is annoying. |
| **Permission blocked rate** | <8% | % of users who hit "Block" on native prompt. >15% = our soft prompt is failing to convince. |

PostHog events to fire:
- `push_soft_prompt_shown` — soft prompt displayed
- `push_soft_prompt_accepted` — user clicked "Activer"
- `push_soft_prompt_dismissed` — user clicked "Plus tard" or closed
- `push_permission_granted` — `Notification.requestPermission()` returned "granted"
- `push_permission_blocked` — returned "denied"
- `push_subscribed` — full subscribe flow completed
- `push_unsubscribed` — user disabled in settings
- `push_received` — fired by SW push handler (post a beacon to `/api/analytics/push-received`)
- `push_clicked` — fired by SW notificationclick handler

---

## 7. Out of Scope (followups)

- Push for `like_received`, `plan_invite`, `feed_reaction` — wire as P1 once base case works
- Rich notifications with image attachments (Tinder-style match preview with photo) — needs `image` field in showNotification options + CDN-hosted thumbnail
- Push scheduling (e.g. "ce soir 19h, ton mode est actif!") — needs a cron + the scheduling primitives we already use for invite expirations
- Notification grouping (badge count on PWA icon) — `navigator.setAppBadge()` API, separate spec
- Per-conversation mute (mute push for a single chat) — UI affordance + new column on `conversations`
