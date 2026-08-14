-- Roda só no banco local, a cada `pnpm db:reset`. As listas fixas que o app
-- oferece nos selects de área e categoria.

insert into areas (name, sort_order) values
  ('Cozinha', 1),
  ('Banheiro', 2),
  ('Quarto', 3),
  ('Pet', 4),
  ('Casa (geral)', 5)
on conflict (name) do nothing;

insert into categories (name, sort_order) values
  ('Utensílio', 1),
  ('Eletrodoméstico', 2),
  ('Organização', 3),
  ('Têxtil', 4),
  ('Decoração/Reforma', 5),
  ('Higiene & Saúde', 6),
  ('Acessório Pet', 7)
on conflict (name) do nothing;
