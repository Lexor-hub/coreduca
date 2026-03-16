create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_admin = true
  );
$$;

create or replace function public.assert_self_or_admin(target_uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return;
  end if;

  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if target_uid is null then
    raise exception 'target uid is required';
  end if;

  if auth.uid() <> target_uid and not public.current_user_is_admin() then
    raise exception 'forbidden';
  end if;
end;
$$;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all routines in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;

grant select on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update (display_name, bio, avatar_url, dorama_favorito, interesse_principal, updated_at)
  on public.profiles to authenticated;

grant select on public.badges to authenticated;
grant select on public.user_badges to authenticated;
grant select on public.daily_streaks to authenticated;
grant select on public.xp_log to authenticated;
grant select, insert, update, delete on public.trilhas to authenticated;
grant select, insert, update, delete on public.missoes to authenticated;
grant select, insert, update, delete on public.questoes to authenticated;
grant select on public.missao_attempts to authenticated;
grant select on public.user_progress to authenticated;
grant select, insert, update, delete on public.pronunciation_items to authenticated;
grant select on public.pronunciation_attempts to authenticated;
grant select, insert, update, delete on public.ai_personas to authenticated;
grant select on public.ai_sessions to authenticated;
grant select, insert, update, delete on public.community_channels to authenticated;
grant select, insert on public.community_posts to authenticated;
grant select, insert on public.community_comments to authenticated;
grant select, insert, delete on public.post_reactions to authenticated;
grant select, insert on public.post_reports to authenticated;
grant select, insert, update, delete on public.store_items to authenticated;
grant select on public.onboarding_completions to authenticated;

drop policy if exists "Profiles self update" on public.profiles;
create policy "Profiles self update" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Questoes readable" on public.questoes;
drop policy if exists "AI personas readable" on public.ai_personas;

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
  perform public.assert_self_or_admin(uid);

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

create or replace function public.incrementar_xp(
  uid uuid,
  valor integer,
  acao text default 'atividade',
  referencia_id uuid default null
)
returns table (
  xp_total integer,
  nivel_atual text,
  streak_atual integer,
  streak_maximo integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_self_or_admin(uid);
  perform public.registrar_streak_diario(uid);

  update public.profiles
  set
    xp_total = coalesce(public.profiles.xp_total, 0) + greatest(valor, 0),
    nivel_atual = public.calcular_nivel(coalesce(public.profiles.xp_total, 0) + greatest(valor, 0)),
    updated_at = now()
  where id = uid
  returning public.profiles.xp_total, public.profiles.nivel_atual, public.profiles.streak_atual, public.profiles.streak_maximo
  into xp_total, nivel_atual, streak_atual, streak_maximo;

  if greatest(valor, 0) > 0 then
    insert into public.xp_log (user_id, acao, xp, referencia_id)
    values (uid, acao, greatest(valor, 0), referencia_id);
  end if;

  return next;
end;
$$;

create or replace function public.grant_badge_by_slug(uid uuid, badge_slug text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target_badge public.badges%rowtype;
  inserted_count integer;
begin
  perform public.assert_self_or_admin(uid);

  select *
    into target_badge
  from public.badges
  where slug = badge_slug
    and ativo = true;

  if not found then
    return null;
  end if;

  insert into public.user_badges (user_id, badge_id)
  values (uid, target_badge.id)
  on conflict (user_id, badge_id) do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count > 0 then
    return target_badge.slug;
  end if;

  return null;
end;
$$;

grant execute on function public.current_user_is_admin() to authenticated;
grant execute on function public.assert_self_or_admin(uuid) to authenticated;
grant execute on function public.registrar_streak_diario(uuid) to authenticated;
