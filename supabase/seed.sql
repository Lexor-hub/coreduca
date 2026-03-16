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
join lateral (
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
    ('doramas', 5, 2, 'Qual frase quer dizer "Nao faca isso"?', '하지 마', '["하지 마","가자","대박"]'::jsonb, '하지 마', 'Expressao curta e dramatica.')
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

-- Questoes extras: 8 novas por missao (ordem 3-10), total 120
insert into public.questoes (missao_id, tipo, enunciado, enunciado_coreano, opcoes, resposta_correta, explicacao, ordem, ativo)
select m.id, q.tipo::public.question_type, q.enunciado, q.enunciado_coreano, q.opcoes, q.resposta_correta, q.explicacao, q.ordem, true
from public.missoes m
join public.trilhas t on t.id = m.trilha_id
join lateral (
  values
    -- CUMPRIMENTOS - Missao 1
    ('cumprimentos', 1, 3, 'multipla_escolha', 'Como dizer "Oi" de forma informal?', '안녕 (annyeong)', '["안녕","감사합니다","죄송합니다"]'::jsonb, '안녕', 'Usado entre amigos e pessoas proximas.'),
    ('cumprimentos', 1, 4, 'multipla_escolha', 'Qual e a saudacao usada ao telefone?', '여보세요 (yeoboseyo)', '["여보세요","안녕하세요","괜찮아요"]'::jsonb, '여보세요', 'Equivale ao nosso alo.'),
    ('cumprimentos', 1, 5, 'coreano_para_portugues', 'O que significa 안녕히 가세요?', '안녕히 가세요 (annyeonghi gaseyo)', '["Ate logo (para quem sai)","Bom dia","Obrigada"]'::jsonb, 'Ate logo (para quem sai)', 'Dito por quem fica para quem esta saindo.'),
    ('cumprimentos', 1, 6, 'multipla_escolha', 'Como dizer "Ate logo" quando voce e quem sai?', '안녕히 계세요 (annyeonghi gyeseyo)', '["안녕히 계세요","안녕히 가세요","잘 가요"]'::jsonb, '안녕히 계세요', 'Dito por quem sai para quem fica.'),
    ('cumprimentos', 1, 7, 'verdadeiro_falso', '안녕하세요 pode ser usado tanto de manha quanto de noite?', '안녕하세요', '["Verdadeiro","Falso"]'::jsonb, 'Verdadeiro', 'Diferente do portugues, serve para qualquer hora do dia.'),
    ('cumprimentos', 1, 8, 'coreano_para_portugues', 'O que significa 잘 가요?', '잘 가요 (jal gayo)', '["Tchau (informal)","Bom dia","Obrigada"]'::jsonb, 'Tchau (informal)', 'Forma casual de se despedir.'),
    ('cumprimentos', 1, 9, 'multipla_escolha', 'Como dizer "Boa noite" antes de dormir?', '잘 자요 (jal jayo)', '["잘 자요","안녕하세요","잘 가요"]'::jsonb, '잘 자요', 'Usado antes de ir dormir.'),
    ('cumprimentos', 1, 10, 'portugues_para_coreano', 'Como se diz "Prazer em conhecer"?', '만나서 반갑습니다 (mannaseo bangapseumnida)', '["만나서 반갑습니다","안녕하세요","감사합니다"]'::jsonb, '만나서 반갑습니다', 'Expressao formal para primeiro encontro.'),
    -- CUMPRIMENTOS - Missao 2
    ('cumprimentos', 2, 3, 'multipla_escolha', 'Como dizer "Meu nome e..."?', '제 이름은 ___이에요', '["제 이름은","저는 좋아요","안녕하세요"]'::jsonb, '제 이름은', 'Forma mais completa de dizer seu nome.'),
    ('cumprimentos', 2, 4, 'coreano_para_portugues', 'O que significa 저는 브라질 사람이에요?', '저는 브라질 사람이에요', '["Eu sou brasileira(o)","Eu moro no Brasil","Eu gosto do Brasil"]'::jsonb, 'Eu sou brasileira(o)', '사람 significa pessoa, 이에요 indica identidade.'),
    ('cumprimentos', 2, 5, 'multipla_escolha', 'Como perguntar "Qual e o seu nome?"', '이름이 뭐예요? (ireumi mwoyeyo?)', '["이름이 뭐예요?","어디에 살아요?","뭐 해요?"]'::jsonb, '이름이 뭐예요?', 'Pergunta educada sobre o nome.'),
    ('cumprimentos', 2, 6, 'verdadeiro_falso', 'A particula 은/는 marca o topico da frase em coreano?', null, '["Verdadeiro","Falso"]'::jsonb, 'Verdadeiro', 'Em 저는, o 는 marca eu como topico.'),
    ('cumprimentos', 2, 7, 'multipla_escolha', 'Como dizer "Eu sou estudante"?', '저는 학생이에요 (jeoneun haksaengieyo)', '["저는 학생이에요","저는 선생님이에요","저는 의사예요"]'::jsonb, '저는 학생이에요', '학생 significa estudante.'),
    ('cumprimentos', 2, 8, 'portugues_para_coreano', 'Como se diz "De onde voce e?"', '어디에서 왔어요? (eodieseo wasseoyo?)', '["어디에서 왔어요?","어디 가요?","뭐 해요?"]'::jsonb, '어디에서 왔어요?', 'Pergunta sobre a origem da pessoa.'),
    ('cumprimentos', 2, 9, 'multipla_escolha', 'Qual a diferenca entre 이에요 e 예요?', null, '["이에요 apos consoante, 예요 apos vogal","Sao sinonimos","이에요 e formal, 예요 e informal"]'::jsonb, '이에요 apos consoante, 예요 apos vogal', 'A escolha depende da ultima letra da palavra anterior.'),
    ('cumprimentos', 2, 10, 'coreano_para_portugues', 'O que significa 만나서 반가워요?', '만나서 반가워요 (mannaseo bangawoyo)', '["Prazer em conhecer (informal)","Ate logo","Muito obrigada"]'::jsonb, 'Prazer em conhecer (informal)', 'Versao mais casual de 만나서 반갑습니다.'),
    -- CUMPRIMENTOS - Missao 3
    ('cumprimentos', 3, 3, 'multipla_escolha', 'Como perguntar "Como voce esta?"', '어떻게 지내요? (eotteoke jinaeyo?)', '["어떻게 지내요?","뭐 해요?","어디 가요?"]'::jsonb, '어떻게 지내요?', 'Pergunta casual sobre como a pessoa esta.'),
    ('cumprimentos', 3, 4, 'portugues_para_coreano', 'Como se diz "O que e isso?"', '이게 뭐예요? (ige mwoyeyo?)', '["이게 뭐예요?","어디예요?","누구예요?"]'::jsonb, '이게 뭐예요?', 'Pergunta muito util no dia a dia.'),
    ('cumprimentos', 3, 5, 'coreano_para_portugues', 'O que significa 어디예요?', '어디예요? (eodiyeyo?)', '["Onde e?","O que e?","Quem e?"]'::jsonb, 'Onde e?', 'Pergunta sobre localizacao.'),
    ('cumprimentos', 3, 6, 'multipla_escolha', 'Como perguntar "Quanto custa?"', '얼마예요? (eolmayeyo?)', '["얼마예요?","뭐예요?","어디예요?"]'::jsonb, '얼마예요?', 'Essencial para compras e restaurantes.'),
    ('cumprimentos', 3, 7, 'verdadeiro_falso', '네 significa "sim" em coreano?', null, '["Verdadeiro","Falso"]'::jsonb, 'Verdadeiro', '네 e a resposta afirmativa mais comum.'),
    ('cumprimentos', 3, 8, 'multipla_escolha', 'Como dizer "nao" em coreano?', '아니요 (aniyo)', '["아니요","네","몰라요"]'::jsonb, '아니요', 'Forma educada de negar.'),
    ('cumprimentos', 3, 9, 'coreano_para_portugues', 'O que significa 뭐 해요?', '뭐 해요? (mwo haeyo?)', '["O que voce esta fazendo?","Onde voce mora?","Como vai?"]'::jsonb, 'O que voce esta fazendo?', 'Pergunta casual muito comum.'),
    ('cumprimentos', 3, 10, 'portugues_para_coreano', 'Como se diz "Quem e?"', '누구예요? (nuguyeyo?)', '["누구예요?","뭐예요?","어디예요?"]'::jsonb, '누구예요?', 'Pergunta sobre identidade de alguem.'),
    -- CUMPRIMENTOS - Missao 4
    ('cumprimentos', 4, 3, 'multipla_escolha', 'Como dizer "Desculpa" de forma educada?', '죄송합니다 (joesonghamnida)', '["죄송합니다","감사합니다","안녕하세요"]'::jsonb, '죄송합니다', 'Forma muito educada de pedir desculpa.'),
    ('cumprimentos', 4, 4, 'coreano_para_portugues', 'O que significa 미안해요?', '미안해요 (mianhaeyo)', '["Desculpa (casual)","Obrigada","De nada"]'::jsonb, 'Desculpa (casual)', 'Forma menos formal que 죄송합니다.'),
    ('cumprimentos', 4, 5, 'multipla_escolha', 'Qual e a forma informal de dizer obrigada?', '고마워요 (gomawoyo)', '["고마워요","감사합니다","죄송합니다"]'::jsonb, '고마워요', 'Usado entre amigos e pessoas proximas.'),
    ('cumprimentos', 4, 6, 'verdadeiro_falso', '감사합니다 e mais formal que 고마워요?', null, '["Verdadeiro","Falso"]'::jsonb, 'Verdadeiro', '감사합니다 e a versao mais formal e respeitosa.'),
    ('cumprimentos', 4, 7, 'portugues_para_coreano', 'Como se diz "Nao tem de que"?', '천만에요 (cheonmaneyo)', '["천만에요","괜찮아요","감사합니다"]'::jsonb, '천만에요', 'Resposta formal para agradecimento.'),
    ('cumprimentos', 4, 8, 'multipla_escolha', 'Como responder "Tudo bem, sem problemas" apos alguem se desculpar?', '괜찮아요 (gwaenchanayo)', '["괜찮아요","고마워요","미안해요"]'::jsonb, '괜찮아요', 'Resposta tranquila para aceitar desculpa.'),
    ('cumprimentos', 4, 9, 'coreano_para_portugues', 'O que significa 아니에요?', '아니에요 (anieyo)', '["Nao e isso / De nada","Desculpa","Obrigada"]'::jsonb, 'Nao e isso / De nada', 'Pode ser usado como de nada em contexto informal.'),
    ('cumprimentos', 4, 10, 'multipla_escolha', 'Qual expressao usar quando alguem agradece voce?', '별말씀을요 (byeolmalsseumeulyo)', '["별말씀을요","감사합니다","미안해요"]'::jsonb, '별말씀을요', 'Forma educada de dizer imagine, de nada.'),
    -- CUMPRIMENTOS - Missao 5
    ('cumprimentos', 5, 3, 'multipla_escolha', 'No restaurante, o garcom diz 어서 오세요. Como responder?', '안녕하세요', '["안녕하세요","미안해요","잘 가요"]'::jsonb, '안녕하세요', 'Uma resposta simples e educada.'),
    ('cumprimentos', 5, 4, 'coreano_para_portugues', 'O que significa 또 오세요?', '또 오세요 (tto oseyo)', '["Volte sempre","Bem-vinda","Obrigada"]'::jsonb, 'Volte sempre', 'Frase de despedida em lojas e restaurantes.'),
    ('cumprimentos', 5, 5, 'multipla_escolha', 'Como dizer "Com licenca" ao entrar em um lugar?', '실례합니다 (sillyehamnida)', '["실례합니다","어서 오세요","안녕하세요"]'::jsonb, '실례합니다', 'Forma educada de pedir licenca.'),
    ('cumprimentos', 5, 6, 'verdadeiro_falso', '어서 오세요 e usado para dar boas-vindas?', null, '["Verdadeiro","Falso"]'::jsonb, 'Verdadeiro', 'E a frase padrao de boas-vindas em lojas.'),
    ('cumprimentos', 5, 7, 'portugues_para_coreano', 'Como se diz "Por favor, entre"?', '들어오세요 (deureoseyo)', '["들어오세요","나가세요","앉으세요"]'::jsonb, '들어오세요', 'Convida alguem a entrar.'),
    ('cumprimentos', 5, 8, 'multipla_escolha', 'Qual frase significa "Por favor, sente-se"?', '앉으세요 (anjeuseyo)', '["앉으세요","들어오세요","어서 오세요"]'::jsonb, '앉으세요', 'Muito usada como cortesia.'),
    ('cumprimentos', 5, 9, 'coreano_para_portugues', 'O que significa 잘 먹겠습니다?', '잘 먹겠습니다 (jal meokgesseumnida)', '["Vou comer bem (antes da refeicao)","Obrigada pela comida","Estou com fome"]'::jsonb, 'Vou comer bem (antes da refeicao)', 'Expressao de respeito antes de comer.'),
    ('cumprimentos', 5, 10, 'multipla_escolha', 'Apos a refeicao, como agradecer a comida?', '잘 먹었습니다 (jal meogeosseumnida)', '["잘 먹었습니다","잘 먹겠습니다","감사합니다"]'::jsonb, '잘 먹었습니다', 'Dita apos terminar de comer.'),
    -- FRASES BASICAS - Missao 1
    ('frases-basicas', 1, 3, 'multipla_escolha', 'Como dizer "Estou com fome"?', '배고파요 (baegopayo)', '["배고파요","목마르요","괜찮아요"]'::jsonb, '배고파요', 'Frase essencial para o dia a dia.'),
    ('frases-basicas', 1, 4, 'coreano_para_portugues', 'O que significa 화장실이 어디예요?', '화장실이 어디예요?', '["Onde fica o banheiro?","Onde fica o restaurante?","Onde fica o hotel?"]'::jsonb, 'Onde fica o banheiro?', 'Frase de sobrevivencia numero 1.'),
    ('frases-basicas', 1, 5, 'multipla_escolha', 'Como dizer "Espere um momento"?', '잠깐만요 (jamkkanmanyo)', '["잠깐만요","빨리요","괜찮아요"]'::jsonb, '잠깐만요', 'Muito util em diversas situacoes.'),
    ('frases-basicas', 1, 6, 'portugues_para_coreano', 'Como se diz "Tem problema" / "Nao pode"?', '안 돼요 (an dwaeyo)', '["안 돼요","괜찮아요","좋아요"]'::jsonb, '안 돼요', 'Indica que algo nao e permitido.'),
    ('frases-basicas', 1, 7, 'verdadeiro_falso', '잠깐만요 pode ser usado para pedir que alguem espere?', null, '["Verdadeiro","Falso"]'::jsonb, 'Verdadeiro', 'Literalmente significa so um momento.'),
    ('frases-basicas', 1, 8, 'multipla_escolha', 'Como dizer "Eu nao falo coreano"?', '한국어 못 해요 (hangugeo mot haeyo)', '["한국어 못 해요","한국어 좋아요","한국어 알아요"]'::jsonb, '한국어 못 해요', 'Util para situacoes de comunicacao.'),
    ('frases-basicas', 1, 9, 'coreano_para_portugues', 'O que significa 도와주세요?', '도와주세요 (dowajuseyo)', '["Me ajude, por favor","Me de, por favor","Espere, por favor"]'::jsonb, 'Me ajude, por favor', 'Essencial em emergencias.'),
    ('frases-basicas', 1, 10, 'multipla_escolha', 'Como dizer "Esta bem" / "OK"?', '좋아요 (joayo)', '["좋아요","싫어요","몰라요"]'::jsonb, '좋아요', 'Expressa concordancia ou aprovacao.'),
    -- FRASES BASICAS - Missao 2
    ('frases-basicas', 2, 3, 'multipla_escolha', 'Como pedir "Mais um, por favor"?', '하나 더 주세요 (hana deo juseyo)', '["하나 더 주세요","물 주세요","계산해 주세요"]'::jsonb, '하나 더 주세요', 'Muito util em restaurantes.'),
    ('frases-basicas', 2, 4, 'coreano_para_portugues', 'O que significa 계산해 주세요?', '계산해 주세요 (gyesanhae juseyo)', '["A conta, por favor","Agua, por favor","O cardapio, por favor"]'::jsonb, 'A conta, por favor', 'Essencial ao terminar de comer.'),
    ('frases-basicas', 2, 5, 'multipla_escolha', 'Como pedir o cardapio?', '메뉴 주세요 (menyu juseyo)', '["메뉴 주세요","물 주세요","계산해 주세요"]'::jsonb, '메뉴 주세요', 'Primeira coisa a pedir no restaurante.'),
    ('frases-basicas', 2, 6, 'portugues_para_coreano', 'Como se diz "Isso, por favor" (apontando para algo)?', '이거 주세요 (igeo juseyo)', '["이거 주세요","저거 주세요","뭐예요?"]'::jsonb, '이거 주세요', '이거 = isso (perto de voce).'),
    ('frases-basicas', 2, 7, 'verdadeiro_falso', '주세요 adicionado ao final de uma frase transforma em um pedido educado?', null, '["Verdadeiro","Falso"]'::jsonb, 'Verdadeiro', '주세요 equivale a por favor, me de.'),
    ('frases-basicas', 2, 8, 'multipla_escolha', 'Como dizer "Aquilo, por favor" (algo longe de voce)?', '저거 주세요 (jeogeo juseyo)', '["저거 주세요","이거 주세요","그거 주세요"]'::jsonb, '저거 주세요', '저거 = aquilo (longe de ambos).'),
    ('frases-basicas', 2, 9, 'coreano_para_portugues', 'O que significa 여기요?', '여기요 (yeogiyo)', '["Com licenca (para chamar atencao)","Aqui e legal","Onde fica?"]'::jsonb, 'Com licenca (para chamar atencao)', 'Usado para chamar garcom ou atendente.'),
    ('frases-basicas', 2, 10, 'multipla_escolha', 'Como pedir "Sem picante, por favor"?', '안 맵게 해 주세요 (an maepge hae juseyo)', '["안 맵게 해 주세요","매운 거 주세요","물 주세요"]'::jsonb, '안 맵게 해 주세요', 'Salva vidas na culinaria coreana!'),
    -- FRASES BASICAS - Missao 3
    ('frases-basicas', 3, 3, 'multipla_escolha', 'Como pedir para repetir?', '다시 말해 주세요 (dasi malhae juseyo)', '["다시 말해 주세요","알겠어요","모르겠어요"]'::jsonb, '다시 말해 주세요', 'Muito util quando nao entender.'),
    ('frases-basicas', 3, 4, 'coreano_para_portugues', 'O que significa 천천히 말해 주세요?', '천천히 말해 주세요', '["Fale devagar, por favor","Fale mais alto","Repita, por favor"]'::jsonb, 'Fale devagar, por favor', 'Essencial para iniciantes.'),
    ('frases-basicas', 3, 5, 'multipla_escolha', 'Como dizer "Eu sei"?', '알아요 (arayo)', '["알아요","몰라요","모르겠어요"]'::jsonb, '알아요', 'Forma simples de dizer que sabe.'),
    ('frases-basicas', 3, 6, 'portugues_para_coreano', 'Como se diz "Voce entendeu?"', '이해했어요? (ihaehesseoyo?)', '["이해했어요?","알겠어요?","괜찮아요?"]'::jsonb, '이해했어요?', 'Pergunta se a pessoa compreendeu.'),
    ('frases-basicas', 3, 7, 'verdadeiro_falso', '알겠어요 e 이해했어요 podem significar "entendi"?', null, '["Verdadeiro","Falso"]'::jsonb, 'Verdadeiro', 'Ambos expressam compreensao.'),
    ('frases-basicas', 3, 8, 'multipla_escolha', 'Como dizer "O que voce disse?"', '뭐라고요? (mworagoyo?)', '["뭐라고요?","왜요?","어디요?"]'::jsonb, '뭐라고요?', 'Pede para a pessoa repetir.'),
    ('frases-basicas', 3, 9, 'coreano_para_portugues', 'O que significa 잘 모르겠어요?', '잘 모르겠어요', '["Nao tenho certeza / Nao sei bem","Entendi bem","Sei muito bem"]'::jsonb, 'Nao tenho certeza / Nao sei bem', '잘 adiciona nuance de nao ter certeza.'),
    ('frases-basicas', 3, 10, 'multipla_escolha', 'Como pedir para escrever algo?', '써 주세요 (sseo juseyo)', '["써 주세요","말해 주세요","읽어 주세요"]'::jsonb, '써 주세요', 'Util quando nao entender a fala.'),
    -- FRASES BASICAS - Missao 4
    ('frases-basicas', 4, 3, 'multipla_escolha', 'Como dizer "Eu amo"?', '사랑해요 (saranghaeyo)', '["사랑해요","좋아해요","싫어요"]'::jsonb, '사랑해요', 'Expressa amor, muito usada em doramas tambem.'),
    ('frases-basicas', 4, 4, 'coreano_para_portugues', 'O que significa 맛있어요?', '맛있어요 (masisseoyo)', '["E gostoso / delicioso","E bonito","E divertido"]'::jsonb, 'E gostoso / delicioso', 'Essencial na hora de comer.'),
    ('frases-basicas', 4, 5, 'multipla_escolha', 'Qual e o oposto de 맛있어요 (gostoso)?', '맛없어요 (madeopseoyo)', '["맛없어요","맛있어요","배고파요"]'::jsonb, '맛없어요', 'Cuidado ao usar, pode ser rude.'),
    ('frases-basicas', 4, 6, 'portugues_para_coreano', 'Como se diz "E divertido / legal"?', '재미있어요 (jaemiisseoyo)', '["재미있어요","좋아요","맛있어요"]'::jsonb, '재미있어요', 'Bom para falar de filmes, doramas etc.'),
    ('frases-basicas', 4, 7, 'verdadeiro_falso', '좋아해요 e mais especifico que 좋아요 para dizer que gosta de algo?', null, '["Verdadeiro","Falso"]'::jsonb, 'Verdadeiro', '좋아해요 e um verbo (gostar de), 좋아요 e adjetivo (e bom).'),
    ('frases-basicas', 4, 8, 'multipla_escolha', 'Como dizer "E bonito(a)"?', '예뻐요 (yeppeoyo)', '["예뻐요","맛있어요","좋아요"]'::jsonb, '예뻐요', 'Usado para pessoas e coisas bonitas.'),
    ('frases-basicas', 4, 9, 'coreano_para_portugues', 'O que significa 재미없어요?', '재미없어요 (jaemieopseoyo)', '["E chato / sem graca","E divertido","E gostoso"]'::jsonb, 'E chato / sem graca', 'Oposto de 재미있어요.'),
    ('frases-basicas', 4, 10, 'multipla_escolha', 'Como dizer "Eu quero..."?', '...하고 싶어요 (hago sipeoyo)', '["하고 싶어요","좋아해요","알아요"]'::jsonb, '하고 싶어요', 'Estrutura para expressar desejo.'),
    -- FRASES BASICAS - Missao 5
    ('frases-basicas', 5, 3, 'multipla_escolha', 'Como dizer "Mesmo?" ou "Serio?"', '정말요? (jeongmallyo?)', '["정말요?","괜찮아요?","뭐예요?"]'::jsonb, '정말요?', 'Mantem a conversa mostrando interesse.'),
    ('frases-basicas', 5, 4, 'coreano_para_portugues', 'O que significa 왜요?', '왜요? (waeyo?)', '["Por que?","O que?","Onde?"]'::jsonb, 'Por que?', 'Pergunta simples para entender motivos.'),
    ('frases-basicas', 5, 5, 'multipla_escolha', 'Como dizer "Eu tambem"?', '저도요 (jeodoyo)', '["저도요","저는요","뭐예요"]'::jsonb, '저도요', 'Cria conexao na conversa.'),
    ('frases-basicas', 5, 6, 'portugues_para_coreano', 'Como se diz "Que legal!"?', '멋있어요! (meossisseoyo!)', '["멋있어요!","맛있어요!","재미있어요!"]'::jsonb, '멋있어요!', 'Expressa admiracao por algo legal/estiloso.'),
    ('frases-basicas', 5, 7, 'verdadeiro_falso', '저도요 pode ser usado para concordar com algo que outra pessoa disse?', null, '["Verdadeiro","Falso"]'::jsonb, 'Verdadeiro', 'Significa eu tambem e mostra que compartilha da opiniao.'),
    ('frases-basicas', 5, 8, 'multipla_escolha', 'Como dizer "E depois?"', '그 다음에요? (geu daeumaeyo?)', '["그 다음에요?","왜요?","뭐예요?"]'::jsonb, '그 다음에요?', 'Incentiva a pessoa a contar mais.'),
    ('frases-basicas', 5, 9, 'coreano_para_portugues', 'O que significa 그래요?', '그래요 (geuraeyo)', '["E mesmo / Ah e?","Nao sei","Obrigada"]'::jsonb, 'E mesmo / Ah e?', 'Reacao natural que mostra atencao.'),
    ('frases-basicas', 5, 10, 'multipla_escolha', 'Como dizer "Concordo"?', '맞아요 (majayo)', '["맞아요","아니요","몰라요"]'::jsonb, '맞아요', 'Significa esta certo, concordo.'),
    -- DORAMAS - Missao 1
    ('doramas', 1, 3, 'multipla_escolha', 'Qual expressao significa "Rapido!" em tom urgente?', '빨리! (ppalli!)', '["빨리!","천천히","잠깐만요"]'::jsonb, '빨리!', 'Muito comum em cenas de acao.'),
    ('doramas', 1, 4, 'coreano_para_portugues', 'O que significa 아이고?', '아이고 (aigo)', '["Ai meu Deus / Nossa","Obrigada","Desculpa"]'::jsonb, 'Ai meu Deus / Nossa', 'Interjeicao universal dos doramas.'),
    ('doramas', 1, 5, 'multipla_escolha', 'Qual giria significa "fofo/bonitinho"?', '귀여워 (gwiyeowo)', '["귀여워","멋있어","무서워"]'::jsonb, '귀여워', 'Usado para coisas ou pessoas fofas.'),
    ('doramas', 1, 6, 'portugues_para_coreano', 'Como se diz "Estiloso / legal" em tom de admiracao?', '멋있어 (meossisseo)', '["멋있어","귀여워","대박"]'::jsonb, '멋있어', 'Elogio comum em doramas.'),
    ('doramas', 1, 7, 'verdadeiro_falso', '아이고 pode expressar tanto surpresa quanto cansaco?', null, '["Verdadeiro","Falso"]'::jsonb, 'Verdadeiro', 'Depende do tom e contexto.'),
    ('doramas', 1, 8, 'multipla_escolha', 'Qual expressao e usada para chamar alguem mais velho (homem)?', '오빠 (oppa)', '["오빠","언니","누나"]'::jsonb, '오빠', 'Usado por mulheres para homens mais velhos proximos.'),
    ('doramas', 1, 9, 'coreano_para_portugues', 'O que significa 화이팅?', '화이팅 (hwaiting)', '["Forca! / Voce consegue!","Cuidado!","Desista!"]'::jsonb, 'Forca! / Voce consegue!', 'Grito de encorajamento vindo do ingles fighting.'),
    ('doramas', 1, 10, 'multipla_escolha', 'Qual expressao significa "Chega! / Pare!"?', '그만! (geuman!)', '["그만!","빨리!","가자!"]'::jsonb, '그만!', 'Muito usado em cenas de conflito.'),
    -- DORAMAS - Missao 2
    ('doramas', 2, 3, 'multipla_escolha', 'Como dizer "Nao pode ser!" em tom dramatico?', '말도 안 돼! (maldo an dwae!)', '["말도 안 돼!","괜찮아요","감사합니다"]'::jsonb, '말도 안 돼!', 'Reacao classica de surpresa nos doramas.'),
    ('doramas', 2, 4, 'coreano_para_portugues', 'O que significa 미쳤어?', '미쳤어? (michyeosseo?)', '["Enlouqueceu? / Ficou louco?","Tudo bem?","Entendeu?"]'::jsonb, 'Enlouqueceu? / Ficou louco?', 'Reacao forte muito comum em doramas.'),
    ('doramas', 2, 5, 'multipla_escolha', 'Qual expressao exagerada significa "Vou morrer!" (de fome, cansaco etc)?', '죽겠어 (jukgesseo)', '["죽겠어","살겠어","괜찮아"]'::jsonb, '죽겠어', 'Exagero comico, nao literal.'),
    ('doramas', 2, 6, 'portugues_para_coreano', 'Como se diz "Que absurdo!" / "Que ridiculo!"?', '어이없어 (eoieopseo)', '["어이없어","대박","미쳤어"]'::jsonb, '어이없어', 'Expressa incredulidade e indignacao.'),
    ('doramas', 2, 7, 'verdadeiro_falso', '죽겠어 quando dito em doramas geralmente e um exagero comico?', null, '["Verdadeiro","Falso"]'::jsonb, 'Verdadeiro', 'E usado como hiperbole no dia a dia.'),
    ('doramas', 2, 8, 'multipla_escolha', 'Como reagir dizendo "Que vergonha!"?', '창피해 (changpihae)', '["창피해","대박","화이팅"]'::jsonb, '창피해', 'Expressa constrangimento.'),
    ('doramas', 2, 9, 'coreano_para_portugues', 'O que significa 헐?', '헐 (heol)', '["Nossa! / Nao acredito!","Ola","Tchau"]'::jsonb, 'Nossa! / Nao acredito!', 'Giria jovem para surpresa, como OMG.'),
    ('doramas', 2, 10, 'multipla_escolha', 'Qual expressao significa "Que chato!" ou "Que tedio!"?', '지루해 (jiruhae)', '["지루해","재미있어","신나"]'::jsonb, '지루해', 'Usado quando algo e entediante.'),
    -- DORAMAS - Missao 3
    ('doramas', 3, 3, 'multipla_escolha', 'Como dizer "Eu te amo"?', '사랑해 (saranghae)', '["사랑해","좋아해","보고 싶어"]'::jsonb, '사랑해', 'A declaracao mais intensa.'),
    ('doramas', 3, 4, 'coreano_para_portugues', 'O que significa 우리 사귈래?', '우리 사귈래? (uri sagwillae?)', '["Quer namorar comigo?","Quer sair comigo?","Voce me ama?"]'::jsonb, 'Quer namorar comigo?', 'O pedido de namoro classico dos doramas.'),
    ('doramas', 3, 5, 'multipla_escolha', 'Qual frase significa "Meu coracao esta batendo forte"?', '심장이 두근두근해 (simjangi dugeundugeunhae)', '["심장이 두근두근해","배고파요","머리 아파요"]'::jsonb, '심장이 두근두근해', 'Classica de cenas romanticas.'),
    ('doramas', 3, 6, 'portugues_para_coreano', 'Como se diz "Nao va embora"?', '가지 마 (gaji ma)', '["가지 마","빨리 가","잘 가"]'::jsonb, '가지 마', 'Frase dramatica de cenas de separacao.'),
    ('doramas', 3, 7, 'verdadeiro_falso', '좋아해 e menos intenso que 사랑해?', null, '["Verdadeiro","Falso"]'::jsonb, 'Verdadeiro', '좋아해 = gostar, 사랑해 = amar.'),
    ('doramas', 3, 8, 'multipla_escolha', 'Qual expressao significa "Voce e especial para mim"?', '넌 나한테 특별해 (neon nahante teukbyeolhae)', '["넌 나한테 특별해","넌 예뻐","넌 멋있어"]'::jsonb, '넌 나한테 특별해', 'Declaracao romantica comum.'),
    ('doramas', 3, 9, 'coreano_para_portugues', 'O que significa 나만 바라봐?', '나만 바라봐 (naman barabwa)', '["Olhe so para mim","Olhe para la","Nao me olhe"]'::jsonb, 'Olhe so para mim', 'Frase possessiva/romantica de doramas.'),
    ('doramas', 3, 10, 'multipla_escolha', 'Como dizer "Eu penso em voce o tempo todo"?', '항상 네 생각해 (hangsang ne saenggakhae)', '["항상 네 생각해","가지 마","사랑해"]'::jsonb, '항상 네 생각해', 'Expressa pensamento constante na pessoa.'),
    -- DORAMAS - Missao 4
    ('doramas', 4, 3, 'multipla_escolha', 'Como dizer "Impossivel!" com indignacao?', '말도 안 돼! (maldo an dwae!)', '["말도 안 돼!","진짜?","대박!"]'::jsonb, '말도 안 돼!', 'Literalmente isso nem faz sentido.'),
    ('doramas', 4, 4, 'coreano_para_portugues', 'O que significa 어떡해?', '어떡해 (eotteokae)', '["O que eu faco? / E agora?","O que e isso?","Quem e voce?"]'::jsonb, 'O que eu faco? / E agora?', 'Expressa desespero ou preocupacao.'),
    ('doramas', 4, 5, 'multipla_escolha', 'Qual expressao significa "Cuidado!"?', '조심해! (josimhae!)', '["조심해!","빨리!","그만!"]'::jsonb, '조심해!', 'Aviso urgente muito usado em doramas.'),
    ('doramas', 4, 6, 'portugues_para_coreano', 'Como se diz "Estou com raiva"?', '화났어 (hwanasseo)', '["화났어","슬퍼","기뻐"]'::jsonb, '화났어', 'Expressa raiva ou irritacao.'),
    ('doramas', 4, 7, 'verdadeiro_falso', '어떡해 pode ser dito tanto em situacoes serias quanto comicas?', null, '["Verdadeiro","Falso"]'::jsonb, 'Verdadeiro', 'Depende do contexto e tom da cena.'),
    ('doramas', 4, 8, 'multipla_escolha', 'Como dizer "Estou decepcionado(a)"?', '실망했어 (silmanghesseo)', '["실망했어","화났어","슬퍼"]'::jsonb, '실망했어', 'Muito comum em cenas de confronto.'),
    ('doramas', 4, 9, 'coreano_para_portugues', 'O que significa 무서워?', '무서워 (museowo)', '["Estou com medo / E assustador","Estou com raiva","Estou triste"]'::jsonb, 'Estou com medo / E assustador', 'Expressa medo ou susto.'),
    ('doramas', 4, 10, 'multipla_escolha', 'Qual frase expressa arrependimento: "Eu nao devia ter feito isso"?', '그러지 말걸 (geureoji malgeol)', '["그러지 말걸","어떡해","미안해"]'::jsonb, '그러지 말걸', 'Frase de arrependimento dramatica.'),
    -- DORAMAS - Missao 5
    ('doramas', 5, 3, 'multipla_escolha', 'O que significa "야!" gritado em doramas?', '야! (ya!)', '["Ei! (chamando atencao, informal)","Sim!","Nao!"]'::jsonb, '야!', 'Interjeicao para chamar alguem ou expressar indignacao.'),
    ('doramas', 5, 4, 'coreano_para_portugues', 'O que significa 알았어?', '알았어 (arasseo)', '["Entendi / OK / Ta bom","Nao sei","Desculpa"]'::jsonb, 'Entendi / OK / Ta bom', 'Resposta rapida de concordancia.'),
    ('doramas', 5, 5, 'multipla_escolha', 'Qual frase curta significa "Saiam do caminho!"?', '비켜! (bikyeo!)', '["비켜!","가자!","앉아!"]'::jsonb, '비켜!', 'Dita em cenas de pressa ou tensao.'),
    ('doramas', 5, 6, 'portugues_para_coreano', 'Como se diz "Cala a boca" (informal)?', '닥쳐 (dakchyeo)', '["닥쳐","말해","들어"]'::jsonb, '닥쳐', 'Muito rude, so em doramas e entre amigos muito intimos.'),
    ('doramas', 5, 7, 'verdadeiro_falso', '야 e considerado informal e pode ser rude se usado com estranhos?', null, '["Verdadeiro","Falso"]'::jsonb, 'Verdadeiro', 'Deve ser usado apenas com pessoas proximas ou mais novas.'),
    ('doramas', 5, 8, 'multipla_escolha', 'Qual frase curta significa "Eu disse que nao!"?', '싫다고! (siltago!)', '["싫다고!","좋아!","알았어!"]'::jsonb, '싫다고!', 'Recusa enfatica muito dramatica.'),
    ('doramas', 5, 9, 'coreano_para_portugues', 'O que significa 잠깐?', '잠깐 (jamkkan)', '["Espera / Um momento","Tchau","Rapido"]'::jsonb, 'Espera / Um momento', 'Versao curta de 잠깐만요.'),
    ('doramas', 5, 10, 'multipla_escolha', 'Qual frase curta expressa "Sai daqui!" de forma dramatica?', '나가! (naga!)', '["나가!","들어와!","앉아!"]'::jsonb, '나가!', 'Cena classica de expulsar alguem do quarto ou sala.')
) as q(trilha_slug, missao_ordem, ordem, tipo, enunciado, enunciado_coreano, opcoes, resposta_correta, explicacao)
on t.slug = q.trilha_slug
where m.trilha_id = t.id
  and m.ordem = q.missao_ordem
and not exists (
  select 1
  from public.questoes existing
  where existing.missao_id = m.id
    and existing.ordem = q.ordem
);
