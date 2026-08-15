-- Ciclo de vida, autoria e exclusão reversível.
--
-- Os estados são um vocabulário, não um funil: nada aqui obriga a passar por
-- `purchased` antes de `owned`, nem impede voltar atrás. Quem decide o caminho
-- é quem usa a lista. Pelo mesmo motivo toda coluna nova é opcional — quem só
-- quer marcar "comprei" continua marcando "comprei" e ignorando o resto.

-- ─── Estados ────────────────────────────────────────────────────────────────
alter table items drop constraint if exists items_status_check;

update items set status = 'wanted' where status = 'pending';

alter table items
  add constraint items_status_check
  check (status in ('wanted', 'purchased', 'owned', 'archived'));

alter table items alter column status set default 'wanted';

-- Marcos. `purchased_at` já existia e segue significando "quando pagou";
-- `owned_at` é quando a coisa chegou em casa. Devolução não vira estado: o
-- item volta para `wanted` e o motivo fica na trilha de eventos.
alter table items add column if not exists owned_at timestamptz;
alter table items add column if not exists archived_at timestamptz;

-- Item que se repõe (ração, filtro, lâmpada): comprar não encerra, reinicia.
-- Quem só está montando a casa nunca marca isto.
alter table items add column if not exists is_recurring boolean not null default false;

-- ─── Depois da compra ───────────────────────────────────────────────────────
-- `purchased_price` é o que foi pago de fato, diferente de `price`, que é a
-- estimativa de referência.
alter table items add column if not exists purchased_price numeric(10, 2);
alter table items add column if not exists purchased_store text;
alter table items add column if not exists warranty_until date;
alter table items add column if not exists receipt_url text;

-- ─── Autoria ────────────────────────────────────────────────────────────────
alter table items add column if not exists created_by uuid references auth.users(id) on delete set null default auth.uid();
alter table items add column if not exists updated_by uuid references auth.users(id) on delete set null;
-- "eu cuido de comprar esse" — evita os dois comprarem a mesma coisa.
alter table items add column if not exists claimed_by uuid references auth.users(id) on delete set null;
alter table items add column if not exists purchased_by uuid references auth.users(id) on delete set null;

-- ─── Carimbo de alteração ───────────────────────────────────────────────────
alter table items add column if not exists updated_at timestamptz not null default now();

create or replace function public.touch_item()
returns trigger
language plpgsql
-- search_path vazio evita que um schema no caminho sequestre as chamadas.
-- `now()` vive em pg_catalog, que é sempre consultado.
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  -- Quem criou não muda. Sem isto, um update poderia reescrever a autoria.
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  return new;
end;
$$;

create trigger items_touch
  before update on items
  for each row execute function public.touch_item();

-- ─── Exclusão reversível ────────────────────────────────────────────────────
-- Apagar de vez levaria junto o histórico de preço e o registro de que vocês
-- já quiseram aquilo.
alter table items add column if not exists deleted_at timestamptz;

-- Área e categoria hoje são `on delete set null`: apagar a área "Cozinha"
-- zeraria em silêncio a área de todos os itens dela. Arquivar some dos
-- seletores e preserva o que já estava classificado.
alter table areas add column if not exists archived_at timestamptz;
alter table categories add column if not exists archived_at timestamptz;

create index if not exists items_active_idx on items (status) where deleted_at is null;

-- ─── Policies ───────────────────────────────────────────────────────────────
-- A policy única de antes (`for all`) não conseguia distinguir inserção de
-- edição, e é só na inserção que faz sentido exigir a autoria própria: quem
-- edita pode ser a outra pessoa.
drop policy if exists "Autenticado gerencia itens" on items;

create policy "Autenticado lê itens" on items for select to authenticated using (true);

create policy "Autenticado cria itens" on items
  for insert to authenticated with check (created_by = auth.uid());

create policy "Autenticado edita itens" on items
  for update to authenticated using (true) with check (true);

create policy "Autenticado remove itens" on items for delete to authenticated using (true);
