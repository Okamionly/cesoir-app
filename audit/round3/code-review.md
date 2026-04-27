# CeSoir Code Review — Round 3

**Files reviewed:** 10 | **Overall:** Request Changes (2 P0, 8 P1, 6 P2)

---

## src/lib/matching.ts

**P0 — `getKarmaForUsers` unbounded fetch (DoS / N+1 inversion).** Pulls every karma transaction row for every candidate, summed client-side. 60 candidates × 100 tx = 6000 rows per match call, every 30s. Need a DB view `user_karma_totals` or RPC.
```ts
const { data } = await supabase.rpc("user_karma_totals", { user_ids: userIds });
```

**P1 — Silent empty `[]` on RPC error masks outages.** Lines 284-287, 401-403, 415, 434, 460, 504 all return empty on error. Supabase outage looks identical to "no nearby users". Throw and let `useMatches` surface error.

**P1 — Stale `expires_at` filter race.** `getActiveModes` / `getActiveModesForUsers` evaluate `new Date().toISOString()` independently. Pass a single `now` from pipeline entry.

**P2 — Self-filter client-side.** Pass `user_id` to RPC for server-side exclusion.

## src/lib/useProfiles.ts

**P0 — `catch {}` swallows ALL errors including auth/network.** Line 95-98. Auth-expired (401) becomes "no profiles" silently. At minimum log:
```ts
} catch (e) { logger.warn("useProfiles_failed", { err: String(e) }); ... }
```

**P1 — Unsafe `as` cast cascade (lines 78-91).** Schema drift = runtime explosion inside `.map`. Add type guard `isNearbyRow(p)`.

**P1 — `lat/lng = 0` falsy bug.** `if (!lat || !lng)` rejects equator/Greenwich. Use `if (lat == null || lng == null)`.

**P2 — `filters` object identity** in deps may re-fetch on every render.

## src/lib/useBadges.ts

**P0 — `checkAndAward` race: parallel mounts double-award karma.** Sequential `INSERT` loop with no DB-level idempotency. StrictMode → 2× karma. Add unique constraint and:
```ts
.onConflict('user_id,achievement_key').ignore()
```

**P1 — `messages?.length` = sender-only count.** Verify `bavard-pro` semantics with product spec.

**P1 — `matches.length` may include pre-match conversations.** Add `.not("matched_at", "is", null)`.

**P2 — `nextClosest` — use O(n) reduce instead of sort.**

## src/lib/useMatches.ts

**P1 — Stale closure: `optionsRef.current` changes mid-flight.** Filter changes during fetch → result overwrites with stale data:
```ts
const fetchTokenRef = useRef(0);
const myToken = ++fetchTokenRef.current;
const results = await findMatches(...);
if (myToken !== fetchTokenRef.current) return;
```

**P1 — No abort on unmount.** Plumb `AbortSignal` through `findMatches`.

**P2 — `setLoading(true)` flashes spinner every 30s.** Separate `refreshing` from `loading`.

## src/lib/useConversations.ts

**P1 — N×M latest-message fetch.** Pulls ALL messages from ALL convos. Use RPC with `DISTINCT ON (conversation_id)` or window function. Same for `unreadRows`.

**P1 — Realtime UPDATE handler subscribes table-wide** (line 207). Add server-side filter `user_a=eq.${userId}`.

**P2 — Verify `useId()` channel cleanup** when `instanceId` changes.

## src/lib/useInteractions.ts

**P1 — `block` direct `update`** (line 270) bypassing audit trail. Move to `/api/swipe` with `direction=block`.

**P1 — `report` `.upsert`** (line 306) can reset `created_at`. Use `INSERT … ON CONFLICT DO NOTHING`.

**P2 — `pushHistory` slice math** verify: should be `[...prev, record].slice(-MAX_HISTORY)`.

## src/lib/useGeolocation.ts

**P1 — `lastPushRef` shared across remounts** (StrictMode). First mount sets ref, second has fresh ref → 2× push. Use module-level singleton or localStorage.

**P2 — No exponential backoff on `update_location` failure.**

## src/lib/useRoses.ts

**P1 — `mutateBalance` rollback uses captured `previous`** (line 195). Concurrent spends overwrite each other's rollback. Use functional setter with last-server-confirmed value.

**P2 — `localStorage.setItem` in render path** — extract helper, wrap in `requestIdleCallback`.

## src/lib/useMatchCap.ts

**P0 — TOCTOU race in `incrementMatch`.** SELECT then UPSERT, no transaction. Two concurrent likes → both read `n`, both write `n+1` instead of `n+2`. Atomic RPC required:
```sql
CREATE FUNCTION increment_match_cap() RETURNS int AS $$
  UPDATE match_caps SET likes_today = likes_today + 1
  WHERE user_id = auth.uid() AND likes_today < 8
  RETURNING likes_today;
$$ LANGUAGE sql;
```

**P2 — Reset timer depends on `matchesUsed`** — every increment resets timeout. Move to mount-only.

## src/lib/supabase.ts

**P1 — No fallback if `document.cookie` empty** (Safari ITP / private mode). Sentry-log `supabase_cookie_missing` once.

**P2 — `ClientDB = any` documented escape hatch** — acceptable, but `await supabase.from("nonexistent_table")` won't fail at compile.

---

## Priority actions

1. Fix matching.ts P0 (karma DoS) — DB view/RPC
2. Fix useProfiles.ts P0 (silent catch) — log at minimum
3. Fix useBadges P0 (double-award race) — DB unique constraint
4. Fix useMatchCap P0 (TOCTOU) — atomic RPC
5. Audit ALL `catch {}` blocks for swallowed errors
6. Add `AbortSignal` plumbing to all data fetchers
