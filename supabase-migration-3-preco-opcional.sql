-- Rode este SQL no Supabase: painel do projeto > SQL Editor > New query > Run
-- Torna o preço opcional (os itens importados sem preço real ficam null em vez de 0).

alter table items alter column price drop not null;

update items set price = null where price = 0;
