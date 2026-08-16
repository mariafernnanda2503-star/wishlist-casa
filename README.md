# Wishlist da Casa

Lista de compras compartilhada: um lado adiciona itens desejados (nome, preço médio, link),
o outro acompanha promoções e marca como comprado. Sincroniza em tempo real entre dispositivos
via Supabase Realtime.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** — as cores são tokens definidos em [`app/globals.css`](app/globals.css)
- **Supabase** — Postgres, Auth e Realtime, com schema versionado pelo Supabase CLI
- **Zod** — validação dos formulários
- ESLint + Prettier

O acesso ao banco é feito pelo client do Supabase, tipado a partir do schema (`pnpm db:types`).

## Setup

Requer **Node >= 24**, **pnpm >= 10** e **Docker** (para o banco local).

```bash
pnpm install
cp .env.example .env.local

pnpm db:start        # sobe Postgres + Auth + Realtime em Docker
pnpm db:env          # mostra a anon key gerada; cole no .env.local
pnpm dev             # http://localhost:3001
```

O login exige uma conta. Crie a sua no Supabase Studio local (http://127.0.0.1:54323),
em **Authentication > Users > Add user**, marcando "Auto Confirm User".

## Comandos

| Comando              | O que faz                                              |
| -------------------- | ------------------------------------------------------ |
| `pnpm dev`           | Roda o app em http://localhost:3001                    |
| `pnpm check`         | Typecheck + lint + formatação — rode antes de commitar |
| `pnpm lint:fix`      | Corrige o que o ESLint sabe corrigir                   |
| `pnpm format`        | Formata tudo com Prettier                              |
| `pnpm build`         | Build de produção                                      |
| `pnpm db:start/stop` | Sobe/derruba o Supabase local                          |
| `pnpm db:reset`      | Recria o banco local a partir das migrations + seed    |
| `pnpm db:new <nome>` | Cria uma migration em `supabase/migrations/`           |
| `pnpm db:types`      | Regenera `src/shared/types/database.ts`                |
| `pnpm db:push`       | Aplica as migrations pendentes no banco remoto         |

## Banco de dados

O schema é versionado em [`supabase/migrations/`](supabase/migrations/).

`workspaces` é a unidade de acesso; `workspace_members` diz quem participa e
`workspace_invites` guarda os convites pendentes. Cada workspace tem suas `lists`, e
`lists.kind` separa `wishlist` de `shopping` — a lista de desejos encerra o item na compra,
a de mercado reinicia. Os `items` pertencem a uma lista e se classificam por `item_groups`
e `item_types`, criados dentro do workspace.

Em volta do item: `price_checks` (preços observados, com loja e data), `item_events`
(trilha de alterações, escrita por trigger) e `profiles` (espelho de `auth.users`, para dar
nome aos uuids de autoria). Fechar uma ida ao mercado grava `shopping_trips` e
`shopping_trip_items` e alimenta `price_checks`.

**Row Level Security**: o acesso segue a participação no workspace, resolvida por funções
`security definer` no schema `private`. O papel `anon` não tem nenhum privilégio — a anon
key é pública por design e não abre nada sozinha.

O cadastro de novos usuários fica desligado. As contas são criadas à mão em
**Authentication > Users**.

### Conectar ao projeto remoto

A primeira migration (`20260814000001_baseline_schema.sql`) descreve o schema que já existe no
projeto remoto. Marque-a como aplicada em vez de rodá-la:

```bash
pnpm db:link                                                 # pede o project-ref e a senha do banco
supabase migration repair --status applied 20260814000001
pnpm db:migrations:status                                    # confira o que está pendente
pnpm db:push                                                 # aplica a migration de RLS
```

A migration de RLS fecha o acesso anônimo, então a versão sem login para de funcionar assim que
ela for aplicada. Publique a versão nova junto.

No painel do Supabase, desligue também **Authentication > Sign In / Providers >
"Allow new users to sign up"**.

## Deploy

O app precisa de runtime de servidor (proxy de autenticação e renderização por request):

1. Importe o repositório em vercel.com
2. Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` com os valores do projeto remoto
3. Adicione a URL de produção em **Authentication > URL Configuration** no painel do Supabase
