-- Reescreve a RLS: de "qualquer autenticado vê tudo" para "vê o que pertence a
-- um workspace do qual participa".
--
-- Até aqui bastava estar logado. Com várias contas isso vazaria a lista de uma
-- casa para outra — as policies antigas precisam sair, não conviver.

-- ─── workspaces ─────────────────────────────────────────────────────────────
alter table workspaces enable row level security;
grant select, insert, update, delete on workspaces to authenticated;

create policy "Participante lê workspace" on workspaces
  for select to authenticated using (private.is_workspace_member(id));

-- Qualquer autenticado cria o próprio workspace; o trigger abaixo o inscreve
-- como dono na mesma transação.
create policy "Autenticado cria workspace" on workspaces
  for insert to authenticated with check (created_by = (select auth.uid()));

create policy "Dono edita workspace" on workspaces
  for update to authenticated
  using (private.is_workspace_owner(id))
  with check (private.is_workspace_owner(id));

create policy "Dono remove workspace" on workspaces
  for delete to authenticated using (private.is_workspace_owner(id));

/**
 * Sem isto, criar um workspace deixaria a pessoa de fora dele: a policy de
 * `workspace_members` exige ser participante para inserir, e ainda não é.
 */
create or replace function public.add_workspace_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, coalesce(new.created_by, auth.uid()), 'owner')
  on conflict do nothing;
  return new;
end;
$$;

create trigger workspaces_add_owner
  after insert on workspaces
  for each row execute function public.add_workspace_owner();

-- ─── workspace_members ──────────────────────────────────────────────────────
alter table workspace_members enable row level security;
grant select, insert, update, delete on workspace_members to authenticated;

create policy "Participante lê participantes" on workspace_members
  for select to authenticated using (private.is_workspace_member(workspace_id));

create policy "Dono adiciona participante" on workspace_members
  for insert to authenticated with check (private.is_workspace_owner(workspace_id));

create policy "Dono altera participante" on workspace_members
  for update to authenticated
  using (private.is_workspace_owner(workspace_id))
  with check (private.is_workspace_owner(workspace_id));

-- Dono remove quem quiser; qualquer um pode sair sozinho.
create policy "Dono remove ou participante sai" on workspace_members
  for delete to authenticated
  using (private.is_workspace_owner(workspace_id) or user_id = (select auth.uid()));

-- ─── lists ──────────────────────────────────────────────────────────────────
alter table lists enable row level security;
grant select, insert, update, delete on lists to authenticated;

create policy "Participante lê listas" on lists
  for select to authenticated using (private.is_workspace_member(workspace_id));

create policy "Participante cria lista" on lists
  for insert to authenticated with check (private.is_workspace_member(workspace_id));

create policy "Participante edita lista" on lists
  for update to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));

create policy "Participante remove lista" on lists
  for delete to authenticated using (private.is_workspace_member(workspace_id));

-- ─── item_groups / item_types ───────────────────────────────────────────────
drop policy if exists "Autenticado lê grupos" on item_groups;
drop policy if exists "Autenticado cria grupos" on item_groups;
drop policy if exists "Autenticado lê tipos" on item_types;
drop policy if exists "Autenticado cria tipos" on item_types;

create policy "Participante lê grupos" on item_groups
  for select to authenticated using (private.is_workspace_member(workspace_id));

create policy "Participante cria grupos" on item_groups
  for insert to authenticated with check (private.is_workspace_member(workspace_id));

create policy "Participante edita grupos" on item_groups
  for update to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));

create policy "Participante lê tipos" on item_types
  for select to authenticated using (private.is_workspace_member(workspace_id));

create policy "Participante cria tipos" on item_types
  for insert to authenticated with check (private.is_workspace_member(workspace_id));

create policy "Participante edita tipos" on item_types
  for update to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));

grant update on item_groups, item_types to authenticated;

-- ─── items ──────────────────────────────────────────────────────────────────
drop policy if exists "Autenticado lê itens" on items;
drop policy if exists "Autenticado cria itens" on items;
drop policy if exists "Autenticado edita itens" on items;
drop policy if exists "Autenticado remove itens" on items;

create policy "Participante lê itens" on items
  for select to authenticated using (private.can_access_list(list_id));

create policy "Participante cria itens" on items
  for insert to authenticated
  with check (private.can_access_list(list_id) and created_by = (select auth.uid()));

create policy "Participante edita itens" on items
  for update to authenticated
  using (private.can_access_list(list_id))
  with check (private.can_access_list(list_id));

create policy "Participante remove itens" on items
  for delete to authenticated using (private.can_access_list(list_id));

-- ─── price_checks / item_events ─────────────────────────────────────────────
drop policy if exists "Autenticado lê preços" on price_checks;
drop policy if exists "Autenticado registra preços" on price_checks;
drop policy if exists "Autenticado remove preços" on price_checks;

create policy "Participante lê preços" on price_checks
  for select to authenticated using (private.can_access_item(item_id));

create policy "Participante registra preços" on price_checks
  for insert to authenticated
  with check (private.can_access_item(item_id) and created_by = (select auth.uid()));

create policy "Participante remove preços" on price_checks
  for delete to authenticated using (private.can_access_item(item_id));

drop policy if exists "Autenticado lê eventos" on item_events;
drop policy if exists "Autenticado registra eventos" on item_events;

create policy "Participante lê eventos" on item_events
  for select to authenticated using (private.can_access_item(item_id));

create policy "Participante registra eventos" on item_events
  for insert to authenticated
  with check (private.can_access_item(item_id) and actor = (select auth.uid()));

-- ─── profiles ───────────────────────────────────────────────────────────────
-- Antes: todo autenticado via todos os perfis. Com várias contas isso viraria
-- um diretório aberto de usuários. Agora só quem divide algum workspace.
drop policy if exists "Autenticado lê perfis" on profiles;

create policy "Lê perfis de quem divide workspace" on profiles
  for select to authenticated using (
    id = (select auth.uid())
    or exists (
      select 1
      from workspace_members mine
      join workspace_members theirs on theirs.workspace_id = mine.workspace_id
      where mine.user_id = (select auth.uid()) and theirs.user_id = profiles.id
    )
  );
