-- Rode este SQL no Supabase: painel do projeto > SQL Editor > New query > Run
-- Adiciona campo de quantidade aos itens (ex: "2 tapetes", "3 kits").

alter table items add column quantity int not null default 1;
