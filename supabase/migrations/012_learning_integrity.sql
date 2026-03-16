create or replace function public.question_answer_matches(
  p_tipo public.question_type,
  p_resposta text,
  p_resposta_correta text
)
returns boolean
language plpgsql
immutable
as $$
declare
  normalized_resposta text := coalesce(p_resposta, '');
  normalized_correta text := coalesce(p_resposta_correta, '');
begin
  if p_tipo = 'completar_frase' then
    normalized_resposta := regexp_replace(lower(trim(normalized_resposta)), '\s+', ' ', 'g');
    normalized_correta := regexp_replace(lower(trim(normalized_correta)), '\s+', ' ', 'g');
  else
    normalized_resposta := trim(normalized_resposta);
    normalized_correta := trim(normalized_correta);
  end if;

  return normalized_resposta = normalized_correta;
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
  v_total_questoes integer := 0;
  v_total_acertos integer := 0;
  v_respostas_processadas jsonb := '{}'::jsonb;
  v_badge_slug text;
  v_badge_nome text;
  v_total_completed integer := 0;
  v_trilha_total integer := 0;
  v_trilha_completed integer := 0;
  v_existing_attempt public.missao_attempts%rowtype;
  v_should_grant_xp boolean := true;
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

  select *
    into v_existing_attempt
  from public.missao_attempts
  where user_id = v_user_id
    and missao_id = p_missao_id;

  v_should_grant_xp := coalesce(v_existing_attempt.status, '') <> 'concluida';

  with mission_questions as (
    select q.id, q.tipo, q.resposta_correta
    from public.questoes q
    where q.missao_id = p_missao_id
      and q.ativo = true
  ),
  submitted as (
    select
      key::uuid as questao_id,
      value ->> 'resposta' as resposta
    from jsonb_each(coalesce(p_respostas, '{}'::jsonb))
  ),
  evaluated as (
    select
      mq.id,
      s.resposta,
      public.question_answer_matches(mq.tipo, s.resposta, mq.resposta_correta) as correta
    from mission_questions mq
    left join submitted s on s.questao_id = mq.id
  )
  select
    count(*),
    count(*) filter (where correta),
    coalesce(
      jsonb_object_agg(
        id::text,
        jsonb_build_object(
          'resposta', coalesce(resposta, ''),
          'correta', correta
        )
      ),
      '{}'::jsonb
    )
  into v_total_questoes, v_total_acertos, v_respostas_processadas
  from evaluated;

  if v_total_questoes = 0 then
    raise exception 'mission has no questions';
  end if;

  if jsonb_object_length(coalesce(p_respostas, '{}'::jsonb)) <> v_total_questoes then
    raise exception 'submission incomplete';
  end if;

  score := round((v_total_acertos::numeric / v_total_questoes::numeric) * 100)::integer;
  xp_ganho := case when v_should_grant_xp then coalesce(v_missao.xp_recompensa, 20) else 0 end;

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
    case when v_should_grant_xp then coalesce(v_missao.xp_recompensa, 20) else coalesce(v_existing_attempt.xp_ganho, 0) end,
    v_respostas_processadas,
    array(
      select key::uuid
      from jsonb_each(v_respostas_processadas)
      where coalesce((value ->> 'correta')::boolean, false) = false
    ),
    now()
  )
  on conflict (user_id, missao_id) do update
  set
    status = excluded.status,
    score = excluded.score,
    xp_ganho = excluded.xp_ganho,
    respostas = excluded.respostas,
    erros_pendentes = excluded.erros_pendentes,
    concluida_em = excluded.concluida_em;

  if v_should_grant_xp then
    perform public.incrementar_xp(v_user_id, coalesce(v_missao.xp_recompensa, 20), 'missao_concluida', p_missao_id);
  end if;

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
