-- Odznaky: projde uživatelovy navštívené země (počty), při splnění condition zapíše do user_badges. Nic víc.
-- Předpoklad: user_badges.user_id -> auth.users(id), user_visited_countries.user_id -> auth.users(id)
-- badges.condition: 'eu>=3', 'eu>=10', 'continents>=3' (Evropa = countries.continent = 'Europe')

-- 1) Funkce: spočítá navštívené (EU + kontinenty), při splnění condition vloží do user_badges
CREATE OR REPLACE FUNCTION public.award_demo_badges(p_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  eu_count int;
  continents_count int;
  r record;
  n int;
BEGIN
  -- Počet navštívených zemí v Evropě (z user_visited_countries + countries)
  SELECT COUNT(*)::int INTO eu_count
  FROM public.user_visited_countries uvc
  JOIN public.countries c ON c.id = uvc.country_id
  WHERE uvc.user_id = p_user
    AND c.continent = 'Europe';

  -- Počet navštívených kontinentů
  SELECT COUNT(DISTINCT c.continent)::int INTO continents_count
  FROM public.user_visited_countries uvc
  JOIN public.countries c ON c.id = uvc.country_id
  WHERE uvc.user_id = p_user;

  eu_count := COALESCE(eu_count, 0);
  continents_count := COALESCE(continents_count, 0);

  -- Pro každý badge: když condition sedí, vložit do user_badges (ON CONFLICT DO NOTHING)
  FOR r IN SELECT id, condition FROM public.badges WHERE condition IS NOT NULL
  LOOP
    n := NULL;
    IF r.condition LIKE 'eu>=%' THEN
      n := (regexp_match(r.condition, 'eu>=([0-9]+)'))[1]::int;
      IF n IS NOT NULL AND eu_count >= n THEN
        INSERT INTO public.user_badges (user_id, badge_id, awarded_at)
        VALUES (p_user, r.id, now())
        ON CONFLICT (user_id, badge_id) DO NOTHING;
      END IF;
    ELSIF r.condition LIKE 'continents>=%' THEN
      n := (regexp_match(r.condition, 'continents>=([0-9]+)'))[1]::int;
      IF n IS NOT NULL AND continents_count >= n THEN
        INSERT INTO public.user_badges (user_id, badge_id, awarded_at)
        VALUES (p_user, r.id, now())
        ON CONFLICT (user_id, badge_id) DO NOTHING;
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- 2) Trigger: po INSERT do user_visited_countries zavolá award_demo_badges
CREATE OR REPLACE FUNCTION public.on_visit_award_demo_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.award_demo_badges(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_visit_award_demo_badges ON public.user_visited_countries;
CREATE TRIGGER trg_visit_award_demo_badges
  AFTER INSERT ON public.user_visited_countries
  FOR EACH ROW
  EXECUTE FUNCTION public.on_visit_award_demo_badges();

-- 3) RLS: bez těchto politik by klient (anon key + JWT) nedostal z tabulek žádné řádky
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read badges" ON public.badges;
CREATE POLICY "Anyone can read badges"
  ON public.badges FOR SELECT
  USING (true);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Anyone can read user_badges" ON public.user_badges;
CREATE POLICY "Anyone can read user_badges"
  ON public.user_badges FOR SELECT
  USING (true);
