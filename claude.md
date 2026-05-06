# Pathway Web Companion

Web companion for the Pathway PF2e Discord bot. Analogous to avrae.io — character sheets, combat tracker, inventory, homebrew management. The bot at `../Pathway/` owns all game logic; this app is primarily read-mostly UI over shared Supabase data.

## Stack

- **Frontend**: Next.js 15 App Router + TypeScript, deployed to Vercel
- **Database**: Supabase (PostgreSQL 16), project ID `cmmwirlrvqmjqbydlqks`
- **Auth**: Supabase Discord OAuth (PKCE flow)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Data fetching**: React Query (`@tanstack/react-query`)
- **Bot**: Node.js, lives at `../Pathway/`, deployed on Railway

No Python. No AI/LLM integration in this web app.

## Project Layout

```
web/
  frontend/                    # Next.js app (deploy target)
    src/
      app/
        api/                   # Route Handlers — all backend logic lives here
        (routes)/              # Page components
      lib/
        hooks/                 # React Query hooks (use-*.ts)
        providers/             # Auth context, Query client provider
        supabase/
          server.ts            # createClient() and createServiceClient()
          client.ts            # Browser Supabase client (for Realtime)
        types/
          database.types.ts    # Generated Supabase types — DO NOT edit by hand
  scripts/                     # One-off utilities (run from frontend/)
  supabase/
    migrations/                # SQL migrations (apply with supabase db push)
  vercel.json
```

## Local Dev

```bash
cd frontend
cp .env.example .env.local   # fill in Supabase + Discord credentials
npm install
npm run dev                   # http://localhost:3000
```

Required env vars:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY     ← server-side only, never expose to browser
NEXT_PUBLIC_DISCORD_CLIENT_ID
```

## Architecture

### API Layer

All data mutations and cross-table reads go through Next.js Route Handlers in `src/app/api/`. There is no direct Supabase access in page components or hooks — those call `/api/...` routes.

Route Handler file: `src/app/api/[resource]/route.ts` (list) and `src/app/api/[resource]/[id]/route.ts` (detail).

### Auth Flow

```
User clicks "Login with Discord"
  → Supabase Discord OAuth
  → /api/auth/callback
  → upsert into users table (keyed by discord_id)
  → redirect to /dashboard
```

The `users` table bridges Discord identity (from OAuth) to Supabase identity (for RLS). Every user-scoped resource is joined through `users.discord_id → users.id`.

### Supabase Clients — Use the Right One

**`createClient()`** — cookie-based, respects Row Level Security. Use in Route Handlers to check `auth.getUser()` and in Server Components for user-scoped reads. This client's queries run as the logged-in user; RLS policies filter rows automatically.

**`createServiceClient()`** — service role key, **bypasses RLS entirely**. Use only when you need to read/write rows that don't belong to `auth.uid()`, for example:
- Reading a character that was created by the bot (no auth session on that row)
- Writing bot-side data that the web user should see but didn't create
- Admin operations

Never use the service client for a user's own data if the anon client works — it's an escalation of privilege.

```typescript
// Pattern used in every Route Handler:
const supabase = await createClient();
const { data: { user: authUser } } = await supabase.auth.getUser();
if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// Resolve discord_id → users.id for cross-table joins
const service = createServiceClient();
const discordId =
  authUser.identities?.find(i => i.provider === 'discord')
    ?.identity_data?.provider_id ?? authUser.id;

const { data: dbUser } = await service
  .from('users').select('id').eq('discord_id', discordId).maybeSingle();
if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
```

### Data Fetching Pattern (React Query)

All client-side data fetching uses React Query hooks in `src/lib/hooks/`. Hooks call Route Handler endpoints, not Supabase directly.

```typescript
// Anatomy of a hook (use-characters.ts as template)
export const characterKeys = {
  all: ['characters'] as const,
  list: (params) => [...characterKeys.all, 'list', params] as const,
  detail: (id) => [...characterKeys.all, 'detail', id] as const,
};

export function useCharacters(params = {}) {
  return useQuery({
    queryKey: characterKeys.list(params),
    queryFn: async () => {
      const res = await fetch(`/api/characters?${new URLSearchParams(params)}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });
}
```

Key rules:
- Every resource has a `*Keys` object for consistent cache invalidation.
- Mutations call `queryClient.invalidateQueries({ queryKey: resourceKeys.all })` on success.
- Use `staleTime: Infinity` for data the bot mutates (characters, HP) — rely on Realtime for live updates instead of polling.

### Supabase Realtime (Live Updates)

For data the bot mutates (HP, encounter state), use a Realtime subscription alongside React Query. See `use-characters.ts::useCharacterLive` for the canonical pattern:

```typescript
// Subscribe to postgres_changes, update React Query cache directly
supabase.channel(`character-${id}`)
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'characters', filter: `id=eq.${id}` },
    (payload) => queryClient.setQueryData(key, (old) => ({ ...old, ...payload.new }))
  )
  .subscribe();
```

Always clean up channels in the `useEffect` return function.

## Database Schema

### Core tables

| Table | Purpose |
|---|---|
| `users` | Bridges Discord identity to Supabase auth; keyed on `discord_id` |
| `characters` | Pathbuilder 2e build data + live bot state (HP, overlay, char_key) |
| `companions` | Animal companions / familiars per character |
| `bags` / `bag_items` | Inventory — bags are per user, items reference `items` or `homebrew_entries` |
| `downtime` | Downtime bank + log per character |
| `character_notes` | GM/player notes per character |
| `user_snippets` / `guild_snippets` | Roll macros |
| `homebrew_entries` | Custom monsters, spells, items added via web or bot |
| `monster_art` / `monster_edits` / `monster_attacks` | Bot-side monster overrides |
| `guild_state` | Per-guild settings, calendar, weather state |
| `encounters` / `encounter_events` | Live combat tracker + session history |

### Reference tables (seeded, read-only at runtime)

`monsters`, `spells`, `items`, `gamedata` (actions, conditions, traits, feats, etc.)

The bot reads these at startup into memory. The web app queries them for display.

### Identity conventions

- `discord_id`: Discord snowflake, stored as `TEXT`. Always the join key into the `users` table.
- `user_id`: Supabase UUID from `users.id`. Used as the FK on all user-scoped tables.
- `char_key`: lowercase slug chosen by the user in the bot (e.g. `"aurelius"`). Unique per user. Used to join characters between the bot and web.
- `comp_key`: lowercase slug for companion, unique per character.

## Migrations

Migrations live in `supabase/migrations/`. Filename format: `YYYYMMDDHHMMSS_short_description.sql`.

```bash
# Apply to remote project
cd supabase
npx supabase db push

# Never edit applied migrations. Write a new migration to alter existing tables.
```

After changing the schema, regenerate TypeScript types:

```bash
cd frontend
npx supabase gen types typescript --project-id cmmwirlrvqmjqbydlqks \
  > src/lib/types/database.types.ts
```

**Important**: Never edit `database.types.ts` by hand — it is fully generated and will be overwritten.

RLS policies: every new user-data table should have:
1. A `SELECT` policy using `auth.uid() = user_id` (or a join through `users`)
2. A service-role policy with `USING (true)` for bot writes

## Seeding Reference Data

Both scripts run from `frontend/`:

```bash
cd frontend
export $(grep -v '^#' .env.local | xargs)

# Typed PF2e tables (monsters, spells, items, feats, ancestries, archetypes, etc.)
# Skips tables that already have data — safe to re-run.
npx tsx scripts/seed_pf2e_supabase.ts

# Generic gamedata table (actions, conditions, traits, hazards, domains, etc.)
# Always upserts — safe to re-run, picks up Viv's latest gamedata updates.
npx tsx scripts/seed_gamedata_supabase.ts
```

When Viv updates `Pathway/gamedata/*.json`, re-run `seed_gamedata_supabase.ts` to push the changes to Supabase. The bot picks them up on next startup.

## Coding Conventions

**TypeScript**: strict mode. All Route Handler params and return types should be typed. Import DB row types via `Tables<"table_name">` from `@/lib/types/database.types`.

**Route Handlers**: Always check auth first (`getUser()`), then resolve `discord_id → users.id`, then operate. Return `NextResponse.json({ data: ... })` for success and `NextResponse.json({ error: '...' }, { status: N })` for errors. Wrap Supabase calls in error checks — don't let Supabase errors become 200 responses.

**React Query**: Group mutations with their corresponding query in the same hook file. Invalidate the broad `keys.all` key after mutations so list views refresh. Don't put fetch logic in page components.

**Components**: Use shadcn/ui primitives (`Button`, `Card`, `Dialog`, etc.) rather than writing raw HTML. Keep page components thin — extract data loading into hooks and business logic into utility functions.

**No direct Discord API calls from Next.js**: The bot handles all Discord interactions. The web app only reads the OAuth session's `provider_token` to fetch the user's guild list (for the server picker on character import). That's the only Discord API call from the frontend.

## Deployment

Vercel auto-deploys on push to `main`. No CI/CD config — Vercel GitHub integration handles it.

Schema changes: apply migrations with `npx supabase db push` from `supabase/`, then redeploy. The bot needs to be restarted if the migration adds tables it reads at startup.
