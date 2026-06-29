-- Phase 1: character depth primitives.
-- These tables make character builds level-aware, auditable, overrideable,
-- and versioned without changing the existing characters table contract.

CREATE TABLE public.character_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 20),
  choices JSONB NOT NULL DEFAULT '{}'::jsonb,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_character_levels_character_level UNIQUE (character_id, level)
);

CREATE INDEX character_levels_character_idx
  ON public.character_levels (character_id, level);

CREATE TRIGGER character_levels_updated_at
  BEFORE UPDATE ON public.character_levels
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.character_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own character levels"
  ON public.character_levels
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.characters c
      WHERE c.id = character_levels.character_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own character levels"
  ON public.character_levels
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.characters c
      WHERE c.id = character_levels.character_id
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.characters c
      WHERE c.id = character_levels.character_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role manages character levels"
  ON public.character_levels
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TABLE public.character_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  actor_kind TEXT NOT NULL DEFAULT 'user'
    CHECK (actor_kind IN ('user', 'gm', 'bot', 'admin', 'import')),
  action TEXT NOT NULL,
  field TEXT,
  before_value JSONB,
  after_value JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX character_audit_log_character_idx
  ON public.character_audit_log (character_id, created_at DESC);

CREATE INDEX character_audit_log_actor_idx
  ON public.character_audit_log (actor_user_id, created_at DESC);

ALTER TABLE public.character_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own character audit log"
  ON public.character_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.characters c
      WHERE c.id = character_audit_log.character_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add audit entries for their own characters"
  ON public.character_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.characters c
      WHERE c.id = character_audit_log.character_id
        AND c.user_id = auth.uid()
    )
    AND actor_user_id = auth.uid()
  );

CREATE POLICY "Service role manages character audit log"
  ON public.character_audit_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TABLE public.character_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  stat_key TEXT NOT NULL,
  value JSONB NOT NULL,
  reason TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_character_overrides_stat UNIQUE (character_id, stat_key),
  CONSTRAINT ck_character_overrides_stat_key_not_empty CHECK (btrim(stat_key) <> '')
);

CREATE INDEX character_overrides_character_idx
  ON public.character_overrides (character_id, enabled);

CREATE TRIGGER character_overrides_updated_at
  BEFORE UPDATE ON public.character_overrides
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.character_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own character overrides"
  ON public.character_overrides
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.characters c
      WHERE c.id = character_overrides.character_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own character overrides"
  ON public.character_overrides
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.characters c
      WHERE c.id = character_overrides.character_id
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.characters c
      WHERE c.id = character_overrides.character_id
        AND c.user_id = auth.uid()
    )
    AND (created_by_user_id IS NULL OR created_by_user_id = auth.uid())
  );

CREATE POLICY "Service role manages character overrides"
  ON public.character_overrides
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TABLE public.character_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  label TEXT,
  snapshot JSONB NOT NULL,
  created_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_character_versions_number UNIQUE (character_id, version_number)
);

CREATE INDEX character_versions_character_idx
  ON public.character_versions (character_id, version_number DESC);

ALTER TABLE public.character_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own character versions"
  ON public.character_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.characters c
      WHERE c.id = character_versions.character_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create versions for their own characters"
  ON public.character_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.characters c
      WHERE c.id = character_versions.character_id
        AND c.user_id = auth.uid()
    )
    AND (created_by_user_id IS NULL OR created_by_user_id = auth.uid())
  );

CREATE POLICY "Service role manages character versions"
  ON public.character_versions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
