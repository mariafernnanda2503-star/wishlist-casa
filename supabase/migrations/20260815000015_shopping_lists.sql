-- Lista de compras: o mesmo espaço, listas de outro tipo.
--
-- Desejo e mercado são ciclos opostos. No desejo, comprar **encerra** o item.
-- No mercado, comprar **reinicia** — o arroz volta semana que vem. Por isso a
-- ida ao mercado vira um registro fechado (o que levou, de onde, por quanto) e
-- a lista volta ao estado inicial.
--
-- Módulo separado duplicaria espaços, participantes, convites, realtime e RLS,
-- que são idênticos nos dois. O que muda é a tela, não a infraestrutura.

alter table lists
  add column kind text not null default 'wishlist'
  check (kind in ('wishlist', 'shopping'));

-- ─── Quantidade com unidade ─────────────────────────────────────────────────
-- "2,5 kg" não cabe em inteiro. `numeric` preserva os valores que já existem.
alter table items alter column quantity type numeric(10, 3);
alter table items add column unit text;

-- ─── A ida ao mercado ───────────────────────────────────────────────────────
create table shopping_trips (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references lists(id) on delete cascade,
  store text,
  shopped_at timestamptz not null default now(),
  note text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index shopping_trips_list_idx on shopping_trips (list_id, shopped_at desc);

/**
 * O que foi levado, congelado no momento da compra.
 *
 * `name`, `quantity` e `unit` são cópia e não referência: a lista se repete
 * toda semana e os itens são renomeados e apagados. Histórico que muda quando
 * alguém edita a lista não é histórico.
 *
 * `item_id` fica só para ligar de volta quando o item ainda existir — é nulo
 * nos avulsos, aquilo que se compra sem estar na lista.
 */
create table shopping_trip_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references shopping_trips(id) on delete cascade,
  item_id uuid references items(id) on delete set null,
  name text not null,
  quantity numeric(10, 3) not null default 1,
  unit text,
  unit_price numeric(10, 2),
  created_at timestamptz not null default now()
);

create index shopping_trip_items_trip_idx on shopping_trip_items (trip_id);

/** Total da ida, somado das linhas. Linha sem preço não entra. */
create view shopping_trip_totals
with (security_invoker = on) as
select
  trip_id,
  sum(coalesce(unit_price, 0) * quantity)::numeric(12, 2) as total,
  count(*)::int as line_count,
  count(unit_price)::int as priced_count
from shopping_trip_items
group by trip_id;

-- ─── Policies ───────────────────────────────────────────────────────────────
alter table shopping_trips enable row level security;
alter table shopping_trip_items enable row level security;

grant select, insert, update, delete on shopping_trips to authenticated;
grant select, insert, update, delete on shopping_trip_items to authenticated;
grant select on shopping_trip_totals to authenticated;

create policy "Participante lê compras" on shopping_trips
  for select to authenticated using (private.can_access_list(list_id));

create policy "Participante registra compra" on shopping_trips
  for insert to authenticated with check (private.can_access_list(list_id));

create policy "Participante corrige compra" on shopping_trips
  for update to authenticated
  using (private.can_access_list(list_id))
  with check (private.can_access_list(list_id));

create policy "Participante remove compra" on shopping_trips
  for delete to authenticated using (private.can_access_list(list_id));

/** Acesso à linha segue o acesso à ida a que ela pertence. */
create or replace function private.can_access_trip(trip uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.shopping_trips t
    join public.lists l on l.id = t.list_id
    join public.workspace_members m on m.workspace_id = l.workspace_id
    where t.id = trip and m.user_id = (select auth.uid())
  );
$$;

revoke all on function private.can_access_trip(uuid) from public;
grant execute on function private.can_access_trip(uuid) to authenticated;

create policy "Participante lê linhas" on shopping_trip_items
  for select to authenticated using (private.can_access_trip(trip_id));

create policy "Participante registra linhas" on shopping_trip_items
  for insert to authenticated with check (private.can_access_trip(trip_id));

create policy "Participante corrige linhas" on shopping_trip_items
  for update to authenticated
  using (private.can_access_trip(trip_id))
  with check (private.can_access_trip(trip_id));

create policy "Participante remove linhas" on shopping_trip_items
  for delete to authenticated using (private.can_access_trip(trip_id));

alter publication supabase_realtime add table shopping_trips;
