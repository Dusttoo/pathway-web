-- ── Generic gamedata table ────────────────────────────────────────────────────
--
-- Stores ALL PF2e reference content that doesn't have a dedicated typed table.
-- Keyed by (category, slug) — e.g. ('actions', 'rage'), ('traits', 'flourish').
--
-- Content types with dedicated tables (feats, spells, items, monsters) are NOT
-- stored here — they keep their own tables with proper column types.
--
-- This table is populated by Pathway/scripts/seed-gamedata-to-supabase.js and
-- restored into local gamedata/ files at bot startup via restoreAllFromSupabase().

CREATE TABLE IF NOT EXISTS gamedata (
  id          BIGSERIAL PRIMARY KEY,
  category    TEXT        NOT NULL,
  slug        TEXT        NOT NULL,
  name        TEXT,
  data        JSONB       NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT gamedata_category_slug_key UNIQUE (category, slug)
);

CREATE INDEX IF NOT EXISTS gamedata_category_idx ON gamedata (category);
CREATE INDEX IF NOT EXISTS gamedata_name_idx ON gamedata (name);

-- Automatically refresh updated_at on upsert
CREATE OR REPLACE FUNCTION touch_gamedata_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS gamedata_updated_at ON gamedata;
CREATE TRIGGER gamedata_updated_at
  BEFORE UPDATE ON gamedata
  FOR EACH ROW EXECUTE FUNCTION touch_gamedata_updated_at();

-- GRANTs: anon/authenticated need SELECT so PostgREST includes the table in its schema cache.
-- Service role bypasses RLS automatically and doesn't need an explicit grant.
GRANT SELECT ON TABLE public.gamedata TO anon, authenticated;

-- RLS: anyone can read (web client needs this for lookups); only service role writes
ALTER TABLE gamedata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read gamedata"
  ON gamedata FOR SELECT
  USING (true);
