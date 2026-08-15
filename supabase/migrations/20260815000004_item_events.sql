-- Trilha de eventos: quem fez o quê, quando.
--
-- Serve a dois propósitos de uma vez — é a auditoria e é a linha do tempo que
-- aparece no painel do item ("Você adicionou · 14/08", "Maria marcou como
-- comprado · 20/08").

create table item_events (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  actor uuid references auth.users(id) on delete set null default auth.uid(),
  type text not null,
  from_value text,
  to_value text,
  -- Detalhes livres do evento (motivo da devolução, loja, o que for).
  payload jsonb,
  created_at timestamptz not null default now()
);

create index item_events_item_created_at_idx on item_events (item_id, created_at desc);

alter table item_events enable row level security;

grant select, insert on item_events to authenticated;

create policy "Autenticado lê eventos" on item_events for select to authenticated using (true);

create policy "Autenticado registra eventos" on item_events
  for insert to authenticated with check (actor = auth.uid());

-- Sem update nem delete: trilha que dá para reescrever não é trilha.

-- ─── Registro automático ────────────────────────────────────────────────────
-- Criação e mudança de estado são gravadas por trigger, não pelo app. Auditoria
-- que depende do cliente lembrar de chamar é auditoria que vai ter buracos.
-- Eventos mais ricos (preço registrado, devolução com motivo) o app insere
-- por cima destes.

create or replace function public.log_item_event()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.item_events (item_id, actor, type, to_value)
    values (new.id, new.created_by, 'created', new.status);
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.item_events (item_id, actor, type, from_value, to_value)
    values (new.id, auth.uid(), 'status_changed', old.status, new.status);
  end if;

  if new.deleted_at is distinct from old.deleted_at then
    insert into public.item_events (item_id, actor, type, to_value)
    values (
      new.id,
      auth.uid(),
      case when new.deleted_at is null then 'restored' else 'deleted' end,
      new.status
    );
  end if;

  return new;
end;
$$;

create trigger items_log_event
  after insert or update on items
  for each row execute function public.log_item_event();
