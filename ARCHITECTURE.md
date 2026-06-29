# Pathway — Platform Architecture & Implementation Plan

> Status: **Proposal for approval.** No application code changes are included in this document.
> It is the architecture/implementation plan requested before building.
> Author context: written against the *actual* repository state (Next.js 16 App Router on
> Vercel + Supabase + Railway bot), not a greenfield blank slate.

---

## 0. Reality check — what already exists (read this first)

The brief describes Pathway as if it were starting from zero with a "React + Express on Railway"
stack. The repository tells a different and more useful story. **We already have a substantial,
shipping application.** The plan below evolves it rather than rewriting it.

**What is already built and working:**

- **Frontend/Backend:** Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn-style UI,
  React Query, React Hook Form + Zod. Deployed on Vercel.
- **Backend API:** Next.js **Route Handlers** under `src/app/api/*` (~52 endpoints). There is
  **no separate Express service** today. The bot is the only thing on Railway.
- **Database/Auth/Storage:** Supabase (Postgres 16), project `cmmwirlrvqmjqbydlqks`, Discord
  OAuth (PKCE), Storage buckets for character/homebrew images. ~41 tables, 35 migrations.
- **Character system:** Two builders (`builder/` and the newer `builder-v2/` with per-step flow:
  Start, Ancestry, Heritage, Background, Class, Class Options, Abilities, Skills, Languages,
  Feats, Spells, Equipment, Companion, Review), draft autosave (`character_builder_drafts`),
  variant rules column, character art, public share links.
- **Rules library:** `/library/*` over seeded reference tables (ancestries, backgrounds, classes,
  feats, spells, items, monsters, plus a generic `reference/[category]` route). 15k+ rows.
- **Archive of Nethys importer:** `scripts/seed_nethys.ts` pulling from `elasticsearch.aonprd.com`
  with on-disk cache, idempotent upsert on `aon_id`, plus two bot-gamedata seeders.
- **Homebrew:** entries for ancestries/heritages/backgrounds/classes/feats/spells/items/monsters,
  packs + pack entries, realtime, image bucket.
- **Companions:** `companions` table + per-character companion API.
- **Bot integration:** shared Supabase is the integration bus today; `/api/bot/characters`,
  `guild_state`, `guild_settings`, `user_guild_active_characters`, `encounters` +
  `encounter_events`, snippets (user/guild).
- **Public site:** marketing/docs/legal/pricing/feedback/contact under `(public)`.

**The single biggest decision in this plan** is therefore *not* "what stack" — it's **"do we keep
the Next.js-Route-Handler backend, or introduce the Express-on-Railway service the brief names?"**
My recommendation is in §3 and §30. Short version: **keep Next.js Route Handlers as the primary
API; do not stand up Express.** Introduce a small dedicated service *only* for the few workloads
that genuinely don't fit serverless (scheduled AoN ingestion, heavy PDF rendering, the public-API
gateway), and even those can start as Vercel Cron + Route Handlers.

---

## 1. Executive product summary

Pathway is the definitive digital companion for Pathfinder Second Edition: a rules archive, a
character/companion forge, a campaign command center, a homebrew workshop, and a community
library — paired with the existing Pathway Discord bot so that the website and the bot are two
halves of one platform sharing one database.

The website owns **authoring, browsing, and management** (rules DB, characters, campaigns,
homebrew, dashboards, table tools, exports, accounts). The bot owns **play in Discord** (combat
tracking, lookup, automation, server integration). They meet at a shared Supabase database and a
small set of sync contracts.

The product is delivered in **modules** (Rules Library, Character Vault, Companion Vault, Campaign
Manager, Homebrew Workshop, Table Mode, GM Toolkit, Community Library, Organization Workspaces,
Admin Portal, API Developer Hub, Bot Sync Center). The first three modules largely exist; the plan
sequences the rest behind a stable, multi-tenant-ready data model.

Design north star: it should feel like opening a beautifully crafted adventurer's grimoire —
immersive midnight-blue-and-gold fantasy styling that *enhances* legibility, speed, and
accessibility, never fights them.

Guiding principle from the brief, taken seriously: **architect correctly for the long term, do not
ship a fragile MVP, and do not over-engineer a fully programmable rules engine too early.**

---

## 2. Final clarified feature list

Legend: **[H]** here today · **[P]** partially here · **[N]** new.

### Accounts & platform
- Discord OAuth login **[H]**; email/secondary providers **[N]**
- Account tiers, entitlements, whitelist, feature flags **[N]**
- Multi-tenant organizations/workspaces **[N]**
- Admin portal (users, moderation, importer, logs, bot sync) **[P]** (`/settings/admin` exists)

### Rules database & search
- AoN-style library across all content types **[P]** (most types live; rituals/hazards/deities/
  shields/glossary need first-class routes)
- Remaster-default + Legacy support with source/rarity/traits/prereq/errata metadata **[P]**
- One global search across every entity **[N]** (per-section search exists; unified does not)
- Scheduled AoN importer with logs/admin review/dedupe/change-tracking **[P]** (script exists;
  scheduling, logs table, and admin review UI are new)

### Characters & companions
- Full PF2e builder (Remaster + Legacy, variant rules) **[P]** (builder-v2 covers most steps)
- Per-level choice storage + character history/audit log **[N]** (drafts exist; full level/audit
  storage is new)
- Auto-calc with traceable "why is this value what it is" + manual overrides **[P]/[N]**
- Character dashboard, portraits/tokens/banners, export buttons, bot-sync status **[P]**
- Companions: familiars, animal companions, eidolons, mounts, summons, homebrew **[P]**

### Play & tools
- Table Mode (field-journal play view) **[N]** (a `/combat` + sheet exists; dedicated Table Mode new)
- Native dice roller with bot sync **[P]** (`DiceRoller.tsx` exists; sync is new)
- Campaign manager (players, sharing, permissions, NPCs/monsters/encounters/loot/quests/notes/
  recaps/journals/pinned rules) **[N]** (sharing primitives exist; campaign object is new)
- GM toolkit **[N]**
- Combat tracker **sync** from bot → website (display, not a second tracker) **[P]**

### Community & commerce
- Homebrew visibility tiers (private/campaign/org/public), voting/favorites/comments/reports/
  moderation/verified creators/collections/versioning/changelog/forking **[P]/[N]**
- Marketplace/community library (builds, packs, modules) with draft/publish/version/ratings **[N]**
- Subscriptions (Stripe-ready), free-tier limits, whitelist **[N]** (pricing page exists, no billing)

### Interop & exports
- PDF character/companion sheets **[N]**
- JSON import/export + Pathbuilder-style ID/link compatibility **[P]** (Pathbuilder import exists)
- Foundry/tabletop token export **[N]**
- Public API (auth, scopes, rate limits, keys) **[N]**
- Plugin system (sandboxed, permissioned) **[N, future]**
- Offline-capable character sheets **[N]**
- i18n-ready (English at launch) **[N, architecture only]**

### Explicitly **not** building now (per brief)
AI features; achievements; a full website-native combat tracker beyond bot-sync display; a fully
modular programmable rules engine in the first build.

---

## 3. Recommended architecture (the big picture)

```
                         ┌────────────────────────────────────────────┐
                         │                Supabase                     │
                         │  Postgres 16 (RLS) · Auth · Storage ·       │
                         │  Realtime · Edge Functions (light)          │
                         └───────▲───────────────▲──────────────▲──────┘
                                 │               │              │
         RLS (anon/user) + service-role          │ service-role │ service-role
                                 │               │              │
        ┌────────────────────────┴───┐   ┌───────┴──────┐  ┌────┴───────────────┐
        │  Pathway Web (Next.js 16)  │   │ Pathway Bot  │  │  Worker service     │
        │  Vercel                    │   │ Railway      │  │  (Railway) — NEW,    │
        │  - App Router pages (RSC)  │   │ - combat     │  │  thin & optional:    │
        │  - Route Handlers = API    │   │ - lookup     │  │  - AoN ingestion     │
        │  - React Query + Realtime  │   │ - dice       │  │  - PDF render        │
        │  - Public API (/api/v1)    │◄─►│ - sync       │  │  - public-API edge   │
        └────────────────────────────┘   └──────────────┘  └─────────────────────┘
                  ▲                                                   
                  │ HTTPS (cookies / API keys)                        
            Browsers / Foundry / Roll20 / Owlbear / community tools   
```

### Core decisions

1. **Keep Next.js Route Handlers as the application API.** They already implement the auth +
   `discord_id → users.id` + service-role pattern documented in `claude.md`. Migrating ~52
   endpoints to Express buys nothing and risks the working product. *Reconciles with the brief by
   treating "Express on Railway" as satisfied-in-spirit by the existing server layer.*

2. **One database, many consumers.** Supabase remains the integration bus between web and bot.
   RLS is the primary security boundary; the service role is used narrowly (bot-owned rows, admin,
   cross-tenant reads) exactly as today.

3. **Introduce a thin worker only where serverless is a bad fit.** Three workloads: (a) scheduled
   AoN ingestion, (b) PDF rendering (headless Chromium is heavy/cold-start-hostile on Vercel),
   (c) the public-API gateway if/when rate-limit + key management outgrows Route Handlers. Start
   (a) on **Vercel Cron + Route Handler**, promote to a Railway worker if runtime/limits demand it.
   Co-locate the worker with the bot's Railway project to reuse infra.

4. **The public API is a versioned surface (`/api/v1`)**, *separate from* the cookie-authed
   internal `/api/*` used by the app. Different auth (API keys/OAuth tokens), different rate limits,
   different docs. This keeps "internal app calls" and "third-party integrations" from sharing a
   blast radius.

5. **Modules are packages, not just routes.** Even inside one Next.js app, organize domain logic
   into `src/modules/<module>/` (server services + zod schemas + types) so each module has a clear
   contract. This is the "platform of modules" the brief asks for without prematurely splitting
   into microservices.

### What we explicitly do NOT do
- No microservices fan-out. One app + one bot + (eventually) one small worker.
- No GraphQL. REST Route Handlers + typed clients are already the idiom.
- No second ORM. Supabase client + generated types remain the data layer.

---

## 4. Frontend architecture

**Framework:** Next.js 16 App Router, React 19, TypeScript strict. Server Components for
read-mostly pages (library, public profiles, shared sheets); Client Components for interactive
builders/table mode. Keep this split — it is already the pattern.

**Proposed source layout (evolution of current):**
```
src/
  app/                      # routing only; pages stay thin
    (public)/ (auth)/ (app)/  # add (app) group for authed shell w/ dashboard chrome
    api/                    # internal API (cookie auth)
    api/v1/                 # NEW public API (key/token auth), versioned
  modules/                  # NEW — domain logic, server-side, framework-agnostic
    rules/ characters/ companions/ campaigns/ homebrew/ community/
    organizations/ billing/ botsync/ exports/ search/ admin/
      service.ts            # pure functions over supabase (service or user client)
      schema.ts             # zod request/response contracts (shared w/ API + forms)
      types.ts
  components/               # presentational + shared UI (existing, keep)
  lib/                      # supabase clients, hooks, providers, utils (existing)
  design/                   # NEW — design tokens, theme, motion primitives (see §below)
```
Route Handlers become **thin controllers** that validate with the module's zod schema and call the
module service. This removes business logic from `route.ts` files and makes the same logic reusable
by the public API and the worker.

**State/data:** React Query for server state (existing `*Keys` + invalidation convention);
Supabase Realtime for bot-mutated data (existing `useCharacterLive` pattern); React Hook Form +
Zod for builders.

**Design system (the grimoire):**
- **Tokens** in CSS variables (Tailwind v4 `@theme`): palette = deep midnight blue / navy /
  blackened indigo / charcoal base; warm gold / antique brass / soft silver / emerald accents;
  arcane cyan reserved for "magic happening" states only. Light + dark mode are token swaps.
- **Two readability fonts** (a humanist sans for UI/body, a restrained display serif for headings)
  — *no* hard-to-read blackletter for content.
- **Texture as accent, never as content background:** parchment/stone/filigree confined to card
  edges, headers, dividers — body copy always sits on near-solid surfaces meeting WCAG AA contrast.
- **Motion primitives** (`src/design/motion`): floating particles, rune illumination, spell-circle
  page transitions, ink-spread, compass-needle, ambient glow, magical loaders. All gated behind a
  single `useReducedMotion()` + a user "Effects" setting (off/reduced/full); particles auto-pause
  off-screen and on low-power.
- **Cosmetic class themes** (wizard runes, champion heraldry, druid vines, etc.) implemented as a
  *theme overlay* (extra accent tokens + optional decorative layer) on an unchanged layout — never
  layout-affecting.
- **Mode toggles:** Dark/Light, **Beginner Mode**, **Learning Mode** are global context flags
  (persisted to user prefs) that components read to show/hide explanation surfaces. Beginner/
  Learning content lives in data (see §7) so it's not hardcoded in components.

**Accessibility:** keyboard-first builders, focus management in dialogs, semantic landmarks, ARIA
for custom widgets, contrast budget enforced via tokens, reduced-motion honored everywhere.

---

## 5. Backend architecture

**Primary API = Next.js Route Handlers** (`/api/*`), cookie/session auth, RLS-respecting client by
default, service-role client only for cross-user/admin/bot-owned rows (this pattern is already
codified in `claude.md` — we standardize and lint for it).

**Standard request shape (formalized):**
```
handler → zod-validate input → resolve auth (getUser → discord_id → users.id)
        → authorize (RLS + explicit checks for org/campaign roles)
        → module service call → typed NextResponse
```
Cross-cutting helpers (new, in `lib/api/`): `withAuth`, `withRateLimit`, `withValidation(schema)`,
consistent `apiError`/`apiOk`. Today every handler hand-rolls this; centralizing reduces drift and
closes security gaps.

**Public API (`/api/v1/*`)** — separate middleware chain: API-key/token auth, scope checks,
stricter rate limiting, no cookies, public/private data partition enforced server-side. (§21.)

**Worker service (Railway, introduced when needed):** a small Node service sharing the bot's
Railway project. Responsibilities: scheduled AoN ingestion runs (writing to `import_runs` +
staging tables), PDF rendering jobs, and optionally hosting `/api/v1` behind a stable host if we
want the public API off Vercel's function limits. Talks to Supabase via service role; never exposed
to browsers directly except as the public API host.

**Background work & scheduling:** Vercel Cron triggers ingestion/maintenance Route Handlers for
light jobs; the Railway worker (with a real cron/queue) handles heavy/long jobs. A simple
Postgres-backed job table (`jobs`) gives durable status without adding Redis early.

**Realtime:** Supabase Realtime for HP/encounter/sync state (already used). Bot writes rows; web
subscribes. No custom socket server.

---

## 6. Supabase database schema

The current ~41 tables stay. Below is the **target schema by domain**, marking existing vs new.
All new user-data tables get RLS: a user/owner `SELECT`/write policy plus a `service_role`
`USING(true)` policy (the existing convention). Org-scoped tables additionally gate on membership.

### Identity & accounts (existing + extend)
- `users` *(exists)* — Discord↔Supabase bridge.
- `user_profiles` **NEW** — display name, avatar, bio, public handle, prefs (theme, beginner/
  learning mode, effects level, locale).
- `account_tiers` **NEW** — tier definitions (free, plus, …).
- `entitlements` **NEW** — `(user_id, key, value, source)` resolved feature limits.
- `feature_flags` **NEW** — global/segment flags.
- `whitelist` **NEW** — permanent-free grants (admin-managed).
- `subscriptions` **NEW** — Stripe-ready: `stripe_customer_id`, `stripe_subscription_id`, status,
  tier, period; nullable until Stripe is wired.

### Organizations / workspaces (new)
- `organizations` — name, slug, settings, discord_guild_id (optional link).
- `organization_members` — `(org_id, user_id, role)` role ∈ {admin, moderator, gm, member}.
- `organization_invites`.
- Shared-content link tables: campaigns/homebrew/NPC/monster/loot/encounter packs can carry a
  nullable `organization_id` for org-scoping (single column, not duplicate tables).

### Rules / reference content (existing, extend metadata)
- `ancestries, heritages, backgrounds, archetypes, classes, class_features, feats, spells, items,
  monsters, actions, conditions, skills, gamedata` *(exist)*.
- **NEW reference tables** to reach full AoN parity: `rituals`, `hazards`, `deities`, `shields`
  (if not modeled as items), `languages`, `traits` (promote from gamedata if needed),
  `source_books`, `glossary_terms`.
- **Metadata columns** (ensure on all reference tables): `is_official`, `created_by_user_id`,
  `aon_id`, `aon_url` *(exist where seeded)*; **add where missing** `ruleset` ∈
  {remaster, legacy, both}, `rarity`, `traits[]`, `prerequisites`, `source_book_id`,
  `errata` jsonb, `version`, `updated_source_at`.
- `content_learning` **NEW** — Beginner/Learning Mode copy keyed to a content row
  (`content_type`, `content_id`, `plain_summary`, `why_it_matters`, `common_mistakes`,
  `good_pairings`, `examples`) so teaching text is data, not code.

### Characters (existing, extend)
- `characters` *(exists — Pathbuilder build + live bot state)*.
- `character_classes, character_feats, character_known_spells, character_prepared_spells,
  character_class_features, character_builder_drafts, character_notes` *(exist)*.
- `character_levels` **NEW** — one row per level with the choices made at that level (jsonb),
  enabling history/restore/audit.
- `character_audit_log` **NEW** — `(character_id, actor_user_id, actor_kind ∈
  {owner,gm,bot,admin}, action, before, after, created_at)`.
- `character_overrides` **NEW** — explicit manual overrides `(character_id, target_path, value,
  reason, created_by, created_at)` so overrides are marked + reversible + traceable.
- `character_versions` **NEW** — autosave/restore snapshots (jsonb), bounded retention.
- `character_public_shares` *(exists)*.

### Companions (existing, extend)
- `companions` *(exists)* → extend with `kind` ∈ {familiar, animal_companion, eidolon, mount,
  summon, custom}, `build` jsonb, art columns, `is_homebrew`, `audit`/`versions` mirrors as needed.

### Campaigns & GM (new)
- `campaigns` — owner, org_id?, name, system metadata, settings, discord_guild_id?.
- `campaign_members` — `(campaign_id, user_id, role ∈ {gm, player, viewer}, permissions jsonb)`.
- `campaign_characters` — link characters to a campaign with per-character GM-edit grant.
- `campaign_npcs`, `campaign_monsters` (or references to monster rows + overrides),
  `campaign_encounters`, `campaign_loot`, `campaign_quests`, `campaign_notes`,
  `campaign_journals`, `campaign_recaps`, `campaign_pinned_rules`.
- Later: `campaign_calendar`, `campaign_maps`.

### Homebrew & community (existing, extend)
- `homebrew_entries`, `homebrew_packs`, `homebrew_pack_entries` *(exist)*.
- **NEW**: `homebrew_versions` (versioning/changelog), `homebrew_votes`, `homebrew_favorites`,
  `homebrew_comments`, `homebrew_reports`, `homebrew_forks` (attribution lineage),
  `creator_badges` (verified/featured).
- Visibility model: `visibility` ∈ {private, campaign, organization, public} + nullable
  `campaign_id`/`organization_id` on entries/packs.
- Marketplace: `listings` (publishable wrapper around a build/pack/module), `listing_versions`,
  `listing_ratings`, `listing_favorites`, `listing_reports`, `listing_collections`.

### Play / sync (existing)
- `encounters`, `encounter_events` *(exist)* — bot-owned, web subscribes.
- `user_snippets`, `guild_snippets` *(exist)*.
- `guild_state`, `guild_settings`, `user_guild_active_characters` *(exist)*.
- **NEW**: `dice_rolls` (optional shared roll log for web↔bot dice sync), `sync_log`
  (two-way sync audit + conflict records), `discord_links` (user↔discord, campaign↔guild
  authorization records).

### Platform ops (new)
- `import_runs` + `import_run_items` — AoN ingestion logs, per-record diffs, errors, admin review.
- `api_keys`, `api_key_scopes`, `api_request_log` — public API.
- `audit_log` (platform-wide admin actions), `error_log`, `jobs` (durable background work),
  `feature_reports`/`feedback_submissions`/`contact_submissions` *(last two exist)*.

### Cross-cutting conventions
- Soft-delete (`deleted_at`) on user content that supports restore.
- `created_at/updated_at` everywhere; `updated_at` via trigger.
- jsonb for flexible build data (already the norm) with zod validation at the app boundary.
- Every migration ships its RLS policies in the same file; types regenerated after each push.

---

## 7. Rules engine design (deliberately not a generic VM)

The brief is explicit: **structured and extensible, but do not turn every feat/spell/item into a
programmable object yet.** The design:

**Layered calculator, not an interpreter.**
1. **Base layer:** ancestry/class/level math (ability mods, proficiency by rank+level, HP, etc.) —
   pure TypeScript in `modules/characters/calc/`. This already exists in spirit in
   `builder-v2/progression.ts`; we consolidate it.
2. **Modifier layer:** a typed `Modifier` record — `{ source, type ∈ {item,status,circumstance,
   proficiency,ability,untyped,penalty}, target, value, condition?, duration? }`. Modifiers come
   from a **curated set** of known feats/items/effects (hand-mapped data), *not* arbitrary code.
   Stacking follows PF2e rules (highest of each typed bonus; penalties stack by type rules).
3. **Override layer:** `character_overrides` win last and are flagged in the UI.

**Traceability ("why is this 23?")** — every computed stat returns a `Breakdown`:
`{ total, steps: [{ label, value, source, modifierType }] }`. The sheet renders this in a tooltip/
popover. Manual overrides appear as a distinct, reversible step.

**Effects/conditions:** conditions (`frightened`, `clumsy`, …) are data rows that emit standard
modifiers for a duration; temporary effects are user-applied modifier records with expiry. This
covers "temporary effects, conditions, item/status/circumstance bonuses, proficiency/ability
changes, variant rules" without a general scripting engine.

**Variant rules** (Free Archetype, Gradual Boosts, Ancestry Paragon, ABP) are **config flags** on
the character that the calculator and builder branch on — modular config, not bespoke code paths
scattered around.

**Extensibility path (deferred):** if/when a true effect engine is justified, the `Modifier` record
is the seam — a future rules-DSL would compile to the same Modifier records the calculator already
consumes. We design the seam now, build the VM never (until proven necessary).

---

## 8. Archive of Nethys ingestion design

Builds on the existing `seed_nethys.ts` (ES source, on-disk cache, idempotent `aon_id` upsert).

**Pipeline (staged, auditable):**
```
fetch (ES / structured source, rate-limited, robots-respecting, cached)
  → normalize/transform (per-category transformers, existing pattern)
  → stage into *_staging tables
  → diff vs live (new / changed / removed)  → write import_run_items
  → upsert official rows (is_official=true), never touching is_official=false (homebrew)
  → record import_run (counts, errors, duration, source URLs/attribution)
```

**Requirements coverage:**
- **Respect terms/robots/limits:** concurrency cap + delay + cache; store source URL + attribution
  on every row (`aon_url`, attribution text per source book).
- **Prefer stable structured sources:** keep ES as today; abstract behind a source adapter so a
  better feed can be swapped in.
- **Dedup & change tracking:** upsert on `aon_id`; diffs recorded in `import_run_items`.
- **Scheduling:** Vercel Cron (light) or Railway worker cron (full nightly) → calls an admin-only
  ingestion endpoint with a service token.
- **Admin tooling:** `/settings/admin/importer` — run history, per-record diffs, errors, "approve/
  reject changes" for sensitive categories, manual refresh button.
- **Official vs homebrew separation:** enforced by `is_official` + RLS; importer only writes
  official rows.
- **Remaster vs Legacy + source book:** `ruleset` + `source_book_id` columns populated from source.

---

## 9. Homebrew system design

Extends the existing homebrew tables/UI.

- **Object model:** every homebrew item is a content row (`is_official=false`,
  `created_by_user_id`) + optional membership in `homebrew_packs`. Supported types already include
  ancestries/heritages/backgrounds/classes/feats/spells/items/monsters; extend to archetypes,
  weapons/armor/shields (as items), NPCs, companions, familiars, eidolons, conditions, traits,
  actions, custom rules.
- **Visibility:** `private | campaign | organization | public` with nullable `campaign_id`/
  `organization_id`. RLS enforces who can read each tier.
- **Lifecycle:** draft/autosave → publish; `homebrew_versions` for version history + changelog;
  soft-delete + restore.
- **Community:** votes, favorites, comments, reports, moderation queue, verified/featured creator
  badges, collections, fork/remix with attribution lineage (`homebrew_forks`).
- **Validation:** zod schemas per type so homebrew is structurally compatible with official content
  (same shape → same sheet rendering, same calculator inputs).
- **Bot sync:** public/eligible homebrew is queryable by the bot via shared DB (already possible);
  a `homebrew_sync` flag controls exposure to `!homebrew` lookups.

---

## 10. Marketplace / community library design

A publish layer **on top of** homebrew + characters (no money required at first).

- **Listings:** wrap a publishable artifact (character build, campaign template, homebrew pack,
  NPC/monster/encounter/loot pack, adventure module, rules collection, themed pack) in a `listings`
  row with `status ∈ {draft, published, unpublished}` and `listing_versions`.
- **Discovery:** browse/search/filter, ratings/votes, favorites, featured, collections.
- **Trust/safety:** comments, reports, moderation tools, version history, attribution.
- **Commerce-ready (later):** a `price`/`stripe_price_id` column dormant until Stripe; entitlement
  checks gate paid packs. Nothing about the schema blocks turning it on.

---

## 11. Organization / workspace design (multi-tenant)

- **Tenancy model:** `organizations` + `organization_members(role)`. Content tables gain a nullable
  `organization_id`. RLS policies add an org-membership predicate. This is **row-level
  multi-tenancy in one database** (simplest correct model for this scale) — not separate schemas
  or DBs.
- **Roles:** org admin, moderator, GM, member. Permissions resolved by a single
  `authorizeOrg(user, org, action)` helper used by both Route Handlers and the public API.
- **Shared assets:** campaigns, homebrew, NPC/monster/loot/encounter libraries, notes, server
  settings, per-server Discord integration — all keyed by `organization_id`.
- **West Marches fit:** many GMs, many campaigns, shared rosters and content under one org;
  Discord-guild linkage per org.

---

## 12. Character builder flow

Evolves `builder-v2/` (already step-based with draft autosave).

```
Start (name, ruleset Remaster|Legacy|mixed, variant rules, level)
 → Ancestry → Heritage → Background → Class → Class Options
 → Abilities (boosts; honors Gradual Boosts / ABP) → Skills → Languages
 → Feats (Free Archetype aware) → Spells → Equipment → Companion → Review
```
- **Per-step autosave** to `character_builder_drafts` *(exists)*; on finalize, write `characters`
  + join tables + **one `character_levels` row per level** with the choices made.
- **Beginner/Learning surfaces** pull from `content_learning` at each decision point.
- **Auto-calc with breakdowns** via §7; **manual overrides** recorded in `character_overrides`.
- **Variant rules** branch the flow via config flags, not forks of the builder.
- **Leveling up** re-enters the relevant steps for the new level and appends a `character_levels`
  row + `character_audit_log` entries.
- **Output:** internal schema + Pathbuilder-compatible export (§17), portrait/token/banner art,
  campaign assignment.

## 13. Companion builder flow

- Pick `kind` (familiar / animal companion / eidolon / mount / summon / custom / homebrew) →
  kind-specific steps (familiar abilities; companion type+maturity; eidolon evolutions; etc.) →
  art (portrait/token) → attach to a character or stand alone → Review.
- Stored in `companions` with `build` jsonb; supports independent export and bot sync; same
  versioning/audit primitives as characters where it matters.

## 14. Campaign manager flow

- **Create campaign** (optionally under an org; optionally linked to a Discord guild).
- **Roster:** invite players, assign characters (`campaign_characters`), set per-member role +
  permissions (view-only / editable / GM-edit on specific characters).
- **GM workspace tabs:** Players · Characters · NPCs · Monsters · Encounters · Loot · Quests ·
  Notes · Journals · Recaps · Pinned Rules · (later) Calendar · Maps · Campaign Homebrew.
- **Permissions** resolved centrally; GM edits to player characters are logged to
  `character_audit_log` with `actor_kind='gm'`.
- **Bot link:** campaign↔guild record enables the bot to scope combat/lookup to the campaign.

## 15. Table Mode design

A focused, fast **field-journal play view** (distinct from the builder and the public sheet).

- **Layout:** persistent vitals rail (HP, AC, Perception, Saves, Hero Points, Focus Points,
  conditions) + tabbed content (Actions/Reactions/Free · Attacks/Damage · Spells: slots/prepared/
  known · Skills · Inventory/Consumables · Notes · Rules refs).
- **Quick-roll everywhere:** every rollable value has a one-tap roller (attacks, damage, saves,
  skills, initiative, flat checks, persistent damage) via the existing `DiceRoller`.
- **Live & offline:** Realtime reflects bot-driven HP/condition changes; the sheet is offline-
  capable (§23) so play continues without connectivity, syncing on reconnect.
- **No second combat tracker:** the bot owns initiative/turn order; Table Mode *displays* synced
  encounter state for GM/players (read + targeted writes like HP only).
- Honors reduced-motion and Beginner/Learning toggles (Learning Mode surfaces rules refs inline).

---

## 16. Bot sync architecture

Shared Supabase is the bus (as today); we formalize the contract.

- **Identity linkage:** `users.discord_id`, `char_key`/`comp_key` slugs *(exist)*; `discord_links`
  records explicit user↔Discord and campaign↔guild authorization.
- **Two-way sync:**
  - *Web → Bot:* web writes characters/companions/homebrew; bot reads on demand / on Realtime.
  - *Bot → Web:* bot writes HP/conditions/encounters/dice; web subscribes via Realtime
    (existing `useCharacterLive`).
- **Combat tracker:** bot remains source of truth; `encounters`/`encounter_events` stream to the
  website for GM display.
- **Dice sync:** optional `dice_rolls` log so a roll on either surface can appear on the other.
- **Conflict handling:** last-writer-wins for live fields (HP); for build data, the web is
  authoritative and the bot consumes — conflicts recorded in `sync_log` with a resolution choice.
- **Security:** bot uses service role; per-user actions still checked against `discord_links`;
  all sync events audited.
- **Pathbuilder JSON** remains the interchange format the bot already understands (§17).

---

## 17. Pathbuilder JSON compatibility plan

- **Internal schema** (versioned, zod): the canonical Pathway character shape (already largely in
  `lib/types/character.ts` + `pathbuilder_data` jsonb).
- **Compatibility layer:** `modules/exports/pathbuilder/` with `toInternal()` / `fromInternal()`
  mappers + **import validation** and **export validation** (zod), explicit error messages, and a
  `compat_notes` channel for lossy fields.
- **Versioning:** `schema_version` on exports; importer tolerates known prior versions.
- **Bot compatibility:** because the bot already round-trips Pathbuilder JSON, the internal↔
  Pathbuilder mappers double as the bot contract. ID/link import (paste JSON, upload file, or
  Pathbuilder ID/link) all funnel through the same validator (import-by-ID/paste already exists).

---

## 18. PDF export plan

- **Renderer:** server-side headless Chromium printing a dedicated print-CSS React route
  (`/print/character/[id]`), run in the **Railway worker** (cold-start + binary size make this a
  poor fit for Vercel functions). Output streamed to the user and optionally cached to Storage.
- **Sheets:** clean, readable, table-friendly, themed, printer-friendly; companion sheets too.
- **Theming:** a `pdf_theme` parameter; ships with a free default, structured so **paid PDF themes**
  are a later entitlement (theme = a token set + layout variant).
- **Determinism:** PDF renders from the computed sheet (with breakdowns hidden) so it matches the
  on-screen sheet exactly.

## 19. Image / token export plan

- **Storage:** Supabase buckets *(image buckets exist for character/homebrew)* with validation
  (type/size/dimensions, re-encode to strip metadata) — see §24.
- **Tokens:** portrait/token/banner per character + companion. **Foundry-compatible token export**
  (correctly sized PNG/WebP with transparent ring-ready framing + a Foundry actor JSON stub) and a
  generic **tabletop token** (bordered round token PNG). Generated by a small image pipeline in the
  worker (sharp) or on upload.
- **Export bundle:** a character export can include art + token assets alongside JSON.

---

## 20. Subscription & whitelist architecture (Stripe-ready, Stripe-deferred)

- **Schema:** `account_tiers`, `entitlements`, `subscriptions` (Stripe IDs nullable), `whitelist`,
  `feature_flags` (§6).
- **Entitlement resolution:** a single `getEntitlements(user)` merges tier defaults + overrides +
  whitelist + flags → a typed object the app and API both consult. Free tier limits (4 characters,
  1 campaign, limited homebrew) enforced at the service layer (not just the UI).
- **Stripe-ready:** webhook endpoint stub + customer/subscription columns; flipping Stripe on means
  implementing the webhook + checkout, no schema migration.
- **Admin:** whitelist management + entitlement review in the Admin Portal.

## 21. Public API safety plan

- **Surface:** `/api/v1/*`, versioned, **separate from internal `/api/*`.**
- **Auth:** API keys (hashed at rest, shown once) and/or OAuth tokens; per-key **scopes**
  (`characters:read`, `campaigns:read`, `homebrew:read`, …) — least privilege, read-biased.
- **Authorization:** same `authorize*` helpers as the app; public/private data partition enforced
  server-side (private rows never leak via the API regardless of scope).
- **Rate limiting:** per-key + per-IP (token bucket); `api_request_log` for abuse detection.
- **Abuse prevention:** quotas by tier, kill-switch flags, anomaly alerts to Admin Portal.
- **Docs:** an API Developer Hub (OpenAPI spec generated from the v1 zod schemas) with keys UI.
- **Consumers:** designed for the bot, Foundry, Roll20, Owlbear, and community tools.

## 22. Plugin safety plan (future, designed-not-built)

- **No arbitrary code execution.** Plugins are **declarative + sandboxed**: a manifest of requested
  scopes + UI extension points + (later) sandboxed compute in a Web Worker / isolated iframe with a
  capability-limited message API. No DOM/network/DB access except via brokered, permissioned APIs.
- **Distribution:** plugins are reviewed listings in the community library; install grants explicit
  permissions the user approves.
- **Now:** we only reserve the seams (extension points + scope model). We do not implement a runtime
  until the security model is proven.

## 23. Offline mode plan

- **Scope:** offline **viewing + light Table-Mode** for a character (not full builder).
- **Mechanism:** PWA service worker (Next PWA) caching the app shell + the active character's
  computed sheet (IndexedDB). Mutations made offline (HP, hero points, notes) queue locally.
- **Sync:** on reconnect, replay the queue against the API; conflicts resolved with the same
  last-writer-wins-for-live-fields policy as bot sync, surfacing a diff when a real conflict exists.
- **Boundaries:** reference data is cached read-only; anything requiring server compute degrades
  gracefully with a clear offline indicator.

## 24. Security plan

- **AuthZ boundary = RLS first.** Every user-data table has owner + service-role policies; org/
  campaign tables add membership predicates. Service role used only where RLS can't express the
  need (bot rows, admin, cross-tenant) — and never with user-supplied row ids unchecked.
- **App-layer authorization** mirrors RLS for defense in depth (`authorizeOrg`, `authorizeCampaign`,
  `authorizeCharacter`).
- **Input validation:** zod at every Route Handler + API boundary; reject-by-default.
- **File uploads:** type/size/dimension checks, re-encode (sharp) to strip EXIF/scripts, store with
  randomized keys, serve from Storage with restrictive policies; scan for content-type spoofing.
- **API safety:** §21 (keys, scopes, rate limits, logging, abuse prevention).
- **Bot sync security:** §16 (scoped, audited, authorization records).
- **Secrets:** service-role key server-only (already enforced); per-environment env vars; never to
  the browser.
- **Audit & logging:** `character_audit_log`, platform `audit_log`, `error_log`, `api_request_log`,
  `sync_log`, `import_run*`.
- **Privacy/compliance:** existing GDPR/privacy/cookies/terms pages; add data export + delete-my-
  account flows; soft-delete + retention windows; backups via Supabase PITR.
- **Rate limiting** on sensitive internal endpoints (auth callback, uploads, imports) too.

---

## 25. Deployment plan (Vercel · Railway · Supabase · www.pathwaypf2e.com)

- **Frontend + internal API:** Vercel, auto-deploy on push to `main` (already configured;
  `vercel.json` present). Preview deploys per PR.
- **Bot (+ future worker):** Railway. Worker shares the Railway project; cron/queue for ingestion,
  PDF, image, public-API host if promoted off Vercel.
- **Database/Auth/Storage:** Supabase project `cmmwirlrvqmjqbydlqks`. Migrations via
  `supabase db push`; types regenerated after each push (`gen types typescript`). Enable PITR
  backups; staging project for migration rehearsal.
- **Domains:** `www.pathwaypf2e.com` → Vercel (apex → www redirect). `api.pathwaypf2e.com` →
  public API host (Vercel rewrite to `/api/v1`, or Railway worker) once the public API ships.
  Supabase keeps its project domain; consider a custom auth domain later.
- **Environments:** `production` (main) + `preview` (PRs) + `local`. Per-env Supabase keys +
  Discord OAuth redirect URLs.
- **CI/CD:** add GitHub Actions for type-check + lint + tests on PR (pre-commit config exists);
  Vercel handles deploy. Migrations gated behind a manual/admin step, not auto-applied on deploy.
- **Observability:** Vercel analytics/logs + Supabase logs + an `error_log` table + (later) Sentry.

---

## 26. Development roadmap

Sequenced to harden what exists, then expand. Each phase ends shippable.

- **Phase 0 — Foundation hardening (existing surface).** Extract `modules/*` services from fat
  Route Handlers; add `withAuth/withValidation/withRateLimit`; consolidate the calculator from
  builder-v2; add CI (type-check/lint/test); document the RLS convention as lint/review rule.
- **Phase 1 — Character depth.** `character_levels`, `character_audit_log`, `character_overrides`,
  `character_versions`; stat breakdowns ("why is this 23?"); finish Remaster/Legacy + variant-rule
  coverage in builder-v2.
- **Phase 2 — Table Mode + Dice + Offline (read).** Field-journal Table Mode, quick-rolls, Realtime
  display of bot encounters, PWA offline viewing.
- **Phase 3 — Rules library completion + Global Search + AoN ops.** New reference types
  (rituals/hazards/deities/shields/languages/glossary/sources), metadata backfill, unified global
  search, `import_runs` + admin importer UI + scheduling.
- **Phase 4 — Homebrew 2.0 + Companions depth.** Versioning/changelog, votes/favorites/comments/
  reports/moderation/forking, visibility tiers; companion builder kinds + sync.
- **Phase 5 — Campaign Manager + GM Toolkit.** Campaigns, roster/permissions, NPC/monster/encounter/
  loot/quests/notes/journals/recaps/pinned rules; bot campaign↔guild link.
- **Phase 6 — Organizations/Workspaces.** Tenancy model, roles, shared libraries, per-server Discord.
- **Phase 7 — Exports + Interop.** PDF (worker), Foundry/tabletop token export, hardened Pathbuilder
  round-trip + versioned JSON.
- **Phase 8 — Subscriptions + Public API + Developer Hub.** Entitlements/whitelist/flags live;
  Stripe wired; `/api/v1` + keys/scopes/rate limits + OpenAPI docs.
- **Phase 9 — Marketplace/Community Library.** Listings, ratings, moderation, featured.
- **Phase 10 — Plugin seams + i18n scaffolding + polish.** Extension points + scope model; locale
  scaffolding; cosmetic class themes.

(Phases are independently shippable; 3–5 can interleave. Bot-side work flagged per phase.)

## 27. MVP vs full release boundary

- **MVP (definition of "good enough to call v1"):** Phases 0–3 + PDF/JSON export from Phase 7's
  front half. I.e. hardened existing app + character history/overrides/breakdowns + Table Mode +
  offline-view + completed rules library + global search + working AoN ops + clean exports. This is
  a *complete single-player/companion product* with bot sync.
- **Full release:** add campaigns + organizations + homebrew 2.0 + marketplace + subscriptions +
  public API. These are the platform/community layers.
- **Deferred-by-brief:** AI, achievements, native combat tracker, programmable rules VM, plugins
  runtime (seams only).

## 28. Testing strategy

- **Unit:** the calculator (§7) is the highest-value target — golden tests per ancestry/class/level
  + variant-rule matrices; modifier-stacking rules; Pathbuilder mappers (round-trip property tests).
- **Schema/contract:** zod schemas tested against fixture payloads (Pathbuilder imports, API
  requests); migration smoke tests on a staging Supabase.
- **Integration:** Route Handler tests with a seeded test DB (auth + RLS behavior, authorization
  helpers, entitlement enforcement).
- **E2E:** Playwright (already provisioned in this environment) for builder happy-paths, Table Mode,
  homebrew create→publish, share links, offline reconnect.
- **Security tests:** RLS policy tests (a user cannot read another's private rows), API scope tests,
  upload validation tests.
- **CI gates:** type-check + lint + unit on every PR; E2E on main/nightly.

## 29. Risks & technical challenges

- **Stack-brief mismatch (highest):** the brief says Express-on-Railway; reality is Next.js Route
  Handlers. Rewriting would burn the existing product. **Mitigation:** keep Route Handlers; treat
  the worker as the only new server. *(Needs your sign-off — §30.)*
- **Rules correctness/scope creep:** PF2e math (esp. Remaster vs Legacy + variants + stacking) is
  deep. **Mitigation:** layered calculator + golden tests + manual overrides as the escape hatch;
  resist the generic VM.
- **AoN terms/ToS & data provenance:** ingestion must respect robots/limits/attribution.
  **Mitigation:** rate-limited cached importer, source URLs + attribution stored, official/homebrew
  separation, admin review.
- **Multi-tenant RLS complexity:** org/campaign predicates can get subtle. **Mitigation:** central
  authorize helpers + RLS policy tests + defense-in-depth.
- **Bot↔web sync conflicts:** concurrent edits to live fields. **Mitigation:** clear ownership
  (bot = live state, web = build), last-writer-wins for live fields, `sync_log`.
- **PDF/headless on serverless:** cold starts + binary size. **Mitigation:** render in the Railway
  worker, cache outputs.
- **Offline conflict resolution:** genuinely hard. **Mitigation:** keep offline write surface small
  (HP/notes/hero points), explicit conflict surfacing.
- **Performance of a 15k+ row library + global search:** **Mitigation:** Postgres FTS / trigram
  indexes, server components, pagination (already partly in place).
- **Two migration sources of truth (web vs bot):** **Mitigation:** web repo owns schema; bot reads;
  coordinate breaking changes; staging rehearsal.

## 30. Questions that still need your approval

1. **Backend stack (blocking).** Confirm we **keep Next.js Route Handlers** as the primary API and
   add only a thin Railway worker for ingestion/PDF/public-API — i.e., **do not** build the separate
   Express service the brief named. *(My strong recommendation: yes, keep Route Handlers.)*
2. **Rebuild vs evolve.** Confirm we **evolve the existing app** (Phase 0 hardening first) rather
   than restart. *(Recommendation: evolve.)*
3. **MVP boundary.** Is the §27 MVP (hardened app + character depth + Table Mode + library/search +
   exports, *before* campaigns/orgs/marketplace/billing) the right v1 line?
4. **Builder consolidation.** There are two builders (`builder/` and `builder-v2/`). Confirm
   **builder-v2 is canonical** and `builder/` is slated for removal.
5. **Schema ownership.** Confirm this web repo is the **source of truth for Supabase schema/
   migrations** and the bot consumes it (so I coordinate, not duplicate, schema changes).
6. **Roadmap priority.** After Phase 0–1, which comes first: **Campaign Manager** (GM value) or
   **Homebrew 2.0 + Marketplace** (community value)? The brief wants both; sequence is yours.
7. **Public API host.** When we get there: public API as **Vercel `/api/v1`** (simplest) or on the
   **Railway worker** under `api.pathwaypf2e.com`?
8. **Bot repo access.** The bot lives at `../Pathway/` (not in this repo/scope). For sync contracts
   I'll design against the shared DB; confirm I should **not** assume direct edits to the bot repo.

---

## 31. Next step

On approval of §30 (especially #1–#3), I'll begin **Phase 0** in small, reviewable PRs:
1. introduce `src/modules/*` + `withAuth/withValidation/withRateLimit` and migrate 2–3 Route
   Handlers as the pattern, 2. consolidate the calculator with golden tests, 3. add CI (type-check/
   lint/test). Each step ships independently and changes no user-facing behavior.
