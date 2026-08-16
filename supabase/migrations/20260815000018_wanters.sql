-- Para quem é o item.
--
-- Grupo e tipo dizem o que a coisa é; a lista diz onde ela mora. Faltava dizer
-- de quem ela é — e `created_by` não serve, porque quem cadastra o perfume da
-- mãe é o filho, não a mãe.
--
-- Registro próprio em vez de texto livre pelo mesmo motivo de `item_groups`:
-- "Mãe" e "mãe" digitados em semanas diferentes viram duas pessoas, e o filtro
-- deixa de fechar.

create table wanters (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  /**
   * Preenchido quando a pessoa participa do espaço — é o que permite "Você".
   * Nulo para quem não tem conta: a mãe entra na lista sem nunca fazer login.
   */
  profile_id uuid references profiles(id) on delete set null,
  sort_order int not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

-- Um participante aparece uma vez só; homônimos sem conta são permitidos.
create unique index wanters_workspace_profile_idx
  on wanters (workspace_id, profile_id) where profile_id is not null;

create index wanters_workspace_idx on wanters (workspace_id) where archived_at is null;

/**
 * Array em vez de tabela de ligação.
 *
 * A tela busca `items` numa consulta plana e encaixa cada linha alterada no
 * estado local — de realtime, de escrita, de recarga. Uma tabela de ligação
 * obrigaria todas essas passagens a embutir o relacionamento e a mantê-lo em
 * sincronia; o array viaja junto da linha, de graça.
 *
 * O preço é não ter chave estrangeira: um id de pessoa arquivada continua aqui.
 * A tela resolve id para nome e ignora o que não conhece, que é o mesmo que já
 * acontece com grupo e tipo arquivados.
 */
alter table items add column wanter_ids uuid[] not null default '{}';

create index items_wanter_ids_idx on items using gin (wanter_ids);

-- ─── Policies ───────────────────────────────────────────────────────────────
alter table wanters enable row level security;

grant select, insert, update on wanters to authenticated;

create policy "Participante lê pessoas" on wanters
  for select to authenticated using (private.is_workspace_member(workspace_id));

create policy "Participante cria pessoas" on wanters
  for insert to authenticated with check (private.is_workspace_member(workspace_id));

create policy "Participante edita pessoas" on wanters
  for update to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));

-- Sem delete: arquivar preserva os `wanter_ids` que já apontam para a pessoa.

-- ─── Quem participa já entra como pessoa ────────────────────────────────────
-- Sem isto, o primeiro uso do filtro exigiria cadastrar à mão gente que o
-- espaço já conhece.

create or replace function public.add_member_as_wanter()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.wanters (workspace_id, profile_id, name)
  select
    new.workspace_id,
    new.user_id,
    coalesce(p.display_name, 'Participante')
  from public.profiles p
  where p.id = new.user_id
  on conflict (workspace_id, profile_id) where profile_id is not null do nothing;

  return new;
end;
$$;

create trigger workspace_members_add_wanter
  after insert on workspace_members
  for each row execute function public.add_member_as_wanter();

-- Os espaços que já existem recebem seus participantes de uma vez.
insert into wanters (workspace_id, profile_id, name)
select m.workspace_id, m.user_id, coalesce(p.display_name, 'Participante')
from workspace_members m
join profiles p on p.id = m.user_id
on conflict (workspace_id, profile_id) where profile_id is not null do nothing;

alter publication supabase_realtime add table wanters;
