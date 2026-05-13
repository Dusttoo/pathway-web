-- ============================================================
-- Fix aon_id upsert targets.
--
-- The Nethys integration migration created partial unique indexes
-- on aon_id (WHERE aon_id IS NOT NULL). PostgreSQL won't use a
-- partial index for `ON CONFLICT (aon_id)` unless the upsert also
-- specifies the same predicate — and supabase-js's upsert does
-- not. Recreate them as full unique indexes; multiple NULLs are
-- still allowed by the default UNIQUE semantics, so homebrew rows
-- (aon_id IS NULL) keep coexisting.
--
-- Also drops the UNIQUE constraint on conditions.name. aon_id is
-- the natural key for Nethys-sourced conditions; AoN's index can
-- legitimately contain rows that collide on name (e.g. legacy /
-- versioned entries), and we don't want those to block the seed.
-- ============================================================

DROP INDEX IF EXISTS uq_feats_aon_id;
DROP INDEX IF EXISTS uq_spells_aon_id;
DROP INDEX IF EXISTS uq_items_aon_id;
DROP INDEX IF EXISTS uq_ancestries_aon_id;
DROP INDEX IF EXISTS uq_heritages_aon_id;
DROP INDEX IF EXISTS uq_backgrounds_aon_id;
DROP INDEX IF EXISTS uq_character_classes_aon_id;
DROP INDEX IF EXISTS uq_archetypes_aon_id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_feats_aon_id             ON feats(aon_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_spells_aon_id            ON spells(aon_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_items_aon_id             ON items(aon_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_ancestries_aon_id        ON ancestries(aon_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_heritages_aon_id         ON heritages(aon_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_backgrounds_aon_id       ON backgrounds(aon_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_character_classes_aon_id ON character_classes(aon_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_archetypes_aon_id        ON archetypes(aon_id);

ALTER TABLE conditions DROP CONSTRAINT IF EXISTS conditions_name_key;
