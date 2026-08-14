-- Rode este SQL no Supabase: painel do projeto > SQL Editor > New query > Run
-- Adiciona nível de prioridade aos itens (alta/média/baixa).

alter table items add column priority text not null default 'media' check (priority in ('alta', 'media', 'baixa'));
