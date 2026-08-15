-- `workspace_members.user_id` já aponta para `auth.users`, mas o PostgREST não
-- consegue embutir `profiles` a partir disso: ele resolve relações por chave
-- estrangeira, e não existia nenhuma entre as duas tabelas. Sem isto, listar
-- participantes com o nome exigiria duas consultas e um join no cliente.
--
-- A segunda chave também diz uma verdade do modelo: participante sempre tem
-- perfil, porque o trigger em auth.users cria um.

alter table workspace_members
  add constraint workspace_members_profile_fkey
  foreign key (user_id) references profiles(id) on delete cascade;
