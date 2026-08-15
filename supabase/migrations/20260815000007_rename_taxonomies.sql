-- `areas` e `categories` viram `item_groups` e `item_types`.
--
-- Os nomes antigos presumiam uma casa: "área" só faz sentido se a lista for de
-- cômodos. Como as duas dimensões são só agrupamentos cujo significado quem dá
-- é quem usa (cômodo, pessoa, projeto), o nome precisa ser neutro.
--
-- `item_groups`/`item_types` em vez de `groups`/`types`: GROUPS é palavra-chave
-- no Postgres e o prefixo deixa claro a que pertencem.
--
-- Renomear preserva dados, policies e chaves — o Postgres as referencia por
-- OID, não por nome. O que não acompanha são os *nomes* de índices e
-- constraints, então eles vão à mão logo abaixo.

alter table areas rename to item_groups;
alter table categories rename to item_types;

alter table items rename column area_id to group_id;
alter table items rename column category_id to type_id;

-- ─── Nomes que o rename não acompanha ───────────────────────────────────────
alter index items_area_id_idx rename to items_group_id_idx;
alter index items_category_id_idx rename to items_type_id_idx;

alter index areas_pkey rename to item_groups_pkey;
alter index areas_name_key rename to item_groups_name_key;
alter index categories_pkey rename to item_types_pkey;
alter index categories_name_key rename to item_types_name_key;

alter table items rename constraint items_area_id_fkey to items_group_id_fkey;
alter table items rename constraint items_category_id_fkey to items_type_id_fkey;

-- ─── Policies ───────────────────────────────────────────────────────────────
-- Acompanham a tabela, mas o nome delas continua dizendo "áreas".
alter policy "Autenticado lê áreas" on item_groups rename to "Autenticado lê grupos";
alter policy "Autenticado cria áreas" on item_groups rename to "Autenticado cria grupos";
alter policy "Autenticado lê categorias" on item_types rename to "Autenticado lê tipos";
alter policy "Autenticado cria categorias" on item_types rename to "Autenticado cria tipos";
