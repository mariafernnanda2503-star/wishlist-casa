-- Roda só no banco local, a cada `pnpm db:reset`. O Supabase CLI nunca envia
-- este arquivo para o projeto remoto — `db:push` só aplica supabase/migrations/.

-- ─── Listas fixas ─────────────────────────────────────────────────────────────

insert into item_groups (name, sort_order) values
  ('Cozinha', 1),
  ('Banheiro', 2),
  ('Quarto', 3),
  ('Pet', 4),
  ('Casa (geral)', 5)
on conflict (name) do nothing;

insert into item_types (name, sort_order) values
  ('Utensílio', 1),
  ('Eletrodoméstico', 2),
  ('Organização', 3),
  ('Têxtil', 4),
  ('Decoração/Reforma', 5),
  ('Higiene & Saúde', 6),
  ('Acessório Pet', 7)
on conflict (name) do nothing;

-- ─── Itens de exemplo ─────────────────────────────────────────────────────────
-- Cobrem todas as áreas, categorias e prioridades, mais os casos de borda que a
-- tela precisa saber desenhar: sem preço, quantidade acima de 1, com e sem nota
-- ou link, e itens já comprados (que caem na segunda seção).
--
-- `items` não tem chave natural para `on conflict`, então o seed só popula
-- quando a tabela está vazia — reset recria, banco em uso fica intacto.

insert into items (
  name, price, quantity, priority, link, note, status, purchased_at, area_id, category_id
)
select
  d.name,
  d.price,
  d.quantity,
  d.priority,
  d.link,
  d.note,
  d.status,
  case when d.status = 'purchased' then now() - (d.dias_atras || ' days')::interval end,
  (select id from item_groups where name = d.area),
  (select id from item_types where name = d.categoria)
from (values
  -- nome, preço, qtd, prioridade, link, nota, status, dias atrás, área, categoria
  ('Air fryer 5L',                499.90::numeric(10,2), 1, 'alta',  'https://www.amazon.com.br/s?k=air+fryer+5l',        'esperar Black Friday',        'pending',   0, 'Cozinha',      'Eletrodoméstico'),
  ('Aspirador de pó vertical',    899.00,                1, 'alta',  'https://www.amazon.com.br/s?k=aspirador+vertical',  null,                          'pending',   0, 'Casa (geral)', 'Eletrodoméstico'),
  ('Jogo de panelas antiaderente',389.00,                1, 'alta',  null,                                                'o de 5 peças já serve',       'pending',   0, 'Cozinha',      'Utensílio'),
  ('Cortina blackout',            149.90,                2, 'media', null,                                                'medir a janela antes',        'pending',   0, 'Quarto',       'Têxtil'),
  ('Kit toalhas de banho',        119.90,                4, 'media', null,                                                null,                          'pending',   0, 'Banheiro',     'Têxtil'),
  ('Kit primeiros socorros',       64.90,                1, 'media', null,                                                null,                          'pending',   0, 'Casa (geral)', 'Higiene & Saúde'),
  ('Comedouro elevado',           null,                  1, 'media', null,                                                'ver o tamanho certo pra ela', 'pending',   0, 'Pet',          'Acessório Pet'),
  ('Luminária de cabeceira',       89.90,                2, 'baixa', null,                                                null,                          'pending',   0, 'Quarto',       'Decoração/Reforma'),
  ('Cesto de roupa suja',          79.90,                1, 'baixa', null,                                                null,                          'pending',   0, 'Banheiro',     'Organização'),
  ('Organizador de temperos',     null,                  1, 'baixa', null,                                                null,                          'pending',   0, 'Cozinha',      'Organização'),
  ('Micro-ondas 20L',             549.00,                1, 'alta',  null,                                                null,                          'purchased', 12, 'Cozinha',     'Eletrodoméstico'),
  ('Caminha para cachorro',       129.90,                1, 'media', 'https://www.amazon.com.br/s?k=cama+para+cachorro',  null,                          'purchased',  5, 'Pet',         'Acessório Pet'),
  ('Tapete antiderrapante',        39.90,                2, 'media', null,                                                null,                          'purchased',  5, 'Banheiro',    'Têxtil')
) as d(name, price, quantity, priority, link, note, status, dias_atras, area, categoria)
where not exists (select 1 from items);

-- ─── Usuário de desenvolvimento ───────────────────────────────────────────────
-- email: dev@casa.local
-- senha: wishlist
--
-- O cadastro pela tela é bloqueado, então sem isto todo `db:reset` exigiria
-- criar a conta à mão no Studio antes de conseguir abrir o app.
--
-- As colunas de token abaixo precisam ir como '' em vez de NULL: o GoTrue as lê
-- como string não-nula e o login falha com "Database error querying schema".

delete from auth.identities
where provider = 'email'
  and provider_id = 'dev@casa.local'
  and user_id <> '40000000-0000-4000-8000-000000000001';

delete from auth.users
where email = 'dev@casa.local'
  and id <> '40000000-0000-4000-8000-000000000001';

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_token_current,
  email_change_confirm_status,
  reauthentication_token,
  raw_app_meta_data,
  raw_user_meta_data,
  is_sso_user,
  is_anonymous,
  created_at,
  updated_at
)
values (
  '40000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'dev@casa.local',
  extensions.crypt('wishlist', extensions.gen_salt('bf')),
  now(),
  '',
  '',
  '',
  '',
  '',
  0,
  '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  false,
  false,
  now(),
  now()
)
on conflict (id) do update set
  aud = excluded.aud,
  role = excluded.role,
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = coalesce(auth.users.email_confirmed_at, excluded.email_confirmed_at),
  confirmation_token = excluded.confirmation_token,
  recovery_token = excluded.recovery_token,
  email_change_token_new = excluded.email_change_token_new,
  email_change = excluded.email_change,
  email_change_token_current = excluded.email_change_token_current,
  email_change_confirm_status = excluded.email_change_confirm_status,
  reauthentication_token = excluded.reauthentication_token,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  is_sso_user = excluded.is_sso_user,
  is_anonymous = excluded.is_anonymous,
  updated_at = excluded.updated_at;

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values (
  '41000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001',
  'dev@casa.local',
  jsonb_build_object(
    'sub', '40000000-0000-4000-8000-000000000001',
    'email', 'dev@casa.local',
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(),
  now(),
  now()
)
on conflict (provider_id, provider) do update set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  updated_at = excluded.updated_at;
