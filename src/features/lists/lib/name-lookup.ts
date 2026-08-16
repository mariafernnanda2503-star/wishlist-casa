import { type Group, type ItemType, type Profile, type Wanter } from "../types";

/** Traduz `group_id`, `type_id` e `wanter_ids` para nome, em O(1). */
export type NameLookup = {
  group: (id: string | null) => string;
  type: (id: string | null) => string;
  /**
   * Os nomes das pessoas do item. Id desconhecido é descartado em silêncio:
   * `wanter_ids` é array sem chave estrangeira, então uma pessoa arquivada
   * continua apontada por itens antigos.
   */
  wanters: (ids: string[]) => string[];
};

/** Mostrado quando o item não tem grupo/tipo, ou quando o cadastro foi arquivado. */
export const NO_NAME = "—";

/**
 * Existia em três versões: `Map` na tabela, `.find()` na grade e `.find()` de
 * novo na página. As duas com `.find()` varriam o array a cada célula de cada
 * item — barato com cinco grupos, mas é o tipo de custo que só aparece quando
 * já incomoda.
 */
export function createNameLookup(
  groups: Group[],
  types: ItemType[],
  wanters: Wanter[],
): NameLookup {
  const groupNames = new Map(groups.map((group) => [group.id, group.name]));
  const typeNames = new Map(types.map((type) => [type.id, type.name]));
  const wanterNames = new Map(wanters.map((wanter) => [wanter.id, wanter.name]));

  return {
    group: (id) => (id ? (groupNames.get(id) ?? NO_NAME) : NO_NAME),
    type: (id) => (id ? (typeNames.get(id) ?? NO_NAME) : NO_NAME),
    wanters: (ids) => ids.flatMap((id) => (wanterNames.has(id) ? [wanterNames.get(id)!] : [])),
  };
}

/**
 * Traduz o uuid de quem fez algo para um nome legível.
 *
 * "Você" em vez do próprio nome porque a frase é sobre quem lê: "Você registrou"
 * lê melhor que "Lucas registrou" para o Lucas. `null` acontece quando a conta
 * foi apagada — o `on delete set null` preserva o registro e perde o autor.
 */
export function createActorLookup(profiles: Profile[], currentUserId: string | null) {
  const names = new Map(profiles.map((profile) => [profile.id, profile.display_name]));

  return (actor: string | null): string => {
    if (actor === null) return "Alguém";
    if (actor === currentUserId) return "Você";
    return names.get(actor) ?? "Alguém";
  };
}
