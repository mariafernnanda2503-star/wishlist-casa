import { type Database } from "@/shared/types/database";

type Tables = Database["public"]["Tables"];

export type Group = Tables["item_groups"]["Row"];
export type ItemType = Tables["item_types"]["Row"];

export type Priority = "alta" | "media" | "baixa";

/**
 * Vocabulário, não funil: dá para ir de `wanted` direto a `owned`, ou voltar.
 * Nada no banco obriga uma ordem.
 */
export type Status = "wanted" | "purchased" | "owned" | "archived";

export type PriceCheck = Tables["price_checks"]["Row"];
export type ItemEvent = Tables["item_events"]["Row"];
/** Espelho legível de auth.users — é o que dá nome aos uuids na interface. */
export type Profile = Tables["profiles"]["Row"];

/**
 * Último e melhor preço por item, vindos da view. A view agrega, então os
 * campos são anuláveis no type gerado — na prática nunca vêm nulos, porque
 * uma linha só existe se houver ao menos uma observação.
 */
export type PriceSummary = {
  item_id: string;
  latest_price: number | null;
  best_price: number | null;
  check_count: number | null;
};

/**
 * O banco guarda `priority` e `status` como text com CHECK constraint, então o
 * type gerado os expõe como `string`. Aqui estreitamos para as uniões reais.
 */
export type Item = Omit<Tables["items"]["Row"], "priority" | "status"> & {
  priority: Priority;
  status: Status;
};

/** Tudo que a tela precisa para renderizar, buscado de uma vez no servidor. */
export type WishlistData = {
  groups: Group[];
  types: ItemType[];
  items: Item[];
  profiles: Profile[];
  priceSummaries: PriceSummary[];
};

/** Campos que o formulário de item (adicionar e editar) preenche. */
export type ItemDraft = {
  name: string;
  price: number | null;
  priceTarget: number | null;
  quantity: number;
  priority: Priority;
  link: string | null;
  note: string | null;
  groupId: string | null;
  typeId: string | null;
};
