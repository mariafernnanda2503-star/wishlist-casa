import { type Group, type ItemType } from "../types";

/** Traduz `group_id` e `type_id` para nome, em O(1). */
export type NameLookup = {
  group: (id: string | null) => string;
  type: (id: string | null) => string;
};

/** Mostrado quando o item não tem grupo/tipo, ou quando o cadastro foi arquivado. */
export const NO_NAME = "—";

/**
 * Existia em três versões: `Map` na tabela, `.find()` na grade e `.find()` de
 * novo na página. As duas com `.find()` varriam o array a cada célula de cada
 * item — barato com cinco grupos, mas é o tipo de custo que só aparece quando
 * já incomoda.
 */
export function createNameLookup(groups: Group[], types: ItemType[]): NameLookup {
  const groupNames = new Map(groups.map((group) => [group.id, group.name]));
  const typeNames = new Map(types.map((type) => [type.id, type.name]));

  return {
    group: (id) => (id ? (groupNames.get(id) ?? NO_NAME) : NO_NAME),
    type: (id) => (id ? (typeNames.get(id) ?? NO_NAME) : NO_NAME),
  };
}
