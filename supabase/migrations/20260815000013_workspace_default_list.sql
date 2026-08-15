-- Todo workspace nasce com uma lista.
--
-- `getWorkspaceContext` resolve "onde a pessoa está" a partir da lista ativa;
-- um workspace sem nenhuma não tem para onde apontar e a tela cairia no aviso
-- de "você não participa de nenhuma lista", que seria mentira.
--
-- No banco e não no cliente pelo mesmo motivo do `add_workspace_owner`: assim
-- a invariante vale para qualquer caminho de criação, inclusive SQL direto.

create or replace function public.add_workspace_default_list()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.lists (workspace_id, name, created_by)
  values (new.id, 'Lista de desejos', coalesce(new.created_by, auth.uid()));
  return new;
end;
$$;

create trigger workspaces_add_default_list
  after insert on workspaces
  for each row execute function public.add_workspace_default_list();
