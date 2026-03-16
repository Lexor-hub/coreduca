create extension if not exists "uuid-ossp";

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  dorama_favorito text,
  interesse_principal text check (interesse_principal in ('doramas', 'kpop', 'viagem', 'conversacao', 'tudo')),
  nivel_atual text not null default 'exploradora' check (
    nivel_atual in (
      'exploradora',
      'primeiros_passos',
      'sobrevivencia',
      'conversas_basicas',
      'vida_real',
      'base_dominada'
    )
  ),
  xp_total integer not null default 0,
  streak_atual integer not null default 0,
  streak_maximo integer not null default 0,
  ultimo_acesso date,
  is_admin boolean not null default false,
  plano text not null default 'free' check (plano in ('free', 'premium')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.badges (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  nome text not null,
  descricao text,
  icone text,
  xp_recompensa integer not null default 0,
  ativo boolean not null default true
);

create table if not exists public.user_badges (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create table if not exists public.daily_streaks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  data date not null,
  xp_ganho integer not null default 0,
  unique (user_id, data)
);

create table if not exists public.xp_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  acao text not null,
  xp integer not null,
  referencia_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.trilhas (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  titulo text not null,
  descricao text,
  ordem integer not null,
  icone text,
  cor text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.missoes (
  id uuid primary key default uuid_generate_v4(),
  trilha_id uuid not null references public.trilhas(id) on delete cascade,
  titulo text not null,
  descricao text,
  ordem integer not null,
  xp_recompensa integer not null default 20,
  badge_id uuid references public.badges(id),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'question_type') then
    create type public.question_type as enum (
      'multipla_escolha',
      'verdadeiro_falso',
      'completar_frase',
      'associar_par',
      'coreano_para_portugues',
      'portugues_para_coreano'
    );
  end if;
end
$$;

create table if not exists public.questoes (
  id uuid primary key default uuid_generate_v4(),
  missao_id uuid not null references public.missoes(id) on delete cascade,
  tipo public.question_type not null,
  enunciado text not null,
  enunciado_coreano text,
  opcoes jsonb,
  resposta_correta text not null,
  explicacao text,
  audio_url text,
  imagem_url text,
  ordem integer not null default 1,
  ativo boolean not null default true
);

create table if not exists public.missao_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  missao_id uuid not null references public.missoes(id) on delete cascade,
  status text not null default 'em_andamento' check (status in ('em_andamento', 'concluida', 'abandonada')),
  score integer,
  xp_ganho integer not null default 0,
  respostas jsonb,
  erros_pendentes uuid[],
  iniciada_em timestamptz not null default now(),
  concluida_em timestamptz,
  unique (user_id, missao_id)
);

create table if not exists public.user_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  trilha_id uuid not null references public.trilhas(id) on delete cascade,
  missoes_concluidas integer not null default 0,
  total_missoes integer not null default 0,
  percentual integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, trilha_id)
);

create table if not exists public.pronunciation_items (
  id uuid primary key default uuid_generate_v4(),
  frase_coreano text not null,
  transliteracao text,
  traducao text not null,
  audio_modelo_url text,
  dificuldade text not null default 'basico' check (dificuldade in ('basico', 'intermediario', 'avancado')),
  trilha_id uuid references public.trilhas(id) on delete set null,
  tags text[],
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.pronunciation_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid not null references public.pronunciation_items(id) on delete cascade,
  audio_url text,
  transcricao_obtida text,
  score integer check (score between 0 and 100),
  feedback text,
  palavras_chave_acertadas text[],
  xp_ganho integer not null default 0,
  created_at timestamptz not null default now()
);

drop view if exists public.pronunciation_best_scores;
create view public.pronunciation_best_scores with (security_invoker = on) as
select
  user_id,
  item_id,
  max(score) as melhor_score,
  count(*) as total_tentativas,
  avg(score)::integer as media_score
from public.pronunciation_attempts
group by user_id, item_id;

create table if not exists public.ai_personas (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  nome text not null,
  avatar_url text,
  descricao text,
  foco text,
  tom text,
  system_prompt text not null,
  nivel_minimo text default 'exploradora',
  energia_maxima_free integer not null default 5,
  energia_maxima_premium integer not null default 30,
  cor_tema text,
  ativo boolean not null default true,
  ordem integer,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  persona_id uuid not null references public.ai_personas(id) on delete cascade,
  mensagens jsonb not null default '[]'::jsonb,
  energia_usada integer not null default 0,
  data date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, persona_id, data)
);

create table if not exists public.community_channels (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  nome text not null,
  descricao text,
  icone text,
  cor text,
  ordem integer,
  ativo boolean not null default true
);

create table if not exists public.community_posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel_id uuid not null references public.community_channels(id) on delete cascade,
  conteudo text not null,
  imagem_url text,
  reacoes jsonb not null default '{"❤️": 0, "🔥": 0, "😍": 0, "👏": 0}'::jsonb,
  total_comentarios integer not null default 0,
  pinned boolean not null default false,
  status text not null default 'ativo' check (status in ('ativo', 'moderado', 'removido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  conteudo text not null,
  status text not null default 'ativo' check (status in ('ativo', 'moderado', 'removido')),
  created_at timestamptz not null default now()
);

create table if not exists public.post_reactions (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null,
  unique (post_id, user_id, emoji)
);

create table if not exists public.post_reports (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  motivo text,
  status text not null default 'pendente' check (status in ('pendente', 'revisado', 'resolvido')),
  created_at timestamptz not null default now()
);

create table if not exists public.store_items (
  id uuid primary key default uuid_generate_v4(),
  titulo text not null,
  descricao text,
  tipo text check (tipo in ('evento', 'workshop', 'kit', 'produto', 'experiencia')),
  preco numeric(10, 2),
  imagem_url text,
  link_externo text,
  destaque boolean not null default false,
  ativo boolean not null default true,
  data_evento timestamptz,
  ordem integer,
  created_at timestamptz not null default now()
);

create table if not exists public.onboarding_completions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  respostas jsonb,
  completed_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values ('audios', 'audios', true)
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.daily_streaks enable row level security;
alter table public.xp_log enable row level security;
alter table public.trilhas enable row level security;
alter table public.missoes enable row level security;
alter table public.questoes enable row level security;
alter table public.missao_attempts enable row level security;
alter table public.user_progress enable row level security;
alter table public.pronunciation_items enable row level security;
alter table public.pronunciation_attempts enable row level security;
alter table public.ai_personas enable row level security;
alter table public.ai_sessions enable row level security;
alter table public.community_channels enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.post_reactions enable row level security;
alter table public.post_reports enable row level security;
alter table public.store_items enable row level security;
alter table public.onboarding_completions enable row level security;

drop policy if exists "Profiles self select" on public.profiles;
create policy "Profiles self select" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Profiles self update" on public.profiles;
create policy "Profiles self update" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Badges readable" on public.badges;
create policy "Badges readable" on public.badges
  for select using (auth.role() = 'authenticated');

drop policy if exists "User badges own rows" on public.user_badges;
create policy "User badges own rows" on public.user_badges
  for select using (auth.uid() = user_id);

drop policy if exists "Daily streaks own rows" on public.daily_streaks;
create policy "Daily streaks own rows" on public.daily_streaks
  for select using (auth.uid() = user_id);

drop policy if exists "XP log own rows" on public.xp_log;
create policy "XP log own rows" on public.xp_log
  for select using (auth.uid() = user_id);

drop policy if exists "Trilhas readable" on public.trilhas;
create policy "Trilhas readable" on public.trilhas
  for select using (auth.role() = 'authenticated' and ativo = true);

drop policy if exists "Missoes readable" on public.missoes;
create policy "Missoes readable" on public.missoes
  for select using (auth.role() = 'authenticated' and ativo = true);

drop policy if exists "Questoes readable" on public.questoes;
create policy "Questoes readable" on public.questoes
  for select using (auth.role() = 'authenticated' and ativo = true);

drop policy if exists "Missao attempts own rows" on public.missao_attempts;
create policy "Missao attempts own rows" on public.missao_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "User progress own rows" on public.user_progress;
create policy "User progress own rows" on public.user_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Pronunciation items readable" on public.pronunciation_items;
create policy "Pronunciation items readable" on public.pronunciation_items
  for select using (auth.role() = 'authenticated' and ativo = true);

drop policy if exists "Pronunciation attempts own rows" on public.pronunciation_attempts;
create policy "Pronunciation attempts own rows" on public.pronunciation_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "AI personas readable" on public.ai_personas;
create policy "AI personas readable" on public.ai_personas
  for select using (auth.role() = 'authenticated' and ativo = true);

drop policy if exists "AI sessions own rows" on public.ai_sessions;
create policy "AI sessions own rows" on public.ai_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Community channels readable" on public.community_channels;
create policy "Community channels readable" on public.community_channels
  for select using (auth.role() = 'authenticated' and ativo = true);

drop policy if exists "Community posts readable" on public.community_posts;
create policy "Community posts readable" on public.community_posts
  for select using (
    auth.role() = 'authenticated'
    and (
      status = 'ativo'
      or auth.uid() = user_id
    )
  );

drop policy if exists "Community posts insert own" on public.community_posts;
create policy "Community posts insert own" on public.community_posts
  for insert with check (auth.uid() = user_id);

drop policy if exists "Community posts update own" on public.community_posts;
create policy "Community posts update own" on public.community_posts
  for update using (auth.uid() = user_id);

drop policy if exists "Community comments readable" on public.community_comments;
create policy "Community comments readable" on public.community_comments
  for select using (auth.role() = 'authenticated' and status = 'ativo');

drop policy if exists "Community comments insert own" on public.community_comments;
create policy "Community comments insert own" on public.community_comments
  for insert with check (auth.uid() = user_id);

drop policy if exists "Community comments update own" on public.community_comments;
create policy "Community comments update own" on public.community_comments
  for update using (auth.uid() = user_id);

drop policy if exists "Post reactions readable" on public.post_reactions;
create policy "Post reactions readable" on public.post_reactions
  for select using (auth.role() = 'authenticated');

drop policy if exists "Post reactions insert own" on public.post_reactions;
create policy "Post reactions insert own" on public.post_reactions
  for insert with check (auth.uid() = user_id);

drop policy if exists "Post reactions delete own" on public.post_reactions;
create policy "Post reactions delete own" on public.post_reactions
  for delete using (auth.uid() = user_id);

drop policy if exists "Post reports own rows" on public.post_reports;
create policy "Post reports own rows" on public.post_reports
  for select using (auth.uid() = user_id);

drop policy if exists "Post reports insert own" on public.post_reports;
create policy "Post reports insert own" on public.post_reports
  for insert with check (auth.uid() = user_id);

drop policy if exists "Store readable" on public.store_items;
create policy "Store readable" on public.store_items
  for select using (auth.role() = 'authenticated' and ativo = true);

drop policy if exists "Onboarding own rows" on public.onboarding_completions;
create policy "Onboarding own rows" on public.onboarding_completions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Audios readable" on storage.objects;
create policy "Audios readable" on storage.objects
  for select to authenticated
  using (bucket_id = 'audios');

drop policy if exists "Audios insert own or tts" on storage.objects;
create policy "Audios insert own or tts" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'audios'
    and (
      (storage.foldername(name))[1] = 'tts'
      or (
        (storage.foldername(name))[1] = 'pronuncia'
        and (storage.foldername(name))[2] = auth.uid()::text
      )
    )
  );

drop policy if exists "Audios update own or tts" on storage.objects;
create policy "Audios update own or tts" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'audios'
    and (
      (storage.foldername(name))[1] = 'tts'
      or (
        (storage.foldername(name))[1] = 'pronuncia'
        and (storage.foldername(name))[2] = auth.uid()::text
      )
    )
  );

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_value text;
begin
  display_value := coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1));

  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    display_value,
    lower(regexp_replace(coalesce(display_value, 'user_' || substr(new.id::text, 1, 8)), '[^a-zA-Z0-9_]+', '_', 'g'))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.calcular_nivel(xp integer)
returns text
language plpgsql
immutable
as $$
begin
  if xp < 100 then
    return 'exploradora';
  elsif xp < 300 then
    return 'primeiros_passos';
  elsif xp < 700 then
    return 'sobrevivencia';
  elsif xp < 1500 then
    return 'conversas_basicas';
  elsif xp < 3000 then
    return 'vida_real';
  else
    return 'base_dominada';
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
  if uid is null then
    raise exception 'uid is required';
  end if;

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

create or replace function public.finalizar_missao(
  p_missao_id uuid,
  p_respostas jsonb
)
returns table (
  score integer,
  xp_ganho integer,
  badge_slug text,
  badge_nome text,
  missoes_concluidas integer,
  total_missoes integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_missao public.missoes%rowtype;
  v_total_respostas integer := 0;
  v_total_acertos integer := 0;
  v_badge_id uuid;
  v_badge_slug text;
  v_badge_nome text;
  v_total_completed integer := 0;
  v_trilha_total integer := 0;
  v_trilha_completed integer := 0;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select *
    into v_missao
  from public.missoes
  where id = p_missao_id
    and ativo = true;

  if not found then
    raise exception 'mission not found';
  end if;

  select
    count(*),
    count(*) filter (where coalesce((value ->> 'correta')::boolean, false))
    into v_total_respostas, v_total_acertos
  from jsonb_each(coalesce(p_respostas, '{}'::jsonb));

  score := case
    when v_total_respostas = 0 then 0
    else round((v_total_acertos::numeric / v_total_respostas::numeric) * 100)::integer
  end;

  xp_ganho := coalesce(v_missao.xp_recompensa, 20);

  insert into public.missao_attempts (
    user_id,
    missao_id,
    status,
    score,
    xp_ganho,
    respostas,
    erros_pendentes,
    concluida_em
  )
  values (
    v_user_id,
    p_missao_id,
    'concluida',
    score,
    xp_ganho,
    coalesce(p_respostas, '{}'::jsonb),
    '{}'::uuid[],
    now()
  )
  on conflict (user_id, missao_id) do update
  set
    status = 'concluida',
    score = excluded.score,
    xp_ganho = excluded.xp_ganho,
    respostas = excluded.respostas,
    erros_pendentes = excluded.erros_pendentes,
    concluida_em = excluded.concluida_em;

  perform public.incrementar_xp(v_user_id, xp_ganho, 'missao_concluida', p_missao_id);

  select count(*)
    into v_total_completed
  from public.missao_attempts
  where user_id = v_user_id
    and status = 'concluida';

  select count(*)
    into v_trilha_total
  from public.missoes
  where trilha_id = v_missao.trilha_id
    and ativo = true;

  select count(*)
    into v_trilha_completed
  from public.missao_attempts ma
  inner join public.missoes m on m.id = ma.missao_id
  where ma.user_id = v_user_id
    and ma.status = 'concluida'
    and m.trilha_id = v_missao.trilha_id;

  total_missoes := v_trilha_total;
  missoes_concluidas := v_trilha_completed;

  insert into public.user_progress (
    user_id,
    trilha_id,
    missoes_concluidas,
    total_missoes,
    percentual,
    updated_at
  )
  values (
    v_user_id,
    v_missao.trilha_id,
    v_trilha_completed,
    v_trilha_total,
    case when v_trilha_total = 0 then 0 else round((v_trilha_completed::numeric / v_trilha_total::numeric) * 100)::integer end,
    now()
  )
  on conflict (user_id, trilha_id) do update
  set
    missoes_concluidas = excluded.missoes_concluidas,
    total_missoes = excluded.total_missoes,
    percentual = excluded.percentual,
    updated_at = excluded.updated_at;

  if v_missao.badge_id is not null then
    insert into public.user_badges (user_id, badge_id)
    values (v_user_id, v_missao.badge_id)
    on conflict (user_id, badge_id) do nothing;

    select b.slug, b.nome
      into v_badge_slug, v_badge_nome
    from public.badges b
    where b.id = v_missao.badge_id
      and exists (
        select 1
        from public.user_badges ub
        where ub.user_id = v_user_id
          and ub.badge_id = b.id
      );
  end if;

  if v_badge_slug is null then
    v_badge_slug := public.grant_badge_by_slug(v_user_id, 'primeira_missao');
    if v_badge_slug is not null then
      select nome into v_badge_nome from public.badges where slug = v_badge_slug;
    end if;
  end if;

  if v_total_completed >= 10 and v_badge_slug is null then
    v_badge_slug := public.grant_badge_by_slug(v_user_id, 'missionaria');
    if v_badge_slug is not null then
      select nome into v_badge_nome from public.badges where slug = v_badge_slug;
    end if;
  end if;

  badge_slug := v_badge_slug;
  badge_nome := v_badge_nome;

  return next;
end;
$$;

create or replace function public.atualizar_total_comentarios()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_post uuid := coalesce(new.post_id, old.post_id);
begin
  update public.community_posts
  set
    total_comentarios = (
      select count(*)
      from public.community_comments
      where post_id = target_post
        and status = 'ativo'
    ),
    updated_at = now()
  where id = target_post;

  return coalesce(new, old);
end;
$$;

create or replace function public.sync_post_reactions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_post uuid := coalesce(new.post_id, old.post_id);
  target_emoji text := coalesce(new.emoji, old.emoji);
begin
  update public.community_posts
  set
    reacoes = jsonb_set(
      coalesce(reacoes, '{}'::jsonb),
      array[target_emoji],
      to_jsonb((
        select count(*)
        from public.post_reactions
        where post_id = target_post
          and emoji = target_emoji
      )),
      true
    ),
    updated_at = now()
  where id = target_post;

  return coalesce(new, old);
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists ai_sessions_set_updated_at on public.ai_sessions;
create trigger ai_sessions_set_updated_at
  before update on public.ai_sessions
  for each row execute procedure public.set_updated_at();

drop trigger if exists community_posts_set_updated_at on public.community_posts;
create trigger community_posts_set_updated_at
  before update on public.community_posts
  for each row execute procedure public.set_updated_at();

drop trigger if exists user_progress_set_updated_at on public.user_progress;
create trigger user_progress_set_updated_at
  before update on public.user_progress
  for each row execute procedure public.set_updated_at();

drop trigger if exists after_comment_change on public.community_comments;
create trigger after_comment_change
  after insert or update or delete on public.community_comments
  for each row execute procedure public.atualizar_total_comentarios();

drop trigger if exists after_post_reaction_change on public.post_reactions;
create trigger after_post_reaction_change
  after insert or delete on public.post_reactions
  for each row execute procedure public.sync_post_reactions();
