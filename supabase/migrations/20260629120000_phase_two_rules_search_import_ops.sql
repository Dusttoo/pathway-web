-- Phase 2: rules search and Archives of Nethys importer operations.
-- Adds durable import run tracking plus search-oriented indexes for the
-- unified library search surface.

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.import_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'nethys'
    CHECK (source IN ('nethys', 'gamedata', 'manual')),
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  categories TEXT[] NOT NULL DEFAULT '{}'::text[],
  requested_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  total_fetched INTEGER NOT NULL DEFAULT 0 CHECK (total_fetched >= 0),
  total_inserted INTEGER NOT NULL DEFAULT 0 CHECK (total_inserted >= 0),
  total_updated INTEGER NOT NULL DEFAULT 0 CHECK (total_updated >= 0),
  total_skipped INTEGER NOT NULL DEFAULT 0 CHECK (total_skipped >= 0),
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX import_runs_status_created_idx
  ON public.import_runs (status, created_at DESC);

CREATE INDEX import_runs_source_created_idx
  ON public.import_runs (source, created_at DESC);

DROP TRIGGER IF EXISTS import_runs_updated_at
  ON public.import_runs;

CREATE TRIGGER import_runs_updated_at
  BEFORE UPDATE ON public.import_runs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.import_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read import runs"
  ON public.import_runs;

CREATE POLICY "Admins can read import runs"
  ON public.import_runs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can create import runs"
  ON public.import_runs;

CREATE POLICY "Admins can create import runs"
  ON public.import_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.is_admin = true
    )
    AND (requested_by_user_id IS NULL OR requested_by_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Service role manages import runs"
  ON public.import_runs;

CREATE POLICY "Service role manages import runs"
  ON public.import_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.import_run_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_run_id UUID NOT NULL REFERENCES public.import_runs(id) ON DELETE CASCADE,
  level TEXT NOT NULL DEFAULT 'info'
    CHECK (level IN ('debug', 'info', 'warn', 'error')),
  category TEXT,
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX import_run_events_run_created_idx
  ON public.import_run_events (import_run_id, created_at DESC);

ALTER TABLE public.import_run_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read import run events"
  ON public.import_run_events;

CREATE POLICY "Admins can read import run events"
  ON public.import_run_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Service role manages import run events"
  ON public.import_run_events;

CREATE POLICY "Service role manages import run events"
  ON public.import_run_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS gamedata_name_trgm_idx
  ON public.gamedata USING gin (name extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS gamedata_category_name_idx
  ON public.gamedata (category, name);

CREATE INDEX IF NOT EXISTS spells_name_trgm_idx
  ON public.spells USING gin (name extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS feats_name_trgm_idx
  ON public.feats USING gin (name extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS items_name_trgm_idx
  ON public.items USING gin (name extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS monsters_name_trgm_idx
  ON public.monsters USING gin (name extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS ancestries_name_trgm_idx
  ON public.ancestries USING gin (name extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS backgrounds_name_trgm_idx
  ON public.backgrounds USING gin (name extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS character_classes_name_trgm_idx
  ON public.character_classes USING gin (name extensions.gin_trgm_ops);
