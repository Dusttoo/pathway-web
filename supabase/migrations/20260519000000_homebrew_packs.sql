-- Homebrew packs group spell and item homebrew entries for sharing, drafting,
-- and future campaign/server enablement.

CREATE TABLE IF NOT EXISTS public.homebrew_packs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL,
  description     TEXT,
  cover_image_url TEXT,
  visibility      TEXT        NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'shared', 'public')),
  status          TEXT        NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published')),
  content_types   TEXT[]      NOT NULL DEFAULT ARRAY['spell','item']::TEXT[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.homebrew_pack_entries (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id           UUID        NOT NULL REFERENCES public.homebrew_packs(id) ON DELETE CASCADE,
  homebrew_entry_id UUID        NOT NULL REFERENCES public.homebrew_entries(id) ON DELETE CASCADE,
  sort_order        INTEGER     NOT NULL DEFAULT 0,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pack_id, homebrew_entry_id)
);

CREATE INDEX IF NOT EXISTS idx_homebrew_packs_owner
  ON public.homebrew_packs(owner_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_homebrew_packs_visibility
  ON public.homebrew_packs(visibility, status);

CREATE INDEX IF NOT EXISTS idx_homebrew_pack_entries_pack
  ON public.homebrew_pack_entries(pack_id, sort_order);

CREATE TRIGGER homebrew_packs_updated_at
  BEFORE UPDATE ON public.homebrew_packs
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE public.homebrew_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homebrew_pack_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read visible or owned homebrew packs"
  ON public.homebrew_packs FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid() OR visibility IN ('shared', 'public'));

CREATE POLICY "Users can create their own homebrew packs"
  ON public.homebrew_packs FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own homebrew packs"
  ON public.homebrew_packs FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own homebrew packs"
  ON public.homebrew_packs FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can read entries from visible or owned packs"
  ON public.homebrew_pack_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.homebrew_packs pack
      WHERE pack.id = pack_id
        AND (pack.owner_id = auth.uid() OR pack.visibility IN ('shared', 'public'))
    )
  );

CREATE POLICY "Users can manage entries in their own packs"
  ON public.homebrew_pack_entries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.homebrew_packs pack
      WHERE pack.id = pack_id
        AND pack.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.homebrew_packs pack
      WHERE pack.id = pack_id
        AND pack.owner_id = auth.uid()
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.homebrew_packs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.homebrew_pack_entries;
