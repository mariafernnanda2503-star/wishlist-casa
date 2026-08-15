-- Convites por link.

-- ─── Convites ───────────────────────────────────────────────────────────────
create table workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  -- Hex, não base64: o token vai na URL e `+/=` precisariam de escape.
  token text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  role text not null default 'member' check (role in ('owner', 'member')),
  /** Só informativo — quem abrir o link entra, tenha o e-mail que tiver. */
  invited_email text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null
);

create index workspace_invites_workspace_idx on workspace_invites (workspace_id);

alter table workspace_invites enable row level security;
grant select, insert, delete on workspace_invites to authenticated;

-- Só o dono lida com convites. Quem recebe nunca lê a tabela direto: usa as
-- funções abaixo, que devolvem o mínimo necessário.
create policy "Dono lê convites" on workspace_invites
  for select to authenticated using (private.is_workspace_owner(workspace_id));

create policy "Dono cria convite" on workspace_invites
  for insert to authenticated with check (private.is_workspace_owner(workspace_id));

create policy "Dono revoga convite" on workspace_invites
  for delete to authenticated using (private.is_workspace_owner(workspace_id));

/**
 * Mostra para quem abriu o link de quem é o convite, antes de entrar na conta.
 *
 * Devolve só o nome do workspace: sem isso a tela de convite teria que dizer
 * "você foi convidado para algum lugar". Não expõe id, quem convidou, nem
 * qualquer outro convite.
 */
create or replace function public.peek_workspace_invite(invite_token text)
returns table (workspace_name text, is_valid boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select w.name, (i.accepted_at is null and i.expires_at > now())
  from public.workspace_invites i
  join public.workspaces w on w.id = i.workspace_id
  where i.token = invite_token;
$$;

/**
 * Aceita o convite e devolve o workspace.
 *
 * `security definer` porque quem aceita ainda não é participante — as policies
 * de `workspace_members` e `workspace_invites` o barrariam.
 */
create or replace function public.accept_workspace_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.workspace_invites;
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'É preciso estar autenticado para aceitar o convite'
      using errcode = '42501';
  end if;

  select * into v_invite
  from public.workspace_invites
  where token = invite_token and accepted_at is null and expires_at > now();

  if not found then
    raise exception 'Convite inválido ou expirado' using errcode = '22023';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_invite.workspace_id, v_user, v_invite.role)
  on conflict (workspace_id, user_id) do nothing;

  update public.workspace_invites
  set accepted_at = now(), accepted_by = v_user
  where id = v_invite.id;

  return v_invite.workspace_id;
end;
$$;

-- `peek` é aberto de propósito: a tela do convite roda antes do login. Já o
-- `accept` exige sessão, e a própria função recusa `auth.uid()` nulo.
revoke all on function public.peek_workspace_invite(text) from public;
revoke all on function public.accept_workspace_invite(text) from public;
grant execute on function public.peek_workspace_invite(text) to anon, authenticated;
grant execute on function public.accept_workspace_invite(text) to authenticated;
