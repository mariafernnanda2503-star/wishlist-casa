-- Rode este SQL no Supabase: painel do projeto > SQL Editor > New query > Run
-- Use este arquivo se você já rodou o supabase-schema.sql original (só a tabela items).
-- Ele adiciona área e categoria sem apagar os itens que você já tiver cadastrado.

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

alter table items add column area_id uuid references areas(id) on delete set null;
alter table items add column category_id uuid references categories(id) on delete set null;

alter table areas enable row level security;
alter table categories enable row level security;

create policy "Acesso público de leitura e escrita" on areas for all using (true) with check (true);
create policy "Acesso público de leitura e escrita" on categories for all using (true) with check (true);

alter publication supabase_realtime add table areas;
alter publication supabase_realtime add table categories;

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
