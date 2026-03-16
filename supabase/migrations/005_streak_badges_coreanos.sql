insert into public.badges (slug, nome, descricao, icone, xp_recompensa, ativo)
values
  ('streak_7', 'Esquenta de Hongdae', 'Acendeu sua rotina com 7 dias seguidos de estudo.', '🔥', 50, true),
  ('streak_30', 'Flor de Mugunghwa', 'Manteve 30 dias ativos com a resiliencia da flor simbolo da Coreia.', '🌺', 200, true),
  ('streak_60', 'Guardia do Hanok', 'Construiu uma rotina firme por 60 dias, como um hanok que resiste ao tempo.', '🏯', 350, true),
  ('streak_100', 'Tigre de Joseon', 'Alcancou 100 dias seguidos e virou lenda da constancia.', '🐯', 600, true)
on conflict (slug) do update
set
  nome = excluded.nome,
  descricao = excluded.descricao,
  icone = excluded.icone,
  xp_recompensa = excluded.xp_recompensa,
  ativo = excluded.ativo;

create or replace function public.award_streak_badges(uid uuid, streak_value integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if uid is null or streak_value is null then
    return;
  end if;

  if streak_value >= 7 then
    perform public.grant_badge_by_slug(uid, 'streak_7');
  end if;

  if streak_value >= 30 then
    perform public.grant_badge_by_slug(uid, 'streak_30');
  end if;

  if streak_value >= 60 then
    perform public.grant_badge_by_slug(uid, 'streak_60');
  end if;

  if streak_value >= 100 then
    perform public.grant_badge_by_slug(uid, 'streak_100');
  end if;
end;
$$;

create or replace function public.registrar_streak_diario(uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  hoje date := current_date;
  ultima_data date;
  streak_atual_val integer;
  created_today boolean := false;
begin
  if uid is null then
    return;
  end if;

  select ultimo_acesso, streak_atual
    into ultima_data, streak_atual_val
  from public.profiles
  where id = uid;

  begin
    insert into public.daily_streaks (user_id, data)
    values (uid, hoje);
    created_today := true;
  exception
    when unique_violation then
      created_today := false;
  end;

  if created_today then
    if ultima_data = hoje - 1 then
      streak_atual_val := coalesce(streak_atual_val, 0) + 1;
    elsif ultima_data = hoje then
      streak_atual_val := coalesce(streak_atual_val, 0);
    else
      streak_atual_val := 1;
    end if;

    update public.profiles
    set
      streak_atual = greatest(streak_atual_val, 1),
      streak_maximo = greatest(coalesce(streak_maximo, 0), greatest(streak_atual_val, 1)),
      ultimo_acesso = hoje,
      updated_at = now()
    where id = uid;

    perform public.award_streak_badges(uid, greatest(streak_atual_val, 1));
  else
    update public.profiles
    set ultimo_acesso = coalesce(ultimo_acesso, hoje)
    where id = uid;
  end if;
end;
$$;

insert into public.user_badges (user_id, badge_id)
select p.id, b.id
from public.profiles p
join public.badges b on b.slug = 'streak_7'
where p.streak_maximo >= 7
on conflict (user_id, badge_id) do nothing;

insert into public.user_badges (user_id, badge_id)
select p.id, b.id
from public.profiles p
join public.badges b on b.slug = 'streak_30'
where p.streak_maximo >= 30
on conflict (user_id, badge_id) do nothing;

insert into public.user_badges (user_id, badge_id)
select p.id, b.id
from public.profiles p
join public.badges b on b.slug = 'streak_60'
where p.streak_maximo >= 60
on conflict (user_id, badge_id) do nothing;

insert into public.user_badges (user_id, badge_id)
select p.id, b.id
from public.profiles p
join public.badges b on b.slug = 'streak_100'
where p.streak_maximo >= 100
on conflict (user_id, badge_id) do nothing;
