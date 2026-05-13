-- ============================================================
-- Nethys upsert constraints
--
-- The first Nethys migration used partial unique indexes:
--   UNIQUE (aon_id) WHERE aon_id IS NOT NULL
--
-- PostgreSQL UNIQUE indexes already allow multiple NULL values, and Supabase's
-- PostgREST upsert path needs a plain unique index/constraint it can infer from
-- onConflict=aon_id. Replace the partial indexes with plain unique indexes.
-- ============================================================

DROP INDEX IF EXISTS uq_feats_aon_id;
DROP INDEX IF EXISTS uq_spells_aon_id;
DROP INDEX IF EXISTS uq_items_aon_id;
DROP INDEX IF EXISTS uq_ancestries_aon_id;
DROP INDEX IF EXISTS uq_heritages_aon_id;
DROP INDEX IF EXISTS uq_backgrounds_aon_id;
DROP INDEX IF EXISTS uq_character_classes_aon_id;
DROP INDEX IF EXISTS uq_archetypes_aon_id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_feats_aon_id
  ON feats(aon_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_spells_aon_id
  ON spells(aon_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_items_aon_id
  ON items(aon_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ancestries_aon_id
  ON ancestries(aon_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_heritages_aon_id
  ON heritages(aon_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_backgrounds_aon_id
  ON backgrounds(aon_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_character_classes_aon_id
  ON character_classes(aon_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_archetypes_aon_id
  ON archetypes(aon_id);
