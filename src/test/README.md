# Test Suite — cesoir-app

## Stack

- **Runner** : [Vitest](https://vitest.dev) (jsdom env)
- **DOM assertions** : `@testing-library/react` + `@testing-library/jest-dom`
- **User events** : `@testing-library/user-event`
- **React plugin** : `@vitejs/plugin-react` (pour le JSX + HMR)

Config : `vitest.config.ts` (racine projet) — alias `@/` mappé sur `./src`, setup file `src/test/setup.ts`.

## Scripts

| Commande | Usage |
|---|---|
| `npm test` | Mode watch (re-run on file change) |
| `npm run test:run` | Single-shot, CI-friendly, exit code ≠ 0 si échec |
| `npm run test:ui` | UI Vitest dans le navigateur |
| `npm run test:coverage` | Rapport de couverture (V8) |

## Structure

```
src/
├── test/
│   ├── setup.ts              # Import jest-dom + polyfills jsdom (matchMedia, IntersectionObserver)
│   ├── README.md             # (ce fichier)
│   ├── mocks/
│   │   └── supabase.ts       # createMockSupabase + createQueryBuilder chainables
│   └── utils/
│       └── render.tsx        # Wrapper render avec Providers (actuellement passthrough)
├── lib/
│   ├── matching.test.ts          # Scoring 4 axes (mode/distance/timing/social)
│   ├── rate-limit.test.ts        # Sliding-window limiter + helpers HTTP
│   ├── premium-gate.test.ts      # isPremium / getDailyLikeCap avec Supabase mocké
│   ├── compatibility.test.ts     # Score 0-100 (modes/langs/age/distance)
│   └── hooks/
│       └── useAsyncResource.test.tsx  # loading/data/error/refetch/abort-on-unmount
└── components/ui/
    ├── EmptyState.test.tsx       # Render + a11y + CTA
    └── PageHeader.test.tsx       # landmarks, back button, actions, Skeleton
```

## Conventions

- **Naming** : `foo.test.ts` (logique pure) ou `foo.test.tsx` (rendu React)
- **Co-location** : tests à côté du fichier testé (`matching.ts` → `matching.test.ts`)
- **Pas de DB réelle en unit test** — tout mock via `createMockSupabase`
- **Tests pures** : les fonctions exportées (type `calculateMatchScore`) sont toujours préférées aux pipelines complets qui tapent la DB
- **Cleanup auto** entre chaque test (`afterEach(cleanup)` dans setup)

## Ajouter un test — template

### Logique pure (lib)

```ts
// src/lib/foo.test.ts
import { describe, it, expect } from "vitest";
import { maFonction } from "./foo";

describe("maFonction", () => {
  it("fait ce qu'il faut sur l'happy path", () => {
    expect(maFonction(42)).toBe("result");
  });

  it("gère le cas limite", () => {
    expect(() => maFonction(-1)).toThrow();
  });
});
```

### Composant React

```tsx
// src/components/ui/Foo.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Foo from "./Foo";

describe("<Foo />", () => {
  it("affiche le titre", () => {
    render(<Foo title="Hello" />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("appelle onClick", async () => {
    const onClick = vi.fn();
    render(<Foo onClick={onClick} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### Code qui dépend de Supabase

```ts
import { vi } from "vitest";
import { createMockSupabase, createQueryBuilder } from "@/test/mocks/supabase";

const mock = createMockSupabase();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mock),
}));

// Personnaliser un retour par test
mock.from = vi.fn(() =>
  createQueryBuilder({ data: { foo: 1 }, error: null }),
);
```

### Hook React

```tsx
import { renderHook, waitFor } from "@testing-library/react";
import { useMonHook } from "./useMonHook";

const { result } = renderHook(() => useMonHook());
await waitFor(() => expect(result.current.loading).toBe(false));
expect(result.current.data).toEqual(...);
```

## Couverture visée

- **Libs critiques** (matching, rate-limit, premium-gate) : ≥ 80 %
- **Composants UI primitives** (EmptyState, PageHeader, FilterTabs…) : render + a11y + events principaux
- **Hooks centralisés** (useAsyncResource, useSupabaseQuery) : states + abort + refetch
- **Features cosmétiques** : pas de test unitaire, E2E Playwright suffira
