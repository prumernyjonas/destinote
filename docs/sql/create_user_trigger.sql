-- Trigger pro automatické vytvoření záznamu v users tabulce při registraci
-- Tento trigger se spustí automaticky, když Supabase Auth vytvoří nového uživatele
-- Spusť tento SQL v Supabase SQL Editor

-- 1. Vytvořit funkci, která automaticky vytvoří záznam v users tabulce
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_nickname text;
  nickname_slug text;
  existing_count integer;
BEGIN
  -- Získat nickname z user_metadata
  user_nickname := (NEW.raw_user_meta_data->>'nickname');
  
  -- Pokud není nickname v metadata, použijeme část emailu jako fallback
  -- (ale to by nemělo nastat, protože registrace vyžaduje nickname)
  IF user_nickname IS NULL OR user_nickname = '' THEN
    user_nickname := split_part(NEW.email, '@', 1);
  END IF;
  
  -- Kontrola unikátnosti podle slugifikovaného nicknamu
  -- Použijeme funkci slugify_nickname, pokud existuje
  BEGIN
    nickname_slug := public.slugify_nickname(user_nickname);
    
    -- Zkontrolovat, zda už existuje nickname se stejným slugem
    SELECT COUNT(*) INTO existing_count
    FROM public.users
    WHERE public.slugify_nickname(nickname) = nickname_slug
      AND id != NEW.id
      AND deleted_at IS NULL;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback: pokud funkce neexistuje, použijeme jednoduchou verzi
    nickname_slug := lower(regexp_replace(user_nickname, '[^a-z0-9_-]', '', 'g'));
    
    SELECT COUNT(*) INTO existing_count
    FROM public.users
    WHERE lower(regexp_replace(nickname, '[^a-z0-9_-]', '', 'g')) = nickname_slug
      AND id != NEW.id
      AND deleted_at IS NULL;
  END;
  
  -- Pokud už existuje, vyhodit chybu
  IF existing_count > 0 THEN
    RAISE EXCEPTION 'Nickname "%" je již obsazena (včetně variant s diakritikou a velkými písmeny). Zkuste jinou přezdívku.', user_nickname;
  END IF;
  
  -- Vytvořit záznam v users tabulce
  INSERT INTO public.users (id, nickname, role)
  VALUES (NEW.id, user_nickname, 'user')
  ON CONFLICT (id) DO UPDATE
    SET nickname = COALESCE(EXCLUDED.nickname, users.nickname);
  
  RETURN NEW;
END;
$$;

-- 2. Vytvořit trigger na auth.users, který volá funkci při vytvoření nového uživatele
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Poznámka: Tento trigger běží jako SECURITY DEFINER, takže obchází RLS policies
-- a může vytvořit záznam v users tabulce i když RLS je aktivní
