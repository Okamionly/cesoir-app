# Hook helpers

Standardized primitives for async data fetching and Supabase realtime
subscriptions. Audit reference: `ARCH_BACKEND_AUDIT_2026-04-19.md` §HK.

## `useAsyncResource<T>(fetcher, deps, options)`

Canonical async state hook. Returns `{ data, loading, error, refetch }`
with built-in AbortSignal — solves HK-4 (no abort on unmount) and
HK-1 (inconsistent shape).

```ts
const { data, loading, error, refetch } = useAsyncResource(
  async (signal) => {
    const res = await fetch(`/api/foo?id=${id}`, { signal });
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  },
  [id],
);
```

## `useSupabaseQuery<T>(builder, deps, options)`

Standardized state + abort for direct Supabase queries.

```ts
const { data, loading, error, refetch } = useSupabaseQuery(
  (client) => client.from("profiles").select("*").eq("id", id),
  [id],
);
```

## `useRealtimeChannel(factory, deps, options)`

Wraps a RealtimeChannel subscription. Guaranteed cleanup on unmount
(unsubscribe + ref reset), solves HK-3 leak-on-remount class.

```ts
useRealtimeChannel(
  (client) => client
    .channel(`room-${roomId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, onEvent),
  [roomId],
);
```

## Hook migration status (audit 2026-04-19)

Task scope excluded B1-owned hooks. Remaining hooks status:

| Hook                  | Realtime cleanup | AbortSignal | State shape  | Action needed |
| --------------------- | ---------------- | ----------- | ------------ | ------------- |
| useFeed               | OK (nulled ref)  | NO          | {data,loading,error,refresh,loadMore,hasMore,loadingMore} | migrate fetch -> useAsyncResource |
| useChat               | OK               | OK (cancelled flag) | 8 states  | exemplar, keep |
| useConversations      | OK (nulled ref)  | Partial     | {conversations,loading} | add error |
| useRooms              | OK               | NO          | non-standard | add abort |
| useProfiles           | N/A              | NO          | divergent    | migrate      |
| useBadges             | N/A              | NO          | {badges,loading} | migrate |
| useReputation         | N/A              | NO          | divergent    | migrate      |
| useHotspots           | N/A              | NO          | divergent    | migrate      |
| useGamification       | N/A              | NO          | divergent    | migrate      |
| useChallenges         | N/A              | NO          | divergent    | migrate      |
| useSafety             | N/A              | NO          | divergent    | migrate      |
| usePlans              | N/A              | NO          | divergent    | migrate      |
| useFlashPlans / useEvents / useSoiree | (B2 may delete) | NO | divergent | skip if deleted |
| useSquad              | N/A              | NO          | divergent    | migrate      |

Migration pattern (for later chunks):

```ts
// before
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
useEffect(() => {
  supabase.from("x").select().then(({ data }) => { setData(data); setLoading(false); });
}, []);

// after
const { data, loading, error, refetch } = useSupabaseQuery(
  (c) => c.from("x").select(),
  [],
);
```

Full migration was not completed in-task (time budget 35 min); helpers
are merged and the pattern is demonstrated.
