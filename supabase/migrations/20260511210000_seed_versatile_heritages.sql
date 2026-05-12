-- Seed official versatile heritages from Archives of Nethys so they can be
-- selected by the character builder regardless of ancestry.

DO $$
DECLARE
  parent_ancestry_id UUID;
  heritage RECORD;
BEGIN
  SELECT id INTO parent_ancestry_id
  FROM ancestries
  WHERE lower(name) = 'human'
  LIMIT 1;

  IF parent_ancestry_id IS NULL THEN
    SELECT id INTO parent_ancestry_id
    FROM ancestries
    ORDER BY name
    LIMIT 1;
  END IF;

  IF parent_ancestry_id IS NULL THEN
    RETURN;
  END IF;

  FOR heritage IN
    SELECT *
    FROM (
      VALUES
        ('Aiuvarin', 'Common', 69),
        ('Dromaar', 'Common', 70),
        ('Aphorite', 'Uncommon', 28),
        ('Ardande', 'Uncommon', 57),
        ('Changeling', 'Uncommon', 67),
        ('Dhampir', 'Uncommon', 85),
        ('Dragonblood', 'Uncommon', 86),
        ('Duskwalker', 'Uncommon', 87),
        ('Ganzi', 'Uncommon', 32),
        ('Hungerseed', 'Uncommon', 94),
        ('Ifrit', 'Uncommon', 33),
        ('Nephilim', 'Uncommon', 68),
        ('Oread', 'Uncommon', 34),
        ('Suli', 'Uncommon', 35),
        ('Sylph', 'Uncommon', 36),
        ('Talos', 'Uncommon', 58),
        ('Undine', 'Uncommon', 37),
        ('Beastkin', 'Rare', 29),
        ('Reflection', 'Rare', 97)
    ) AS v(name, rarity, aon_id)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM heritages
      WHERE lower(name) = lower(heritage.name)
        AND is_versatile = true
    ) THEN
      INSERT INTO heritages (
        ancestry_id,
        name,
        description,
        traits,
        benefits,
        is_versatile,
        is_official,
        source
      )
      VALUES (
        parent_ancestry_id,
        heritage.name,
        'Official ' || lower(heritage.rarity) || ' versatile heritage from Archives of Nethys.',
        jsonb_build_array('versatile', lower(heritage.name)),
        jsonb_build_object(
          'rarity', heritage.rarity,
          'aon_id', heritage.aon_id,
          'aon_url', 'https://2e.aonprd.com/Ancestries.aspx?ID=' || heritage.aon_id
        ),
        true,
        true,
        'Archives of Nethys'
      );
    END IF;
  END LOOP;
END $$;
