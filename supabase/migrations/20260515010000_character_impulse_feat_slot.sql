ALTER TABLE public.character_feats
  DROP CONSTRAINT IF EXISTS ck_character_feats_slot;

ALTER TABLE public.character_feats
  ADD CONSTRAINT ck_character_feats_slot CHECK (
    feat_slot IN (
      'ancestry',
      'class',
      'general',
      'skill',
      'archetype',
      'free_archetype',
      'impulse',
      'bonus'
    )
  );
