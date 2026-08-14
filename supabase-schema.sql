-- Rode este SQL no Supabase: painel do projeto > SQL Editor > New query > Run
-- Este arquivo reflete o estado ATUAL desejado do banco. Se você já rodou uma
-- versão anterior, use supabase-migration-2-categorias.sql em vez deste.

create table areas (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

create table items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10, 2),
  quantity int not null default 1,
  link text,
  note text,
  status text not null default 'pending' check (status in ('pending', 'purchased')),
  area_id uuid references areas(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  created_at timestamptz not null default now(),
  purchased_at timestamptz
);

-- Row Level Security: por padrão o Supabase bloqueia tudo até criarmos uma policy.
-- Como não temos login de usuário (é só você e seu namorado, via link), liberamos
-- leitura e escrita pra quem tiver a anon key -- que é o app em si.
alter table areas enable row level security;
alter table categories enable row level security;
alter table items enable row level security;

create policy "Acesso público de leitura e escrita" on areas for all using (true) with check (true);
create policy "Acesso público de leitura e escrita" on categories for all using (true) with check (true);
create policy "Acesso público de leitura e escrita" on items for all using (true) with check (true);

-- Habilita realtime (mudanças feitas por um dispositivo aparecem no outro sem refresh)
alter publication supabase_realtime add table areas;
alter publication supabase_realtime add table categories;
alter publication supabase_realtime add table items;

-- Listas fixas: você decide o que existe aqui, o app só oferece estas opções.
insert into areas (name, sort_order) values
  ('Cozinha', 1),
  ('Banheiro', 2),
  ('Quarto', 3),
  ('Pet', 4),
  ('Casa (geral)', 5);

insert into categories (name, sort_order) values
  ('Utensílio', 1),
  ('Eletrodoméstico', 2),
  ('Organização', 3),
  ('Têxtil', 4),
  ('Decoração/Reforma', 5),
  ('Higiene & Saúde', 6),
  ('Acessório Pet', 7);
