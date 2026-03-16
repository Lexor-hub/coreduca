-- Tabela para rastrear o interesse (cliques simulando compras sem estoque)
create table if not exists public.store_clicks (
    id uuid primary key default gen_random_uuid(),
    item_id uuid not null references public.store_items(id) on delete cascade,
    user_id uuid references auth.users(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.store_clicks enable row level security;

-- Politicas
-- Qualquer usuario logado pode registrar um clique (marcar interesse)
create policy "Usuarios autenticados podem registrar cliques"
    on public.store_clicks for insert
    to authenticated
    with check (true);

-- Apenas admins podem ler as estatísticas de clique do e-commerce
create policy "Admins podem ver todos os cliques da store"
    on public.store_clicks for select
    to authenticated
    using (
        exists (
            select 1 from public.profiles
            where id = auth.uid() and is_admin = true
        )
    );

-- Criar indice para otimizar a contagem de cliques por item
create index if not exists store_clicks_item_id_idx on public.store_clicks(item_id);
create index if not exists store_clicks_created_at_idx on public.store_clicks(created_at desc);
