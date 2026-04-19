/**
 * Minimal Supabase client mock.
 *
 * Usage:
 *   import { createMockSupabase } from "@/test/mocks/supabase";
 *   vi.mock("@/lib/supabase", () => ({ supabase: createMockSupabase() }));
 *
 * The mock returns a thenable query builder where every chain method
 * returns `this` so `.from(...).select(...).eq(...).single()` works.
 * Override behaviour per-test by reassigning specific fns:
 *
 *   const mock = createMockSupabase();
 *   mock.from = vi.fn(() => createQueryBuilder({ data: [...], error: null }));
 */
import { vi } from "vitest";

export type QueryResult<T = unknown> = {
  data: T | null;
  error: { message: string } | null;
};

type Builder = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  gt: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lt: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  like: ReturnType<typeof vi.fn>;
  ilike: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  then: (resolve: (v: QueryResult) => unknown) => Promise<unknown>;
};

/**
 * Build a thenable query builder that resolves to the given result
 * whenever awaited or `.single()` / `.maybeSingle()` is called.
 */
export function createQueryBuilder<T = unknown>(
  result: QueryResult<T> = { data: null, error: null },
): Builder {
  const builder: Partial<Builder> = {};
  const chain = () => builder as Builder;

  builder.select = vi.fn(chain);
  builder.insert = vi.fn(chain);
  builder.update = vi.fn(chain);
  builder.delete = vi.fn(chain);
  builder.upsert = vi.fn(chain);
  builder.eq = vi.fn(chain);
  builder.neq = vi.fn(chain);
  builder.gt = vi.fn(chain);
  builder.gte = vi.fn(chain);
  builder.lt = vi.fn(chain);
  builder.lte = vi.fn(chain);
  builder.in = vi.fn(chain);
  builder.is = vi.fn(chain);
  builder.like = vi.fn(chain);
  builder.ilike = vi.fn(chain);
  builder.order = vi.fn(chain);
  builder.limit = vi.fn(chain);
  builder.range = vi.fn(chain);
  builder.single = vi.fn().mockResolvedValue(result);
  builder.maybeSingle = vi.fn().mockResolvedValue(result);
  builder.then = (resolve) => Promise.resolve(result).then(resolve);

  return builder as Builder;
}

export function createMockSupabase(overrides: {
  fromResult?: QueryResult;
  rpcResult?: QueryResult;
  session?: unknown;
  user?: unknown;
} = {}) {
  const {
    fromResult = { data: null, error: null },
    rpcResult = { data: null, error: null },
    session = null,
    user = null,
  } = overrides;

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { session, user }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => createQueryBuilder(fromResult)),
    rpc: vi.fn().mockResolvedValue(rpcResult),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        download: vi.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: "" } })),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    },
  };
}

export type MockSupabase = ReturnType<typeof createMockSupabase>;
