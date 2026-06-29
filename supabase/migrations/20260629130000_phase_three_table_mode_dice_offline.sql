-- Phase 3: Table Mode + dice sync + offline-read support.
-- The website can log dice rolls and sync events without becoming the source
-- of truth for combat initiative. The bot can consume/write the same tables
-- later through service-role policies.

CREATE TABLE IF NOT EXISTS public.dice_rolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'web'
    CHECK (source IN ('web', 'bot', 'api')),
  label TEXT,
  expression TEXT NOT NULL,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  total INTEGER,
  visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'party', 'public', 'gm')),
  discord_guild_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX dice_rolls_character_created_idx
  ON public.dice_rolls (character_id, created_at DESC);

CREATE INDEX dice_rolls_user_created_idx
  ON public.dice_rolls (user_id, created_at DESC);

ALTER TABLE public.dice_rolls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own dice rolls"
  ON public.dice_rolls;

CREATE POLICY "Users can read their own dice rolls"
  ON public.dice_rolls
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own dice rolls"
  ON public.dice_rolls;

CREATE POLICY "Users can create their own dice rolls"
  ON public.dice_rolls
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role manages dice rolls"
  ON public.dice_rolls;

CREATE POLICY "Service role manages dice rolls"
  ON public.dice_rolls
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  direction TEXT NOT NULL
    CHECK (direction IN ('web_to_bot', 'bot_to_web', 'system')),
  status TEXT NOT NULL DEFAULT 'recorded'
    CHECK (status IN ('recorded', 'synced', 'conflict', 'failed')),
  actor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  discord_guild_id TEXT,
  before_value JSONB,
  after_value JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX sync_log_entity_created_idx
  ON public.sync_log (entity_type, entity_id, created_at DESC);

CREATE INDEX sync_log_status_created_idx
  ON public.sync_log (status, created_at DESC);

ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read sync log"
  ON public.sync_log;

CREATE POLICY "Admins can read sync log"
  ON public.sync_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Service role manages sync log"
  ON public.sync_log;

CREATE POLICY "Service role manages sync log"
  ON public.sync_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
