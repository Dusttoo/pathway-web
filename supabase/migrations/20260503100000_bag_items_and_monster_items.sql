-- ── bag_items ─────────────────────────────────────────────────────────────────
-- Normalized replacement for bags.categories JSONB.
-- Both the Discord bot (via storage.js sync) and the web app write here so
-- bag contents are seamless across both surfaces.
--
-- Item reference hierarchy (at least one required via CHECK):
--   item_id      → official PF2e item in the `items` catalog
--   homebrew_id  → homebrew item in `homebrew_entries` (type = 'item')
--   custom_name  → free-text fallback for items not yet in either catalog
--
-- display_name is always populated (denormalized canonical display name).
-- This lets DELETE/PATCH find rows by name without joining, keeping mutations simple.

CREATE TABLE public.bag_items (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category      text        NOT NULL DEFAULT 'General',

  -- Relational item references
  item_id       uuid        REFERENCES public.items(id)            ON DELETE SET NULL,
  homebrew_id   uuid        REFERENCES public.homebrew_entries(id) ON DELETE SET NULL,
  custom_name   text,

  -- Denormalized display name for fast CRUD without joins
  display_name  text        NOT NULL,

  -- Instance data
  quantity      integer     NOT NULL DEFAULT 1 CHECK (quantity > 0),
  notes         text,
  sort_order    integer     NOT NULL DEFAULT 0,

  created_at    timestamptz DEFAULT now() NOT NULL,
  updated_at    timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT bag_items_source CHECK (
    item_id IS NOT NULL OR homebrew_id IS NOT NULL OR custom_name IS NOT NULL
  )
);

CREATE INDEX bag_items_user_category_idx ON public.bag_items (user_id, category);
CREATE INDEX bag_items_user_name_idx     ON public.bag_items (user_id, LOWER(display_name));

CREATE TRIGGER bag_items_updated_at
  BEFORE UPDATE ON public.bag_items
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable Realtime so the web client gets live updates when the bot writes
ALTER PUBLICATION supabase_realtime ADD TABLE public.bag_items;


-- ── monster_items ─────────────────────────────────────────────────────────────
-- Normalized replacement for homebrew_entries.data.rich.items string[].
-- Allows monsters to carry items with proper relational references.

CREATE TABLE public.monster_items (
  id               uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  monster_entry_id uuid    NOT NULL REFERENCES public.homebrew_entries(id) ON DELETE CASCADE,

  item_id          uuid    REFERENCES public.items(id)            ON DELETE SET NULL,
  homebrew_id      uuid    REFERENCES public.homebrew_entries(id) ON DELETE SET NULL,
  custom_name      text,

  display_name     text    NOT NULL,
  quantity         integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  sort_order       integer NOT NULL DEFAULT 0,

  CONSTRAINT monster_items_source CHECK (
    item_id IS NOT NULL OR homebrew_id IS NOT NULL OR custom_name IS NOT NULL
  )
);

CREATE INDEX monster_items_monster_idx ON public.monster_items (monster_entry_id);
