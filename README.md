# Wishlist da Casa

Lista de compras compartilhada: um lado adiciona itens desejados (nome, preço médio, link),
o outro acompanha promoções e marca como comprado. Sincroniza em tempo real entre dispositivos
via Supabase (Postgres + realtime).

## Stack

- HTML/CSS/JS puro, sem build step
- [Supabase](https://supabase.com) como banco de dados e camada de sincronização

## Setup

1. Crie um projeto em [supabase.com](https://supabase.com)
2. No painel do projeto, abra **SQL Editor** e rode o conteúdo de [`supabase-schema.sql`](supabase-schema.sql)
3. Em **Project Settings > API**, copie a **Project URL** e a **anon public key**
4. Cole essas duas informações em [`js/supabase-client.js`](js/supabase-client.js)
5. Abra `index.html` no navegador (ou use uma extensão tipo Live Server)

## Status

Em construção — ver task list.
