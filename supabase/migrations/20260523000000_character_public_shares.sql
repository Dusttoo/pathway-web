ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS public_share_id UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_characters_public_share_id
  ON public.characters(public_share_id);

CREATE INDEX IF NOT EXISTS idx_characters_public_visible
  ON public.characters(public_share_id)
  WHERE is_public = true;

COMMENT ON COLUMN public.characters.public_share_id IS
  'Stable opaque ID used for read-only public character sheet links.';

COMMENT ON COLUMN public.characters.is_public IS
  'When true, the character can be viewed through the public share endpoint.';
