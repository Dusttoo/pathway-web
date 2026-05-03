-- ── monster_attacks table ────────────────────────────────────────────────────
-- Stores per-guild saved monster attack libraries (previously monster_attacks.json
-- on the Railway volume, which was lost on every redeploy).

CREATE TABLE IF NOT EXISTS public.monster_attacks (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  discord_guild_id text        NOT NULL,
  attacks          jsonb       NOT NULL DEFAULT '{}',
  created_at       timestamptz DEFAULT now() NOT NULL,
  updated_at       timestamptz DEFAULT now() NOT NULL,

  CONSTRAINT monster_attacks_guild_unique UNIQUE (discord_guild_id)
);

-- Auto-update updated_at on row change
CREATE TRIGGER monster_attacks_updated_at
  BEFORE UPDATE ON public.monster_attacks
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── guild_state: add settings column ─────────────────────────────────────────
-- Stores bot-settings.json (campaignSetting, etc.) per guild so it survives
-- redeploys alongside calendar and weather state.

ALTER TABLE public.guild_state
  ADD COLUMN IF NOT EXISTS settings jsonb;
