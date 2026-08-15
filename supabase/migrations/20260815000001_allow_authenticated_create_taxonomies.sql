-- Área e categoria deixam de ser listas exclusivamente administrativas:
-- usuários autenticados podem acrescentar opções pelos formulários do app.
-- Alteração e exclusão continuam restritas ao painel do Supabase.

grant insert on areas to authenticated;
grant insert on categories to authenticated;

create policy "Autenticado cria áreas" on areas
  for insert to authenticated
  with check (char_length(trim(name)) between 1 and 80);

create policy "Autenticado cria categorias" on categories
  for insert to authenticated
  with check (char_length(trim(name)) between 1 and 80);
