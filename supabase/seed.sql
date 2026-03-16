insert into public.badges (slug, nome, descricao, icone, xp_recompensa)
values
  ('primeira_missao', 'Primeira Missao', 'Completou a primeira missao', '🌸', 10),
  ('streak_7', 'Semana Completa', 'Manteve uma sequencia de 7 dias', '🔥', 50),
  ('streak_30', 'Mes Dedicada', 'Manteve uma sequencia de 30 dias', '⭐', 200),
  ('pronuncia_90', 'Diccao Perfeita', 'Atingiu 90+ em pronuncia', '🎤', 30),
  ('missionaria', 'Missionaria', 'Concluiu 10 missoes', '📚', 100),
  ('comunicativa', 'Comunicativa', 'Criou 20 posts na comunidade', '💬', 50)
on conflict (slug) do update
set
  nome = excluded.nome,
  descricao = excluded.descricao,
  icone = excluded.icone,
  xp_recompensa = excluded.xp_recompensa,
  ativo = true;

insert into public.trilhas (slug, titulo, descricao, ordem, icone, cor)
values
  ('cumprimentos', 'Cumprimentos', 'As primeiras palavras em coreano', 1, '👋', '#5B7CFA'),
  ('frases-basicas', 'Frases Basicas', 'Expressoes essenciais do dia a dia', 2, '💬', '#F35B6B'),
  ('doramas', 'Coreano dos Doramas', 'Frases que aparecem o tempo todo nos doramas', 3, '🎬', '#F59E0B')
on conflict (slug) do update
set
  titulo = excluded.titulo,
  descricao = excluded.descricao,
  ordem = excluded.ordem,
  icone = excluded.icone,
  cor = excluded.cor,
  ativo = true;

insert into public.community_channels (slug, nome, descricao, icone, cor, ordem)
values
  ('doramas', 'Doramas', 'Fale sobre seus doramas favoritos', '🎬', '#A855F7', 1),
  ('kpop', 'K-pop & Cultura', 'Musica, grupos e cultura coreana', '🎵', '#F35B6B', 2),
  ('iniciantes', 'Iniciantes', 'Espaco seguro para quem esta comecando', '🌱', '#5B7CFA', 3),
  ('vocabulario', 'Frases e Vocabulario', 'Compartilhe o que aprendeu', '📖', '#FFB347', 4),
  ('viagem', 'Viagem para Coreia', 'Dicas, roteiros e sonhos de viagem', '✈️', '#5BC8FA', 5),
  ('novidades', 'Novidades', 'Atualizacoes da plataforma e cultura coreana', '📰', '#5B7CFA', 6)
on conflict (slug) do update
set
  nome = excluded.nome,
  descricao = excluded.descricao,
  icone = excluded.icone,
  cor = excluded.cor,
  ordem = excluded.ordem,
  ativo = true;

insert into public.ai_personas (
  slug,
  nome,
  descricao,
  foco,
  tom,
  ordem,
  energia_maxima_free,
  energia_maxima_premium,
  cor_tema,
  system_prompt
)
values
  (
    'soo',
    'Soo',
    'Sua guia de conversacao basica. Paciente e acolhedora.',
    'Cumprimentos e frases de sobrevivencia',
    'acolhedora',
    1,
    5,
    30,
    '#5B7CFA',
    'Voce e Soo, guia de conversacao coreana para iniciantes. Use portugues brasileiro, sempre inclua coreano com transliteracao e traducao, corrija com gentileza e termine com uma pergunta curta.'
  ),
  (
    'jiwoo',
    'Jiwoo',
    'Parceira de pratica para mini dialogos do dia a dia.',
    'Dialogos simples e pratica guiada',
    'leve',
    2,
    5,
    30,
    '#F35B6B',
    'Voce e Jiwoo, parceira de pratica do Coreduca. Estimule respostas curtas em coreano, simule situacoes reais e mantenha no maximo 4 paragrafos curtos.'
  ),
  (
    'hana',
    'Hana',
    'Especialista em girias, doramas e contexto cultural.',
    'Girias, cultura e contexto real',
    'divertida',
    3,
    5,
    30,
    '#F59E0B',
    'Voce e Hana, uma amiga divertida que ensina expressoes reais do coreano. Explique contexto de uso, tom informal ou formal e cite referencias culturais quando fizer sentido.'
  )
on conflict (slug) do update
set
  nome = excluded.nome,
  descricao = excluded.descricao,
  foco = excluded.foco,
  tom = excluded.tom,
  ordem = excluded.ordem,
  energia_maxima_free = excluded.energia_maxima_free,
  energia_maxima_premium = excluded.energia_maxima_premium,
  cor_tema = excluded.cor_tema,
  system_prompt = excluded.system_prompt,
  ativo = true;

insert into public.store_items (titulo, descricao, tipo, preco, link_externo, destaque, ativo, ordem)
values
  ('Workshop de Hangul', 'Aula gravada para destravar a leitura do alfabeto coreano.', 'workshop', 79.90, 'https://coreduca.com/workshop-hangul', true, true, 1),
  ('Kit de Flashcards', 'Material digital com frases essenciais para iniciantes.', 'kit', 29.90, 'https://coreduca.com/flashcards', false, true, 2)
on conflict do nothing;

insert into public.pronunciation_items (frase_coreano, transliteracao, traducao, dificuldade, trilha_id, tags)
select '안녕하세요', 'annyeonghaseyo', 'Ola (formal)', 'basico', t.id, array['cumprimento', 'formal']
from public.trilhas t
where t.slug = 'cumprimentos'
and not exists (
  select 1 from public.pronunciation_items where frase_coreano = '안녕하세요'
);

insert into public.pronunciation_items (frase_coreano, transliteracao, traducao, dificuldade, trilha_id, tags)
select '감사합니다', 'gamsahamnida', 'Obrigada / obrigado', 'basico', t.id, array['educacao']
from public.trilhas t
where t.slug = 'cumprimentos'
and not exists (
  select 1 from public.pronunciation_items where frase_coreano = '감사합니다'
);

insert into public.pronunciation_items (frase_coreano, transliteracao, traducao, dificuldade, trilha_id, tags)
select '괜찮아요', 'gwaenchanayo', 'Tudo bem / sem problemas', 'intermediario', t.id, array['dialogo']
from public.trilhas t
where t.slug = 'frases-basicas'
and not exists (
  select 1 from public.pronunciation_items where frase_coreano = '괜찮아요'
);

insert into public.pronunciation_items (frase_coreano, transliteracao, traducao, dificuldade, trilha_id, tags)
select '대박', 'daebak', 'Uau / que incrivel', 'intermediario', t.id, array['giria', 'dorama']
from public.trilhas t
where t.slug = 'doramas'
and not exists (
  select 1 from public.pronunciation_items where frase_coreano = '대박'
);

insert into public.missoes (trilha_id, titulo, descricao, ordem, xp_recompensa, badge_id, ativo)
select t.id, v.titulo, v.descricao, v.ordem, 20, v.badge_id, true
from public.trilhas t
cross join lateral (
  values
    ('cumprimentos', 'Missao 1', 'Aprenda a cumprimentar com educacao', 1, (select id from public.badges where slug = 'primeira_missao')),
    ('cumprimentos', 'Missao 2', 'Como se apresentar em coreano', 2, null::uuid),
    ('cumprimentos', 'Missao 3', 'Perguntas simples do dia a dia', 3, null::uuid),
    ('cumprimentos', 'Missao 4', 'Agradecendo e respondendo', 4, null::uuid),
    ('cumprimentos', 'Missao 5', 'Mini dialogos de boas-vindas', 5, null::uuid),
    ('frases-basicas', 'Missao 1', 'Frases essenciais para sobreviver', 1, null::uuid),
    ('frases-basicas', 'Missao 2', 'Pedidos simples em lugares publicos', 2, null::uuid),
    ('frases-basicas', 'Missao 3', 'Como dizer que entendeu ou nao', 3, null::uuid),
    ('frases-basicas', 'Missao 4', 'Falando sobre gostos', 4, null::uuid),
    ('frases-basicas', 'Missao 5', 'Frases para continuar a conversa', 5, null::uuid),
    ('doramas', 'Missao 1', 'Expressoes que aparecem nos doramas', 1, null::uuid),
    ('doramas', 'Missao 2', 'Reacoes exageradas e divertidas', 2, null::uuid),
    ('doramas', 'Missao 3', 'Frases comuns em cenas romanticas', 3, null::uuid),
    ('doramas', 'Missao 4', 'Expressando surpresa e drama', 4, null::uuid),
    ('doramas', 'Missao 5', 'Entendendo falas curtas de personagens', 5, null::uuid)
) as v(trilha_slug, titulo, descricao, ordem, badge_id)
where t.slug = v.trilha_slug
and not exists (
  select 1
  from public.missoes m
  where m.trilha_id = t.id
    and m.ordem = v.ordem
);

insert into public.questoes (missao_id, tipo, enunciado, enunciado_coreano, opcoes, resposta_correta, explicacao, ordem, ativo)
select m.id, 'multipla_escolha', q.enunciado, q.enunciado_coreano, q.opcoes, q.resposta_correta, q.explicacao, q.ordem, true
from public.missoes m
join public.trilhas t on t.id = m.trilha_id
cross join lateral (
  values
    ('cumprimentos', 1, 1, 'Como dizer "Ola" de forma educada?', '안녕하세요', '["안녕하세요","감사합니다","미안해요"]'::jsonb, '안녕하세요', 'Use 안녕하세요 como saudacao formal mais comum.'),
    ('cumprimentos', 1, 2, 'Qual traducao de 안녕하세요?', '안녕하세요', '["Tchau","Ola","Obrigada"]'::jsonb, 'Ola', 'E a forma mais comum de dizer ola.'),
    ('cumprimentos', 2, 1, 'Complete: 저는 ___예요', '저는 ___예요', '["지우","사랑","고마워"]'::jsonb, '지우', 'A estrutura apresenta seu nome.'),
    ('cumprimentos', 2, 2, 'Qual frase significa "Eu sou a Ana"?', '저는 아나예요', '["저는 아나예요","안녕하세요","감사합니다"]'::jsonb, '저는 아나예요', 'Use 저는 + nome + 예요.'),
    ('cumprimentos', 3, 1, 'Como perguntar "Tudo bem?"', '괜찮아요?', '["괜찮아요?","안녕히 가세요","정말요?"]'::jsonb, '괜찮아요?', 'Pergunta educada para saber se esta tudo bem.'),
    ('cumprimentos', 3, 2, 'Qual resposta significa "Sim, tudo bem"?', '네, 괜찮아요', '["아니요","네, 괜찮아요","감사합니다"]'::jsonb, '네, 괜찮아요', '네 reforca a afirmacao.'),
    ('cumprimentos', 4, 1, 'Como dizer "Obrigada"?', '감사합니다', '["감사합니다","안녕하세요","죄송합니다"]'::jsonb, '감사합니다', 'Expressao educada de agradecimento.'),
    ('cumprimentos', 4, 2, 'Como responder "De nada" de forma simples?', '괜찮아요', '["괜찮아요","고마워요","안녕"]'::jsonb, '괜찮아요', 'Tambem pode significar sem problemas.'),
    ('cumprimentos', 5, 1, 'Escolha um mini dialogo de boas-vindas.', '어서 오세요', '["어서 오세요","정말이에요","미안해요"]'::jsonb, '어서 오세요', 'Muito usado para receber alguem.'),
    ('cumprimentos', 5, 2, 'Qual resposta combina com "안녕하세요"?', '안녕하세요', '["안녕하세요","감사합니다","잘 가요"]'::jsonb, '안녕하세요', 'Voce pode responder com a mesma saudacao.'),
    ('frases-basicas', 1, 1, 'Como dizer "Tudo bem" em coreano?', '괜찮아요', '["괜찮아요","배고파요","몰라요"]'::jsonb, '괜찮아요', 'Serve para dizer que esta tudo bem.'),
    ('frases-basicas', 1, 2, 'Qual frase quer dizer "Nao sei"?', '몰라요', '["좋아요","몰라요","괜찮아요"]'::jsonb, '몰라요', 'Use quando nao souber responder.'),
    ('frases-basicas', 2, 1, 'Como pedir agua?', '물 주세요', '["물 주세요","문 주세요","말해 주세요"]'::jsonb, '물 주세요', '주세요 adiciona o sentido de por favor.'),
    ('frases-basicas', 2, 2, 'Qual frase e usada para pedir ajuda?', '도와주세요', '["도와주세요","사랑해요","괜찮아요"]'::jsonb, '도와주세요', 'Muito util em situacoes reais.'),
    ('frases-basicas', 3, 1, 'Como dizer "Entendi"?', '알겠어요', '["알겠어요","모르겠어요","배고파요"]'::jsonb, '알겠어요', 'Forma educada para dizer que entendeu.'),
    ('frases-basicas', 3, 2, 'Como dizer "Nao entendi"?', '모르겠어요', '["알겠어요","모르겠어요","괜찮아요"]'::jsonb, '모르겠어요', 'Boa frase para pedir mais explicacoes.'),
    ('frases-basicas', 4, 1, 'Como dizer "Eu gosto"?', '좋아요', '["좋아요","싫어요","정말요"]'::jsonb, '좋아요', '좋아요 expressa que algo agrada voce.'),
    ('frases-basicas', 4, 2, 'Qual frase quer dizer "Eu nao gosto"?', '싫어요', '["좋아요","싫어요","배고파요"]'::jsonb, '싫어요', 'Use com cuidado por soar mais direto.'),
    ('frases-basicas', 5, 1, 'Como continuar a conversa com "E voce?"', '그리고요?', '["그리고요?","물 주세요","안녕하세요"]'::jsonb, '그리고요?', 'Boa para incentivar o outro a continuar.'),
    ('frases-basicas', 5, 2, 'Qual frase quer dizer "Me conte mais"?', '더 말해 주세요', '["더 말해 주세요","모르겠어요","괜찮아요"]'::jsonb, '더 말해 주세요', 'Frase boa para manter a conversa viva.'),
    ('doramas', 1, 1, 'Qual expressao significa "uau" ou "incrivel"?', '대박', '["대박","안녕","사랑"]'::jsonb, '대박', 'Muito comum em doramas e conversas informais.'),
    ('doramas', 1, 2, 'Qual traducao de 대박?', '대박', '["Que incrivel","Muito obrigada","Calma"]'::jsonb, 'Que incrivel', 'Expressa surpresa positiva.'),
    ('doramas', 2, 1, 'Qual reacao exagerada aparece em cenas dramaticas?', '진짜?', '["진짜?","물 주세요","미안해요"]'::jsonb, '진짜?', 'Equivale a serio?.'),
    ('doramas', 2, 2, 'Como dizer "Serio?"', '진짜?', '["괜찮아요?","진짜?","대박"]'::jsonb, '진짜?', 'Tom de surpresa ou curiosidade.'),
    ('doramas', 3, 1, 'Qual frase romantica quer dizer "Eu senti sua falta"?', '보고 싶었어요', '["보고 싶었어요","안녕하세요","잘 가요"]'::jsonb, '보고 싶었어요', 'Muito comum em cenas romanticas.'),
    ('doramas', 3, 2, 'Qual expressao significa "Eu gosto de voce"?', '좋아해요', '["좋아해요","괜찮아요","몰라요"]'::jsonb, '좋아해요', 'Forma direta e comum.'),
    ('doramas', 4, 1, 'Como dizer "O que?!" em tom dramatico?', '뭐?!', '["뭐?!","안녕","감사합니다"]'::jsonb, '뭐?!', 'Muito usado para surpresa ou indignacao.'),
    ('doramas', 4, 2, 'Qual frase significa "Nao acredito"?', '믿을 수 없어요', '["믿을 수 없어요","알겠어요","좋아요"]'::jsonb, '믿을 수 없어요', 'Boa para cenas intensas.'),
    ('doramas', 5, 1, 'Qual frase curta de personagem quer dizer "Vamos!"?', '가자', '["가자","하지 마","괜찮아요"]'::jsonb, '가자', 'Muito comum em falas informais.'),
    ('doramas', 5, 2, 'Qual frase quer dizer "Nao faca isso"?', '하지 마', '["하지 마","가자","대박"]'::jsonb, '하지 마', 'Expressao curta e dramatica.'
)
) as q(trilha_slug, missao_ordem, ordem, enunciado, enunciado_coreano, opcoes, resposta_correta, explicacao)
on t.slug = q.trilha_slug
where m.trilha_id = t.id
  and m.ordem = q.missao_ordem
and not exists (
  select 1
  from public.questoes existing
  where existing.missao_id = m.id
    and existing.ordem = q.ordem
);
