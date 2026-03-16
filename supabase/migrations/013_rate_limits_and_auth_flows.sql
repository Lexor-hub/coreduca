create table if not exists public.api_rate_limits (
  user_id uuid not null references public.profiles(id) on delete cascade,
  route text not null,
  bucket_start timestamptz not null,
  count integer not null default 0,
  primary key (user_id, route, bucket_start)
);

alter table public.api_rate_limits enable row level security;

revoke all on public.api_rate_limits from anon, authenticated;

create or replace function public.consume_api_rate_limit(
  p_route text,
  p_bucket_seconds integer,
  p_limit integer
)
returns table (
  allowed boolean,
  remaining integer,
  request_count integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_bucket_start timestamptz;
  v_request_count integer;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if coalesce(trim(p_route), '') = '' or coalesce(p_bucket_seconds, 0) <= 0 or coalesce(p_limit, 0) <= 0 then
    raise exception 'invalid rate limit arguments';
  end if;

  v_bucket_start := to_timestamp(floor(extract(epoch from now()) / p_bucket_seconds) * p_bucket_seconds);

  insert into public.api_rate_limits (user_id, route, bucket_start, count)
  values (v_user_id, p_route, v_bucket_start, 1)
  on conflict (user_id, route, bucket_start)
  do update set count = public.api_rate_limits.count + 1
  returning count into v_request_count;

  allowed := v_request_count <= p_limit;
  remaining := greatest(p_limit - v_request_count, 0);
  request_count := v_request_count;
  reset_at := v_bucket_start + make_interval(secs => p_bucket_seconds);

  return next;
end;
$$;

create or replace view public.ai_personas_public as
select
  id,
  slug,
  nome,
  avatar_url,
  descricao,
  foco,
  tom,
  nivel_minimo,
  energia_maxima_free,
  energia_maxima_premium,
  cor_tema,
  ativo,
  ordem,
  created_at
from public.ai_personas
where ativo = true;

create or replace view public.profile_public_summary as
select
  id,
  display_name,
  username,
  avatar_url,
  nivel_atual,
  streak_atual
from public.profiles
where beta_access = true;

grant select on public.ai_personas_public to authenticated;
grant select on public.profile_public_summary to authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer) to authenticated;
