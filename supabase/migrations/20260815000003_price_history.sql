-- Histórico de preços e faixa aceitável.
--
-- `items.price` continua sendo a estimativa de referência que a pessoa digita.
-- O que muda é que cada preço *observado* passa a ser uma linha aqui, em vez de
-- sobrescrever o anterior e sumir. São coisas diferentes: uma é o palpite, a
-- outra é a medição.

create table price_checks (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  price numeric(10, 2) not null check (price >= 0),
  store text,
  url text,
  -- Como o preço chegou aqui: digitado, lido do link colado, ou coletado por
  -- rotina automática. Separar isso permite confiar mais numa origem que outra.
  source text not null default 'manual' check (source in ('manual', 'link', 'auto')),
  checked_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null default auth.uid()
);

-- Toda consulta é "o histórico deste item, do mais recente para o mais antigo".
create index price_checks_item_checked_at_idx on price_checks (item_id, checked_at desc);

alter table price_checks enable row level security;

grant select, insert, delete on price_checks to authenticated;

create policy "Autenticado lê preços" on price_checks for select to authenticated using (true);

create policy "Autenticado registra preços" on price_checks
  for insert to authenticated with check (created_by = auth.uid());

-- Sem policy de update de propósito: observação é imutável. Se está errada,
-- some com ela — corrigir reescreveria o passado.
create policy "Autenticado remove preços" on price_checks for delete to authenticated using (true);

alter publication supabase_realtime add table price_checks;

-- Faixa aceitável: "vale a pena abaixo disso". Opcional — quem não usa, ignora.
alter table items add column if not exists price_target numeric(10, 2);

-- Semeia o histórico com o preço que cada item já tinha, senão todo gráfico
-- nasce vazio e o recurso parece quebrado no primeiro uso. `created_at` do item
-- é a melhor data que temos para essa observação.
insert into price_checks (item_id, price, source, checked_at)
select id, price, 'manual', created_at
from items
where price is not null;
