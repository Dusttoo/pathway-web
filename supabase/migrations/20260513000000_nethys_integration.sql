-- ============================================================
-- Nethys integration
--
-- Adds Archives of Nethys identity columns to existing reference
-- tables and introduces character <-> reference join tables so
-- builder/sheet UI can attach selected feats and spells to a
-- character independent of the Pathbuilder JSON blob.
-- ============================================================

-- ── aon_id / aon_url on existing reference tables ─────────────
-- aon_id is the stable Nethys _id, used as the upsert key by the
-- seed script. aon_url is the canonical "View on Nethys" link.

ALTER TABLE feats              ADD COLUMN IF NOT EXISTS aon_id TEXT, ADD COLUMN IF NOT EXISTS aon_url TEXT;
ALTER TABLE spells             ADD COLUMN IF NOT EXISTS aon_id TEXT, ADD COLUMN IF NOT EXISTS aon_url TEXT;
ALTER TABLE items              ADD COLUMN IF NOT EXISTS aon_id TEXT, ADD COLUMN IF NOT EXISTS aon_url TEXT;
ALTER TABLE ancestries         ADD COLUMN IF NOT EXISTS aon_id TEXT, ADD COLUMN IF NOT EXISTS aon_url TEXT;
ALTER TABLE heritages          ADD COLUMN IF NOT EXISTS aon_id TEXT, ADD COLUMN IF NOT EXISTS aon_url TEXT;
ALTER TABLE backgrounds        ADD COLUMN IF NOT EXISTS aon_id TEXT, ADD COLUMN IF NOT EXISTS aon_url TEXT;
ALTER TABLE character_classes  ADD COLUMN IF NOT EXISTS aon_id TEXT, ADD COLUMN IF NOT EXISTS aon_url TEXT;
ALTER TABLE archetypes         ADD COLUMN IF NOT EXISTS aon_id TEXT, ADD COLUMN IF NOT EXISTS aon_url TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_feats_aon_id             ON feats(aon_id)             WHERE aon_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_spells_aon_id            ON spells(aon_id)            WHERE aon_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_items_aon_id             ON items(aon_id)             WHERE aon_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_ancestries_aon_id        ON ancestries(aon_id)        WHERE aon_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_heritages_aon_id         ON heritages(aon_id)         WHERE aon_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_backgrounds_aon_id       ON backgrounds(aon_id)       WHERE aon_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_character_classes_aon_id ON character_classes(aon_id) WHERE aon_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_archetypes_aon_id        ON archetypes(aon_id)        WHERE aon_id IS NOT NULL;

-- ── actions (basic / exploration / downtime) ──────────────────
-- Previously only lived as untyped rows inside the gamedata jsonb
-- bucket. Promote to a real reference table so feats can link to
-- the actions they grant via feat_metadata.action_ids.

CREATE TABLE IF NOT EXISTS actions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aon_id              TEXT UNIQUE,
  aon_url             TEXT,
  name                TEXT NOT NULL,
  action_category     TEXT,
  -- 'basic' | 'exploration' | 'downtime' | 'specialty_basic'
  action_cost         TEXT,
  -- "[one-action]", "[two-actions]", "[three-actions]", "[free-action]", "[reaction]"
  traits              JSONB NOT NULL DEFAULT '[]',
  trigger             TEXT,
  requirements        TEXT,
  frequency           TEXT,
  description         TEXT NOT NULL DEFAULT '',
  rarity              TEXT NOT NULL DEFAULT 'Common',
  source              TEXT,
  is_official         BOOLEAN NOT NULL DEFAULT true,
  action_metadata     JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_actions_name             ON actions(name);
CREATE INDEX IF NOT EXISTS idx_actions_action_category  ON actions(action_category);

CREATE TRIGGER actions_updated_at
  BEFORE UPDATE ON actions
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "actions are public reference data"
  ON actions FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "service role manages actions"
  ON actions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── conditions ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conditions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aon_id              TEXT UNIQUE,
  aon_url             TEXT,
  name                TEXT NOT NULL UNIQUE,
  description         TEXT NOT NULL DEFAULT '',
  has_value           BOOLEAN NOT NULL DEFAULT false,
  source              TEXT,
  is_official         BOOLEAN NOT NULL DEFAULT true,
  condition_metadata  JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conditions_name ON conditions(name);

CREATE TRIGGER conditions_updated_at
  BEFORE UPDATE ON conditions
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conditions are public reference data"
  ON conditions FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "service role manages conditions"
  ON conditions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── class_features ────────────────────────────────────────────
-- Promoted from character_classes.class_features jsonb so feats
-- and character selections can FK to a stable id.

CREATE TABLE IF NOT EXISTS class_features (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aon_id                   TEXT UNIQUE,
  aon_url                  TEXT,
  character_class_id       UUID REFERENCES character_classes(id) ON DELETE CASCADE,
  archetype_id             UUID REFERENCES archetypes(id) ON DELETE CASCADE,
  name                     TEXT NOT NULL,
  level                    INTEGER NOT NULL DEFAULT 1,
  description              TEXT NOT NULL DEFAULT '',
  traits                   JSONB NOT NULL DEFAULT '[]',
  is_choice                BOOLEAN NOT NULL DEFAULT false,
  -- true when this feature requires the player to pick something
  -- (Methodology, Doctrine, Weapon Group, etc.) - selection stored
  -- per-character in character_class_features.selection
  rarity                   TEXT NOT NULL DEFAULT 'Common',
  source                   TEXT,
  is_official              BOOLEAN NOT NULL DEFAULT true,
  class_feature_metadata   JSONB NOT NULL DEFAULT '{}',
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ck_class_features_owner CHECK (
    character_class_id IS NOT NULL OR archetype_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_class_features_class      ON class_features(character_class_id);
CREATE INDEX IF NOT EXISTS idx_class_features_archetype  ON class_features(archetype_id);
CREATE INDEX IF NOT EXISTS idx_class_features_level      ON class_features(level);

CREATE TRIGGER class_features_updated_at
  BEFORE UPDATE ON class_features
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE class_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "class_features are public reference data"
  ON class_features FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "service role manages class_features"
  ON class_features FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- Character ↔ reference join tables
-- ============================================================

-- ── character_feats ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS character_feats (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id        UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  feat_id             UUID NOT NULL REFERENCES feats(id) ON DELETE RESTRICT,
  feat_slot           TEXT NOT NULL,
  -- 'ancestry' | 'class' | 'general' | 'skill' | 'archetype' | 'free_archetype' | 'bonus'
  level_acquired      INTEGER NOT NULL DEFAULT 1,
  selection           JSONB NOT NULL DEFAULT '{}',
  -- for feats with sub-choices (e.g. Domain Initiate's domain, Adopted Ancestry's ancestry)
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_character_feats_slot UNIQUE (character_id, feat_id, level_acquired),
  CONSTRAINT ck_character_feats_slot CHECK (
    feat_slot IN ('ancestry','class','general','skill','archetype','free_archetype','bonus')
  ),
  CONSTRAINT ck_character_feats_level CHECK (level_acquired BETWEEN 1 AND 20)
);

CREATE INDEX IF NOT EXISTS idx_character_feats_character ON character_feats(character_id);
CREATE INDEX IF NOT EXISTS idx_character_feats_feat      ON character_feats(feat_id);

CREATE TRIGGER character_feats_updated_at
  BEFORE UPDATE ON character_feats
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE character_feats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see their own character_feats"
  ON character_feats FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM characters c
      WHERE c.id = character_feats.character_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "users manage their own character_feats"
  ON character_feats FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM characters c
      WHERE c.id = character_feats.character_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM characters c
      WHERE c.id = character_feats.character_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "service role manages character_feats"
  ON character_feats FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── character_known_spells ────────────────────────────────────
-- Spells the character knows / has in their spellbook / has access
-- to as innate. Daily prepared slots live in character_prepared_spells.

CREATE TABLE IF NOT EXISTS character_known_spells (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id        UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  spell_id            UUID NOT NULL REFERENCES spells(id) ON DELETE RESTRICT,
  tradition           TEXT NOT NULL,
  -- 'arcane' | 'divine' | 'occult' | 'primal'
  rank                INTEGER NOT NULL DEFAULT 1,
  -- heightened rank the spell is known at (cantrips/focus = char_level/2 rounded up)
  spell_source        TEXT NOT NULL DEFAULT 'spellbook',
  -- 'spellbook' | 'repertoire' | 'innate' | 'focus' | 'staff' | 'scroll'
  is_signature        BOOLEAN NOT NULL DEFAULT false,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_character_known_spells UNIQUE (character_id, spell_id, tradition, spell_source),
  CONSTRAINT ck_known_spells_tradition CHECK (tradition IN ('arcane','divine','occult','primal')),
  CONSTRAINT ck_known_spells_source CHECK (
    spell_source IN ('spellbook','repertoire','innate','focus','staff','scroll')
  ),
  CONSTRAINT ck_known_spells_rank CHECK (rank BETWEEN 0 AND 10)
);

CREATE INDEX IF NOT EXISTS idx_known_spells_character ON character_known_spells(character_id);
CREATE INDEX IF NOT EXISTS idx_known_spells_spell     ON character_known_spells(spell_id);

CREATE TRIGGER character_known_spells_updated_at
  BEFORE UPDATE ON character_known_spells
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE character_known_spells ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see their own known_spells"
  ON character_known_spells FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM characters c
      WHERE c.id = character_known_spells.character_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "users manage their own known_spells"
  ON character_known_spells FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM characters c
      WHERE c.id = character_known_spells.character_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM characters c
      WHERE c.id = character_known_spells.character_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "service role manages known_spells"
  ON character_known_spells FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── character_prepared_spells ─────────────────────────────────
-- One row per slot per rank. Daily-prep flow replaces all rows
-- for a given (character_id, rank) atomically.

CREATE TABLE IF NOT EXISTS character_prepared_spells (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id        UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  spell_id            UUID NOT NULL REFERENCES spells(id) ON DELETE RESTRICT,
  rank                INTEGER NOT NULL,
  slot_index          INTEGER NOT NULL,
  is_expended         BOOLEAN NOT NULL DEFAULT false,
  prepared_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_prepared_slot UNIQUE (character_id, rank, slot_index),
  CONSTRAINT ck_prepared_rank CHECK (rank BETWEEN 0 AND 10)
);

CREATE INDEX IF NOT EXISTS idx_prepared_spells_character ON character_prepared_spells(character_id);

ALTER TABLE character_prepared_spells ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see their own prepared_spells"
  ON character_prepared_spells FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM characters c
      WHERE c.id = character_prepared_spells.character_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "users manage their own prepared_spells"
  ON character_prepared_spells FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM characters c
      WHERE c.id = character_prepared_spells.character_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM characters c
      WHERE c.id = character_prepared_spells.character_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "service role manages prepared_spells"
  ON character_prepared_spells FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── character_class_features ──────────────────────────────────
-- Records the per-character resolution of a class feature, including
-- any choice the player made (Methodology, Weapon Group, etc.).

CREATE TABLE IF NOT EXISTS character_class_features (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id        UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  class_feature_id    UUID NOT NULL REFERENCES class_features(id) ON DELETE RESTRICT,
  level_acquired      INTEGER NOT NULL,
  selection           JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_character_class_features UNIQUE (character_id, class_feature_id),
  CONSTRAINT ck_character_class_features_level CHECK (level_acquired BETWEEN 1 AND 20)
);

CREATE INDEX IF NOT EXISTS idx_character_class_features_char ON character_class_features(character_id);

CREATE TRIGGER character_class_features_updated_at
  BEFORE UPDATE ON character_class_features
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE character_class_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see their own class_features"
  ON character_class_features FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM characters c
      WHERE c.id = character_class_features.character_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "users manage their own class_features"
  ON character_class_features FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM characters c
      WHERE c.id = character_class_features.character_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM characters c
      WHERE c.id = character_class_features.character_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "service role manages class_features rows"
  ON character_class_features FOR ALL TO service_role USING (true) WITH CHECK (true);
