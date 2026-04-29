# Pathway — Feature Roadmap

Inspired by Avrae (avrae.io) but built for Pathfinder 2e. The goal is a full web companion
for the Pathway Discord bot: character sheets, homebrew content creation, custom aliases,
and a sharing/discovery ecosystem.

---

## Current State (as of April 2026)

**What works today:**
- Discord OAuth login
- Pathbuilder 2e character import (by ID or JSON paste)
- Character list + basic detail view
- Full official PF2e rules library (15k+ rows: spells, feats, ancestries, classes, backgrounds, monsters, items)
- Guild settings with `homebrew_enabled` flag
- All content tables already have `is_official` + `created_by_user_id` columns — homebrew rows can be stored, no UI yet

---

## Phase 1 — Character Sheet (quick win, high value)

The character detail page currently dumps raw Pathbuilder JSON. This phase renders it as a
proper PF2e character sheet.

### Web
- [ ] Full PF2e sheet layout on `/characters/[id]`
  - Ability scores + modifiers
  - Saves (Fort / Ref / Will)
  - AC, HP, Speed, Perception
  - Class DC, spell attack
  - Skills with proficiency ranks
  - Feats list (ancestry, class, general, skill)
  - Equipment / inventory
  - Spells prepared / known (with slots)
  - Special abilities / class features
- [ ] HP tracking — current HP editable, stored in `characters.hp_current` (add column)
- [ ] Condition tracking — add/remove conditions, stored in `characters.conditions` JSONB
- [ ] Hero point tracking — `characters.hero_points` column exists, wire up UI
- [ ] Active / inactive / retired status toggle

### No bot changes needed for this phase.

---

## Phase 2 — Homebrew Content Creation

Users can create homebrew spells, items, and creatures, organized into shareable collections
(Avrae calls these "Tomes" for spells and "Packs" for items).

### Database migrations needed
```sql
-- Collections (Tomes / Packs)
CREATE TABLE collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id),
  name text NOT NULL,
  description text,
  image_url text,
  collection_type text NOT NULL, -- 'spells' | 'items' | 'creatures'
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Join table: collection → content rows
CREATE TABLE collection_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid REFERENCES collections(id) ON DELETE CASCADE,
  content_type text NOT NULL, -- 'spell' | 'item' | 'monster'
  content_id uuid NOT NULL
);
```

### Web
- [ ] Homebrew spell editor → saved to `spells` table with `is_official = false`
- [ ] Tomes UI — create/edit spell collections with cover image + description
- [ ] Homebrew item editor → saved to `items` table with `is_official = false`
- [ ] Packs UI — create/edit item collections with cover image + description
- [ ] Homebrew creature editor → saved to `monsters` table with `is_official = false`
- [ ] `/homebrew` route with tabs: Spells (Tomes) / Items (Packs) / Creatures
- [ ] Collection detail page with entry list, EDIT and SHARE buttons

### No bot changes needed yet (homebrew exists in DB, bot can query it).

---

## Phase 3 — Alias Workshop

Custom bot commands (aliases), command modifiers (snippets), and persistent variables
(uvars / gvars). This is the power-user layer — equivalent to Avrae's Alias Workshop.

### Concepts
| Concept | Description |
|---|---|
| **Alias** | A custom bot command. Name + script body. e.g. `!bag` runs a coin-weight script |
| **Snippet** | A short argument modifier applied to standard commands |
| **Uvar** | Per-user variable the bot reads at runtime (e.g. `characterTheme = "dark"`) |
| **Gvar** | Global variable with a UUID — shareable across users, referenced in alias scripts |

### Database migrations needed
```sql
CREATE TABLE aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id),
  name text NOT NULL,
  code text NOT NULL,
  docs text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id),
  name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE uvars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  key text NOT NULL,
  value text NOT NULL,
  UNIQUE(user_id, key)
);

CREATE TABLE gvars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id),
  value text NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

### Web
- [ ] `/aliases` route — My Work tab (alias list), Snippets tab, Uvars tab
- [ ] Alias editor with code editor component (Monaco or CodeMirror)
- [ ] Snippet editor
- [ ] Uvar key/value editor
- [ ] Gvar editor with UUID display for referencing in scripts

### Bot changes required (⚠️ bot-side work)
The bot needs to query Supabase at runtime to resolve aliases/uvars when a user runs a command:
- Bot reads `aliases` table to check if `!<name>` matches a user's custom alias
- Bot reads `uvars` for the calling user before executing any alias script
- Bot reads `gvars` by UUID when an alias script calls `get_gvar(uuid)`
- Requires: Supabase service key in bot environment + a lookup module in the bot codebase

---

## Phase 4 — Sharing & Discovery

Users can share their aliases and homebrew collections publicly and subscribe to others'.

### Database migrations needed
```sql
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid REFERENCES users(id),
  content_type text NOT NULL, -- 'alias' | 'collection'
  content_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(subscriber_id, content_type, content_id)
);
```

### Web
- [ ] Public profile page `/u/[discordId]` — character art grid + public collections/aliases
- [ ] `/aliases/explore` — browse publicly shared aliases with search/filter
- [ ] Subscribe / unsubscribe button on public aliases and collections
- [ ] `/aliases/subscriptions` — list of things you've subscribed to
- [ ] Share link generation for collections and aliases
- [ ] Collection public detail page (viewable without login)

### Bot changes required
- Bot checks subscribed aliases in addition to owned aliases when resolving commands
- Subscribed collections appear in `!homebrew` lookups

---

## Reference: Avrae Features → Pathway Equivalents

| Avrae | Pathway equivalent | Status |
|---|---|---|
| Characters tab | `/characters` | ✅ exists (needs better sheet UI) |
| Character sheet view | `/characters/[id]` | 🔨 Phase 1 |
| Alias Workshop → My Work | `/aliases` | 📋 Phase 3 |
| Alias Workshop → Explore | `/aliases/explore` | 📋 Phase 4 |
| Alias Workshop → Subscriptions | `/aliases/subscriptions` | 📋 Phase 4 |
| Customization → My Customizations | Aliases/Snippets/Uvars tabs | 📋 Phase 3 |
| Customization → Global Variables | Gvars editor | 📋 Phase 3 |
| Homebrew → Spells (Tomes) | `/homebrew` Spells tab | 📋 Phase 2 |
| Homebrew → Items (Packs) | `/homebrew` Items tab | 📋 Phase 2 |
| Homebrew → Creatures | `/homebrew` Creatures tab | 📋 Phase 2 |
| Public profile + character grid | `/u/[discordId]` | 📋 Phase 4 |
| Subscriptions | `/aliases/subscriptions` | 📋 Phase 4 |
