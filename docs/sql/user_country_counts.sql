-- Aggregovaná tabulka pro počty navštívených zemí na uživatele
create table if not exists public.user_country_counts (
  user_id uuid primary key references public.users(id) on delete cascade,
  countries_count integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Funkce pro přepočet počtu po INSERT/DELETE v user_visited_countries
create or replace function public.recalc_user_country_count()
returns trigger
language plpgsql
security definer
as $$
declare
  uid uuid;
  cnt integer;
begin
  if (TG_OP = 'INSERT') then
    uid := NEW.user_id;
  else
    uid := OLD.user_id;
  end if;

  select count(*)::int into cnt
  from public.user_visited_countries
  where user_id = uid;

  insert into public.user_country_counts (user_id, countries_count, updated_at)
  values (uid, coalesce(cnt, 0), now())
  on conflict (user_id) do update
    set countries_count = excluded.countries_count,
        updated_at = now();

  return null;
end;
$$;

-- Triggery pro přepočet po INSERT/DELETE
drop trigger if exists trg_user_visited_countries_ins on public.user_visited_countries;
create trigger trg_user_visited_countries_ins
after insert on public.user_visited_countries
for each row execute procedure public.recalc_user_country_count();

drop trigger if exists trg_user_visited_countries_del on public.user_visited_countries;
create trigger trg_user_visited_countries_del
after delete on public.user_visited_countries
for each row execute procedure public.recalc_user_country_count();

-- Volitelné: pokud se mění user_id (nemělo by), lze doplnit UPDATE trigger
-- drop trigger if exists trg_user_visited_countries_upd on public.user_visited_countries;
-- create trigger trg_user_visited_countries_upd
-- after update of user_id on public.user_visited_countries
-- for each row execute procedure public.recalc_user_country_count();


