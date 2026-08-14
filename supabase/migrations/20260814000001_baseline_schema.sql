-- Baseline: consolida o schema que já existe no projeto remoto, montado antes
-- do CLI entrar no projeto (supabase-schema.sql + as migrations 2 a 5 soltas).
--
-- No banco remoto este arquivo NÃO deve rodar de novo — marque-o como aplicado:
--   supabase migration repair --status applied 20260814000001
-- No banco local ele roda normalmente via `pnpm db:reset`.

create table if not exists areas (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10, 2),
  quantity int not null default 1,
  priority text not null default 'media' check (priority in ('alta', 'media', 'baixa')),
  link text,
  note text,
  status text not null default 'pending' check (status in ('pending', 'purchased')),
  area_id uuid references areas(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  created_at timestamptz not null default now(),
  purchased_at timestamptz
);

-- Filtros e ordenação da listagem batem nestas colunas.
create index if not exists items_status_created_at_idx on items (status, created_at desc);
create index if not exists items_area_id_idx on items (area_id);
create index if not exists items_category_id_idx on items (category_id);

alter table areas enable row level security;
alter table categories enable row level security;
alter table items enable row level security;

-- Acesso aberto a quem tiver a anon key. A migration seguinte substitui isto
-- por acesso restrito a usuário autenticado.
create policy "Acesso público de leitura e escrita" on areas for all using (true) with check (true);
create policy "Acesso público de leitura e escrita" on categories for all using (true) with check (true);
create policy "Acesso público de leitura e escrita" on items for all using (true) with check (true);

-- Realtime: mudança feita num dispositivo aparece no outro sem refresh.
alter publication supabase_realtime add table areas;
alter publication supabase_realtime add table categories;
alter publication supabase_realtime add table items;
