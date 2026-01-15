-- SQL skript pro vytvoření unique constraint na slugifikovaný nickname
-- Tento skript zajistí, že nemohou existovat dva uživatelé se stejným slugem
-- (např. "Šmejd" a "smejd" nebo "SMEJD" budou považovány za stejné)
-- Spusť tento SQL v Supabase SQL Editor

-- 1. Vytvořit funkci pro slugifikaci (odstranění diakritiky a převod na malá písmena)
-- Používáme manuální odstranění diakritiky pomocí translate(), protože unaccent() nemusí být dostupné
CREATE OR REPLACE FUNCTION public.slugify_nickname(nickname text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN lower(
    translate(
      regexp_replace(
        regexp_replace(nickname, '[^a-zA-Z0-9_-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      -- Odstranění diakritiky: české znaky
      'áàâäãåāăąÁÀÂÄÃÅĀĂĄéèêëēĕėęěÉÈÊËĒĔĖĘĚíìîïĩīĭįıÍÌÎÏĨĪĬĮİóòôöõōŏőÓÒÔÖÕŌŎŐúùûüũūŭůÚÙÛÜŨŪŬŮýỳŷÿỹÝỲŶŸỹñÑçÇřŘťŤďĎňŇ',
      'aaaaaaaaaAAAAAAAAAeeeeeeeeeEEEEEEEEEiiiiiiiiiIIIIIIIIIoooooooOOOOOOOuuuuuuuUUUUUUUyyyyyyYYYYYYnNcCrRtTdDnN'
    )
  );
END;
$$;

-- 2. Vytvořit computed column pro slugifikovaný nickname (pokud PostgreSQL podporuje)
-- Poznámka: Supabase může mít omezení, takže použijeme trigger místo computed column

-- 3. Vytvořit funkci pro kontrolu unikátnosti podle slugifikovaného nicknamu
CREATE OR REPLACE FUNCTION public.check_nickname_unique()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  new_slug text;
  existing_count integer;
BEGIN
  -- Slugifikovat nový nickname
  new_slug := public.slugify_nickname(NEW.nickname);
  
  -- Zkontrolovat, zda už existuje nickname se stejným slugem
  SELECT COUNT(*) INTO existing_count
  FROM public.users
  WHERE public.slugify_nickname(nickname) = new_slug
    AND id != NEW.id
    AND deleted_at IS NULL;
  
  -- Pokud už existuje, vyhodit chybu
  IF existing_count > 0 THEN
    RAISE EXCEPTION 'Nickname "%" je již obsazena (včetně variant s diakritikou a velkými písmeny). Zkuste jinou přezdívku.', NEW.nickname;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Vytvořit trigger, který kontroluje unikátnost před INSERT a UPDATE
DROP TRIGGER IF EXISTS check_nickname_unique_trigger ON public.users;
CREATE TRIGGER check_nickname_unique_trigger
  BEFORE INSERT OR UPDATE OF nickname ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_nickname_unique();

-- 5. Vytvořit index pro rychlejší vyhledávání podle slugifikovaného nicknamu
-- Používáme jednoduchý B-tree index, protože gin_trgm_ops vyžaduje rozšíření pg_trgm
CREATE INDEX IF NOT EXISTS idx_users_nickname_slug 
ON public.users (public.slugify_nickname(nickname));

-- Poznámka: Pro lepší výkon s full-text vyhledáváním můžete použít GIN index s pg_trgm:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_users_nickname_slug_gin 
-- ON public.users USING gin (public.slugify_nickname(nickname) gin_trgm_ops);
