ALTER TABLE public.character_known_spells
  DROP CONSTRAINT IF EXISTS ck_known_spells_tradition;

ALTER TABLE public.character_known_spells
  ADD CONSTRAINT ck_known_spells_tradition CHECK (
    tradition IN ('arcane','divine','occult','primal','focus')
  );
