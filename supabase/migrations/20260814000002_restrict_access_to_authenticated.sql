-- Restringe o acesso ao papel `authenticated`. O papel `anon` perde qualquer
-- privilégio, então a anon key sozinha não abre mais nada.
--
-- Cadastro aberto fica desligado em supabase/config.toml e, no projeto remoto,
-- em Authentication > Sign In / Providers > "Allow new users to sign up".

drop policy if exists "Acesso público de leitura e escrita" on areas;
drop policy if exists "Acesso público de leitura e escrita" on categories;
drop policy if exists "Acesso público de leitura e escrita" on items;

-- Policy sozinha não dá acesso: o Postgres checa o GRANT de tabela antes da RLS.
-- Versões recentes do Supabase não concedem mais SELECT/INSERT/UPDATE/DELETE
-- automaticamente a anon e authenticated no schema public, então declaramos.
revoke all on areas from anon;
revoke all on categories from anon;
revoke all on items from anon;

grant select on areas to authenticated;
grant select on categories to authenticated;
grant select, insert, update, delete on items to authenticated;

-- Áreas e categorias são listas fixas: quem usa o app só precisa lê-las.
-- Alterar essas listas é feito pelo painel do Supabase.
create policy "Autenticado lê áreas" on areas for select to authenticated using (true);

create policy "Autenticado lê categorias" on categories for select to authenticated using (true);

create policy "Autenticado gerencia itens" on items
  for all to authenticated using (true) with check (true);
