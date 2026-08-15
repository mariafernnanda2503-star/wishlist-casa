-- Workspaces, listas e participantes.
--
-- Até aqui o app assumia uma única lista de uma única casa: qualquer usuário
-- autenticado via tudo. Isso passa a ser um caso particular — um workspace com
-- uma lista e dois participantes.
--
-- Hierarquia: workspace → lista → item. Grupos e tipos ficam no **workspace**,
-- não na lista: "Cozinha" e "Eletrodoméstico" servem a todas as listas da mesma
-- casa, e recriá-los por lista seria trabalho repetido para quem usa.

create schema if not exists private;

-- ─── Tabelas ────────────────────────────────────────────────────────────────
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- `owner` pode remover participantes e apagar o workspace; `member` usa.
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index workspace_members_user_idx on workspace_members (user_id);

create table lists (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lists_workspace_idx on lists (workspace_id) where archived_at is null;

-- ─── Vínculos nas tabelas existentes ────────────────────────────────────────
-- Nulos por enquanto; viram obrigatórios depois do backfill.
alter table items add column list_id uuid references lists(id) on delete cascade;
alter table item_groups add column workspace_id uuid references workspaces(id) on delete cascade;
alter table item_types add column workspace_id uuid references workspaces(id) on delete cascade;

-- ─── Migração dos dados existentes ──────────────────────────────────────────
do $$
-- Os nomes levam sufixo porque em PL/pgSQL uma variável com o mesmo nome de
-- uma coluna a sombreia: `set list_id = list_id` viraria a coluna consigo
-- mesma, e o backfill passaria em silêncio sem fazer nada.
declare
  v_workspace_id uuid;
  v_list_id uuid;
  v_first_user uuid;
begin
  -- O criador é a conta mais antiga: quem montou a casa.
  select id into v_first_user from auth.users order by created_at limit 1;

  insert into workspaces (name, created_by)
  values ('Casa', v_first_user)
  returning id into v_workspace_id;

  insert into lists (workspace_id, name, created_by)
  values (v_workspace_id, 'Lista de desejos', v_first_user)
  returning id into v_list_id;

  -- Todo mundo que já usava continua com acesso; o primeiro vira dono.
  insert into workspace_members (workspace_id, user_id, role)
  select v_workspace_id, id, case when id = v_first_user then 'owner' else 'member' end
  from auth.users
  on conflict do nothing;

  update items set list_id = v_list_id where list_id is null;
  update item_groups set workspace_id = v_workspace_id where workspace_id is null;
  update item_types set workspace_id = v_workspace_id where workspace_id is null;
end $$;

alter table items alter column list_id set not null;
alter table item_groups alter column workspace_id set not null;
alter table item_types alter column workspace_id set not null;

create index items_list_idx on items (list_id) where deleted_at is null;

-- Nome único por workspace, não globalmente: duas casas podem ter "Cozinha".
alter table item_groups drop constraint if exists item_groups_name_key;
alter table item_types drop constraint if exists item_types_name_key;
create unique index item_groups_workspace_name_key on item_groups (workspace_id, name);
create unique index item_types_workspace_name_key on item_types (workspace_id, name);

-- ─── Helpers de autorização ─────────────────────────────────────────────────
-- Ficam em `private` e com `security definer` por dois motivos: a policy de
-- `workspace_members` consultaria a própria tabela e entraria em recursão, e o
-- client não deve poder chamar isto direto.

create or replace function private.is_workspace_member(workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = workspace and m.user_id = (select auth.uid())
  );
$$;

create or replace function private.is_workspace_owner(workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = workspace
      and m.user_id = (select auth.uid())
      and m.role = 'owner'
  );
$$;

create or replace function private.can_access_list(list uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.lists l
    join public.workspace_members m on m.workspace_id = l.workspace_id
    where l.id = list and m.user_id = (select auth.uid())
  );
$$;

/** Usado por price_checks e item_events, que só conhecem o item. */
create or replace function private.can_access_item(item uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.items i
    join public.lists l on l.id = i.list_id
    join public.workspace_members m on m.workspace_id = l.workspace_id
    where i.id = item and m.user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_workspace_member(uuid) from public;
revoke all on function private.is_workspace_owner(uuid) from public;
revoke all on function private.can_access_list(uuid) from public;
revoke all on function private.can_access_item(uuid) from public;
grant execute on function private.is_workspace_member(uuid) to authenticated;
grant execute on function private.is_workspace_owner(uuid) to authenticated;
grant execute on function private.can_access_list(uuid) to authenticated;
grant execute on function private.can_access_item(uuid) to authenticated;
