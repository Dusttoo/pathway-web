CREATE TABLE IF NOT EXISTS public.user_guild_active_characters (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  discord_guild_id text NOT NULL,
  active_char_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, discord_guild_id)
);

CREATE INDEX IF NOT EXISTS user_guild_active_characters_guild_idx
  ON public.user_guild_active_characters (discord_guild_id);

DROP TRIGGER IF EXISTS user_guild_active_characters_updated_at
  ON public.user_guild_active_characters;

CREATE TRIGGER user_guild_active_characters_updated_at
  BEFORE UPDATE ON public.user_guild_active_characters
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE public.user_guild_active_characters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own server active characters"
  ON public.user_guild_active_characters;

CREATE POLICY "Users can read own server active characters"
  ON public.user_guild_active_characters
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own server active characters"
  ON public.user_guild_active_characters;

CREATE POLICY "Users can manage own server active characters"
  ON public.user_guild_active_characters
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages server active characters"
  ON public.user_guild_active_characters;

CREATE POLICY "Service role manages server active characters"
  ON public.user_guild_active_characters
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
