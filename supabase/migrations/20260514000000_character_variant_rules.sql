-- ============================================================
-- Variant rules on characters
--
-- Stores per-character toggles for PF2e variant rules (Free
-- Archetype, Ancestry Paragon, Automatic Bonus Progression, etc.)
-- plus Remaster-related flags. Kept as a jsonb blob so the builder
-- can grow new toggles without a schema change for each one.
--
-- Default '{}' means "no variants" — equivalent to RAW play.
-- ============================================================

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS variant_rules JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN characters.variant_rules IS
  'PF2e variant-rule toggles set at character creation. Shape mirrors '
  'BuilderState.variantRules — see frontend/src/components/characters/builder-v2/types.ts.';
