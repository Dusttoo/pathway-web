-- Pathway Web App — v1 Schema
-- Tables: users, guild_settings, ancestries, heritages, character_classes,
--         backgrounds, feats, spells, archetypes, monsters, items, skills, characters

-- ============================================================
-- Utility: auto-update updated_at on row changes
-- ============================================================

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- users
-- ============================================================

CREATE TABLE users (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id           TEXT NOT NULL UNIQUE,
  discord_username     TEXT NOT NULL,
  discord_discriminator TEXT,
  discord_avatar       TEXT,
  email                TEXT,
  is_admin             BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- guild_settings
-- One row per Discord server. Created on first bot interaction.
-- ============================================================

CREATE TABLE guild_settings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_guild_id    TEXT NOT NULL UNIQUE,
  guild_name          TEXT,
  guild_icon_url      TEXT,
  bot_enabled         BOOLEAN NOT NULL DEFAULT true,
  command_prefix      TEXT,
  features_enabled    JSONB NOT NULL DEFAULT '{}',
  -- e.g. {"initiative": true, "downtime": false}
  channel_config      JSONB NOT NULL DEFAULT '{}',
  -- e.g. {"combat": "123456789", "general": "987654321"}
  homebrew_enabled    BOOLEAN NOT NULL DEFAULT true,
  allowed_rulebooks   TEXT[] NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ck_guild_settings_guild_id_not_empty CHECK (discord_guild_id <> '')
);

CREATE TRIGGER guild_settings_updated_at
  BEFORE UPDATE ON guild_settings
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- ancestries
-- ============================================================

CREATE TABLE ancestries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  description         TEXT,
  ancestry_hp         INTEGER NOT NULL DEFAULT 8,
  size                TEXT NOT NULL DEFAULT 'Medium',
  speed               INTEGER NOT NULL DEFAULT 25,
  attribute_boosts    JSONB NOT NULL DEFAULT '[]',
  attribute_flaws     JSONB NOT NULL DEFAULT '[]',
  languages           JSONB NOT NULL DEFAULT '[]',
  bonus_languages     INTEGER NOT NULL DEFAULT 0,
  traits              JSONB NOT NULL DEFAULT '[]',
  senses              JSONB NOT NULL DEFAULT '{}',
  special_abilities   JSONB NOT NULL DEFAULT '[]',
  rarity              TEXT NOT NULL DEFAULT 'Common',
  source              TEXT,
  is_official         BOOLEAN NOT NULL DEFAULT true,
  discord_guild_id    TEXT,
  created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ancestries_name ON ancestries(name);
CREATE INDEX idx_ancestries_is_official ON ancestries(is_official);
CREATE INDEX idx_ancestries_guild ON ancestries(discord_guild_id);

CREATE TRIGGER ancestries_updated_at
  BEFORE UPDATE ON ancestries
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- heritages
-- ============================================================

CREATE TABLE heritages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ancestry_id         UUID NOT NULL REFERENCES ancestries(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  description         TEXT,
  traits              JSONB NOT NULL DEFAULT '[]',
  benefits            JSONB NOT NULL DEFAULT '{}',
  is_versatile        BOOLEAN NOT NULL DEFAULT false,
  is_official         BOOLEAN NOT NULL DEFAULT true,
  source              TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_heritages_ancestry_id ON heritages(ancestry_id);
CREATE INDEX idx_heritages_name ON heritages(name);

-- ============================================================
-- character_classes
-- ============================================================

CREATE TABLE character_classes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL UNIQUE,
  description           TEXT,
  class_hp              INTEGER NOT NULL DEFAULT 8,
  key_attribute         JSONB NOT NULL DEFAULT '[]',
  -- e.g. ["strength", "dexterity"] — player picks one
  initial_proficiencies JSONB NOT NULL DEFAULT '{}',
  -- e.g. {"perception": "trained", "fortitude": "expert"}
  class_features        JSONB NOT NULL DEFAULT '[]',
  is_spellcaster        BOOLEAN NOT NULL DEFAULT false,
  spellcasting_ability  TEXT,
  source                TEXT,
  is_official           BOOLEAN NOT NULL DEFAULT true,
  discord_guild_id      TEXT,
  created_by_user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  class_metadata        JSONB NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_character_classes_is_official ON character_classes(is_official);
CREATE INDEX idx_character_classes_guild ON character_classes(discord_guild_id);

CREATE TRIGGER character_classes_updated_at
  BEFORE UPDATE ON character_classes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- backgrounds
-- ============================================================

CREATE TABLE backgrounds (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL UNIQUE,
  description         TEXT,
  attribute_boosts    JSONB NOT NULL DEFAULT '[]',
  skill_proficiencies JSONB NOT NULL DEFAULT '[]',
  lore_skills         JSONB NOT NULL DEFAULT '[]',
  rarity              TEXT NOT NULL DEFAULT 'Common',
  source              TEXT,
  is_official         BOOLEAN NOT NULL DEFAULT true,
  discord_guild_id    TEXT,
  created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  background_metadata JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_backgrounds_name ON backgrounds(name);
CREATE INDEX idx_backgrounds_is_official ON backgrounds(is_official);

CREATE TRIGGER backgrounds_updated_at
  BEFORE UPDATE ON backgrounds
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- feats
-- ============================================================

CREATE TABLE feats (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  description         TEXT NOT NULL DEFAULT '',
  feat_type           TEXT,
  -- 'ancestry' | 'class_feat' | 'general' | 'skill' | 'archetype' | 'bonus'
  level               INTEGER NOT NULL DEFAULT 1,
  traits              JSONB NOT NULL DEFAULT '[]',
  prerequisites       TEXT,
  action_cost         TEXT,
  trigger             TEXT,
  rarity              TEXT NOT NULL DEFAULT 'Common',
  source              TEXT,
  is_official         BOOLEAN NOT NULL DEFAULT true,
  discord_guild_id    TEXT,
  created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  feat_metadata       JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feats_name ON feats(name);
CREATE INDEX idx_feats_level ON feats(level);
CREATE INDEX idx_feats_feat_type ON feats(feat_type);
CREATE INDEX idx_feats_is_official ON feats(is_official);

CREATE TRIGGER feats_updated_at
  BEFORE UPDATE ON feats
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- spells
-- ============================================================

CREATE TABLE spells (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  level               INTEGER NOT NULL,
  traditions          JSONB NOT NULL DEFAULT '[]',
  -- ["arcane", "occult"]
  traits              JSONB NOT NULL DEFAULT '[]',
  cast_actions        TEXT,
  -- "[two-actions]", "reaction", "1 minute"
  defense             TEXT,
  -- "basic Reflex", "Will", "AC"
  area                TEXT,
  -- "10-foot burst"
  range_text          TEXT NOT NULL DEFAULT '',
  duration            TEXT NOT NULL DEFAULT '',
  description         TEXT NOT NULL DEFAULT '',
  is_focus_spell      BOOLEAN NOT NULL DEFAULT false,
  is_ritual           BOOLEAN NOT NULL DEFAULT false,
  heightening         JSONB,
  classes             JSONB NOT NULL DEFAULT '[]',
  rarity              TEXT NOT NULL DEFAULT 'Common',
  source              TEXT NOT NULL DEFAULT '',
  is_official         BOOLEAN NOT NULL DEFAULT true,
  discord_guild_id    TEXT,
  created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  spell_metadata      JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_spells_name ON spells(name);
CREATE INDEX idx_spells_level ON spells(level);
CREATE INDEX idx_spells_is_focus ON spells(is_focus_spell);
CREATE INDEX idx_spells_is_official ON spells(is_official);

CREATE TRIGGER spells_updated_at
  BEFORE UPDATE ON spells
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- archetypes
-- ============================================================

CREATE TABLE archetypes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  description         TEXT,
  archetype_type      TEXT NOT NULL DEFAULT 'multiclass',
  -- 'multiclass' | 'class_archetype' | 'other'
  traits              JSONB NOT NULL DEFAULT '[]',
  rarity              TEXT NOT NULL DEFAULT 'Common',
  source              TEXT,
  is_official         BOOLEAN NOT NULL DEFAULT true,
  discord_guild_id    TEXT,
  created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_archetypes_name ON archetypes(name);
CREATE INDEX idx_archetypes_is_official ON archetypes(is_official);

CREATE TRIGGER archetypes_updated_at
  BEFORE UPDATE ON archetypes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- monsters
-- ============================================================

CREATE TABLE monsters (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  level               INTEGER NOT NULL DEFAULT 0,
  size                TEXT NOT NULL DEFAULT 'Medium',
  creature_type       TEXT NOT NULL DEFAULT 'Humanoid',
  alignment           TEXT NOT NULL DEFAULT 'Unaligned',
  traits              JSONB NOT NULL DEFAULT '[]',
  rarity              TEXT NOT NULL DEFAULT 'Common',
  hp                  INTEGER NOT NULL DEFAULT 1,
  ac                  INTEGER NOT NULL DEFAULT 10,
  perception          INTEGER NOT NULL DEFAULT 0,
  saving_throws       JSONB NOT NULL DEFAULT '{}',
  -- {"fort": 10, "ref": 8, "will": 12}
  speed               JSONB NOT NULL DEFAULT '{}',
  -- {"walk": 25, "fly": 40}
  ability_modifiers   JSONB NOT NULL DEFAULT '{}',
  -- {"str": 2, "dex": 4, "con": 0, "int": -1, "wis": 2, "cha": 1}
  languages           JSONB NOT NULL DEFAULT '[]',
  immunities          JSONB NOT NULL DEFAULT '[]',
  resistances         JSONB NOT NULL DEFAULT '[]',
  weaknesses          JSONB NOT NULL DEFAULT '[]',
  abilities           JSONB NOT NULL DEFAULT '[]',
  attacks             JSONB NOT NULL DEFAULT '[]',
  spellcasting        JSONB,
  is_companion        BOOLEAN NOT NULL DEFAULT false,
  companion_types     JSONB NOT NULL DEFAULT '[]',
  description         TEXT,
  source              TEXT,
  is_official         BOOLEAN NOT NULL DEFAULT true,
  discord_guild_id    TEXT,
  created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  monster_metadata    JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_monsters_name ON monsters(name);
CREATE INDEX idx_monsters_level ON monsters(level);
CREATE INDEX idx_monsters_creature_type ON monsters(creature_type);
CREATE INDEX idx_monsters_is_companion ON monsters(is_companion);
CREATE INDEX idx_monsters_is_official ON monsters(is_official);

CREATE TRIGGER monsters_updated_at
  BEFORE UPDATE ON monsters
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- items
-- ============================================================

CREATE TABLE items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  item_type           TEXT NOT NULL DEFAULT 'adventuring_gear',
  -- 'weapon' | 'armor' | 'shield' | 'adventuring_gear' | 'alchemical' |
  -- 'consumable' | 'held_item' | 'rune' | 'material' | 'treasure' | 'worn_item' | 'vehicle'
  item_subtype        TEXT,
  level               INTEGER NOT NULL DEFAULT 0,
  price_cp            INTEGER NOT NULL DEFAULT 0,
  bulk                TEXT,
  -- "L", "1", "2", "-" (light/bulk/—)
  traits              JSONB NOT NULL DEFAULT '[]',
  rarity              TEXT NOT NULL DEFAULT 'Common',
  description         TEXT NOT NULL DEFAULT '',
  is_magical          BOOLEAN NOT NULL DEFAULT false,
  usage               TEXT,
  source              TEXT,
  is_official         BOOLEAN NOT NULL DEFAULT true,
  discord_guild_id    TEXT,
  created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  item_metadata       JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_items_name ON items(name);
CREATE INDEX idx_items_item_type ON items(item_type);
CREATE INDEX idx_items_level ON items(level);
CREATE INDEX idx_items_is_official ON items(is_official);

CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- skills
-- ============================================================

CREATE TABLE skills (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  key         TEXT NOT NULL UNIQUE,
  -- matches PF2e skill slug: 'acrobatics', 'arcana', etc.
  ability     TEXT NOT NULL,
  -- 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'
  description TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- characters
-- Stores a character imported from Pathbuilder 2e.
-- Full sheet data lives in pathbuilder_data JSONB;
-- top-level columns are extracted for querying/display.
-- ============================================================

CREATE TABLE characters (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discord_guild_id    TEXT NOT NULL,
  name                TEXT NOT NULL,

  -- Extracted for display without parsing full JSON
  ancestry_name       TEXT,
  heritage_name       TEXT,
  class_name          TEXT,
  background_name     TEXT,
  level               INTEGER NOT NULL DEFAULT 1,
  experience          INTEGER NOT NULL DEFAULT 0,

  -- Pathbuilder import
  pathbuilder_id      INTEGER,
  -- Numeric Pathbuilder character ID for re-sync
  pathbuilder_data    JSONB,
  -- Full Pathbuilder export JSON

  -- PF2e status
  hero_points         INTEGER NOT NULL DEFAULT 1,
  dying               INTEGER NOT NULL DEFAULT 0,
  wounded             INTEGER NOT NULL DEFAULT 0,
  currency            JSONB NOT NULL DEFAULT '{"cp":0,"sp":0,"gp":0,"pp":0}',

  -- 'active' | 'retired' | 'dead'
  status              TEXT NOT NULL DEFAULT 'active',
  notes               TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ck_characters_guild_id_not_empty CHECK (discord_guild_id <> '')
);

CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_characters_guild ON characters(discord_guild_id);
CREATE INDEX idx_characters_status ON characters(status);

CREATE TRIGGER characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
