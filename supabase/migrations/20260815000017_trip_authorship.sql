-- Autoria e trilha da ida ao mercado.
--
-- `created_by` já existia e já vinha preenchido, mas parava aí: as policies
-- deixam qualquer participante corrigir a loja, a data ou o preço de uma linha
-- e nada registrava. Numa lista de família, corrigir o total da compra do outro
-- sem deixar rastro é o tipo de coisa que só se descobre discutindo.

alter table shopping_trips
  add column updated_at timestamptz not null default now(),
  add column updated_by uuid references auth.users(id) on delete set null;

-- As idas que já existiam nunca foram corrigidas, mas o `default now()` as
-- carimbaria com o instante da migration — e a tela leria isso como correção
-- de autor desconhecido. Nasce igual à criação: só um update de verdade separa
-- as duas datas.
update shopping_trips set updated_at = created_at;

/** Mesmo papel de `touch_item()`: carimba quem mexeu por último. */
create or replace function public.touch_trip()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

create trigger shopping_trips_touch
  before update on shopping_trips
  for each row execute function public.touch_trip();

-- ─── Trilha ─────────────────────────────────────────────────────────────────
-- Tabela própria em vez de reaproveitar `item_events`: aquela referencia
-- `items`, e uma ida ao mercado não é um item. O formato é o mesmo de
-- propósito, para a tela ler as duas do mesmo jeito.

create table trip_events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references shopping_trips(id) on delete cascade,
  actor uuid references auth.users(id) on delete set null default auth.uid(),
  type text not null,
  from_value text,
  to_value text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index trip_events_trip_created_at_idx on trip_events (trip_id, created_at desc);

alter table trip_events enable row level security;

grant select, insert on trip_events to authenticated;

create policy "Participante lê trilha da compra" on trip_events
  for select to authenticated using (private.can_access_trip(trip_id));

create policy "Participante registra trilha da compra" on trip_events
  for insert to authenticated with check (actor = (select auth.uid()));

-- Sem update nem delete: trilha que dá para reescrever não é trilha.

create or replace function public.log_trip_event()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.trip_events (trip_id, actor, type, to_value)
    values (new.id, new.created_by, 'created', new.store);
    return new;
  end if;

  if new.store is distinct from old.store then
    insert into public.trip_events (trip_id, actor, type, from_value, to_value)
    values (new.id, auth.uid(), 'store_changed', old.store, new.store);
  end if;

  if new.shopped_at is distinct from old.shopped_at then
    insert into public.trip_events (trip_id, actor, type, from_value, to_value)
    values (new.id, auth.uid(), 'date_changed', old.shopped_at::text, new.shopped_at::text);
  end if;

  if new.note is distinct from old.note then
    insert into public.trip_events (trip_id, actor, type, from_value, to_value)
    values (new.id, auth.uid(), 'note_changed', old.note, new.note);
  end if;

  return new;
end;
$$;

create trigger shopping_trips_log_event
  after insert or update on shopping_trips
  for each row execute function public.log_trip_event();

/**
 * Corrigir o preço de uma linha depois da compra é a alteração mais provável de
 * todas — é ela que muda o total. `payload` guarda o nome da linha porque a
 * linha some quando é removida, e trilha que aponta para o vazio não conta nada.
 */
create or replace function public.log_trip_line_event()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_trip uuid := coalesce(new.trip_id, old.trip_id);
  v_created timestamptz;
begin
  select created_at into v_created from public.shopping_trips where id = v_trip;

  -- Numa exclusão em cascata a ida já não existe: não há o que auditar, e o
  -- insert violaria a chave estrangeira.
  if v_created is null then
    return coalesce(new, old);
  end if;

  -- As linhas do fechamento não são correção, são a própria compra: o evento
  -- `created` já as cobre, e uma ida de trinta itens viraria trinta eventos.
  -- `now()` é o instante de início da transação, então ele é exatamente igual
  -- ao `created_at` da ida enquanto se está fechando, e maior depois disso.
  if v_created = now() then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    insert into public.trip_events (trip_id, actor, type, to_value, payload)
    values (v_trip, auth.uid(), 'line_added', new.unit_price::text,
            jsonb_build_object('name', new.name));
    return new;
  end if;

  if tg_op = 'DELETE' then
    insert into public.trip_events (trip_id, actor, type, from_value, payload)
    values (v_trip, auth.uid(), 'line_removed', old.unit_price::text,
            jsonb_build_object('name', old.name));
    return old;
  end if;

  if new.unit_price is distinct from old.unit_price
     or new.quantity is distinct from old.quantity then
    insert into public.trip_events (trip_id, actor, type, from_value, to_value, payload)
    values (
      v_trip, auth.uid(), 'line_changed',
      concat_ws(' x ', old.quantity::text, old.unit_price::text),
      concat_ws(' x ', new.quantity::text, new.unit_price::text),
      jsonb_build_object('name', new.name)
    );
  end if;

  return new;
end;
$$;

create trigger shopping_trip_items_log_event
  after insert or update or delete on shopping_trip_items
  for each row execute function public.log_trip_line_event();
