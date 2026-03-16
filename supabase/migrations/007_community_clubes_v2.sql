alter table public.community_posts
  add column if not exists post_kind text not null default 'livre',
  add column if not exists prompt_slug text,
  add column if not exists context_type text,
  add column if not exists context_id uuid,
  add column if not exists context_label text,
  add column if not exists context_date timestamptz;

update public.community_posts
set post_kind = 'livre'
where post_kind is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'community_posts_post_kind_check'
  ) then
    alter table public.community_posts
      add constraint community_posts_post_kind_check
      check (post_kind in ('duvida', 'novidade', 'evento', 'grupo_evento', 'quero_ir', 'vitoria', 'livre'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'community_posts_context_type_check'
  ) then
    alter table public.community_posts
      add constraint community_posts_context_type_check
      check (context_type is null or context_type in ('missao', 'pronuncia', 'evento', 'manual'));
  end if;
end $$;

insert into public.community_channels (slug, nome, descricao, icone, cor, ordem, ativo)
values
  ('duvidas', 'Duvidas sem vergonha', 'Espaco seguro para perguntar sem medo e destravar o coreano.', '🌱', '#5B7CFA', 1, true),
  ('fandom', 'Fandom & Eventos', 'Novidades, eventos, wishlist e conversas sobre o universo coreano.', '🎬', '#F35B6B', 2, true),
  ('vitorias', 'Vitorias do dia', 'Celebre missao concluida, streak, pronuncia e pequenas conquistas.', '🏆', '#F59E0B', 3, true)
on conflict (slug) do update
set
  nome = excluded.nome,
  descricao = excluded.descricao,
  icone = excluded.icone,
  cor = excluded.cor,
  ordem = excluded.ordem,
  ativo = true;

with legacy_posts as (
  select
    posts.id as post_id,
    legacy_channels.slug as legacy_slug,
    case
      when legacy_channels.slug in ('iniciantes', 'vocabulario') then 'duvidas'
      when legacy_channels.slug in ('doramas', 'kpop', 'viagem', 'novidades') then 'fandom'
      else null
    end as target_slug,
    case
      when legacy_channels.slug = 'novidades' then 'novidade'
      when legacy_channels.slug = 'viagem' then 'quero_ir'
      else 'livre'
    end as mapped_post_kind
  from public.community_posts posts
  join public.community_channels legacy_channels
    on legacy_channels.id = posts.channel_id
  where legacy_channels.slug in ('iniciantes', 'vocabulario', 'doramas', 'kpop', 'viagem', 'novidades')
)
update public.community_posts posts
set
  channel_id = target_channels.id,
  post_kind = case
    when posts.post_kind = 'livre' then legacy_posts.mapped_post_kind
    else posts.post_kind
  end
from legacy_posts
join public.community_channels target_channels
  on target_channels.slug = legacy_posts.target_slug
where posts.id = legacy_posts.post_id;

update public.community_channels
set ativo = false
where slug in ('iniciantes', 'vocabulario', 'doramas', 'kpop', 'viagem', 'novidades');

update public.community_channels
set ativo = true
where slug in ('duvidas', 'fandom', 'vitorias');
