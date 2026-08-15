-- Espelho legível de `auth.users`.
--
-- O client não tem (nem deve ter) acesso a `auth.users`, então sem isto todo
-- `created_by` / `purchased_by` / `actor` fica sendo um uuid solto na tela.
-- Aqui fica só o que a interface precisa mostrar.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

grant select on profiles to authenticated;

-- São duas pessoas na mesma casa: cada uma vê o nome da outra.
create policy "Autenticado lê perfis" on profiles for select to authenticated using (true);

-- Sem insert/update pelo client: quem mantém isto é o trigger abaixo.

-- ─── Sincronia com auth.users ───────────────────────────────────────────────
create or replace function public.sync_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

-- `security definer` é necessário: o trigger roda no contexto de quem se
-- cadastra, que não tem permissão de escrita em profiles.
create trigger on_auth_user_created
  after insert or update of email on auth.users
  for each row execute function public.sync_profile();

-- Quem já existe entra agora.
insert into profiles (id, email, display_name)
select
  id,
  email,
  coalesce(nullif(raw_user_meta_data ->> 'display_name', ''), split_part(email, '@', 1))
from auth.users
on conflict (id) do nothing;
