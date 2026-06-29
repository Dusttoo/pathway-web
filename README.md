# Pathway Web

Web companion for the **Pathway** Pathfinder 2e Discord bot — character builder
and sheet, rules library, homebrew tools, and combat/session tracking. Think
Pathbuilder + D&D Beyond, but focused on PF2e and wired to the bot's shared data.

## Stack

- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript, deployed on Vercel
- **Database/Auth:** Supabase (PostgreSQL) with Discord OAuth
- **Data fetching:** React Query (`@tanstack/react-query`)
- **Styling:** Tailwind CSS v4

The app lives in [`frontend/`](frontend/); SQL migrations live in
[`supabase/migrations/`](supabase/migrations/).

## Local development

```bash
cd frontend
cp .env.example .env.local   # fill in Supabase + Discord credentials
npm install
npm run dev                  # http://localhost:3000
```

Required environment variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY      # server-side only — never expose to the browser
NEXT_PUBLIC_DISCORD_CLIENT_ID
```

## Useful scripts

Run from `frontend/`:

```bash
npm run dev           # start the dev server (Turbopack)
npm run build         # production build
npm run start         # serve the production build
npm run lint          # ESLint
npm run type-check    # tsc --noEmit
npm run format        # Prettier write
```

## Seeding reference content

Reference data (spells, feats, ancestries, classes, items, monsters) is seeded
from Archives of Nethys and the bot's gamedata. Run from `frontend/`:

```bash
export $(grep -v '^#' .env.local | xargs)
npx tsx scripts/seed_nethys.ts            # official PF2e content (idempotent)
npx tsx scripts/seed_gamedata_supabase.ts # bot-curated gamedata
```

See `claude.md` for the full architecture notes (API layer, auth flow, Supabase
client usage, schema, and migrations).

## Deployment

Vercel auto-deploys on push to `main`. Apply schema changes with
`npx supabase db push` from `supabase/` before deploying.
