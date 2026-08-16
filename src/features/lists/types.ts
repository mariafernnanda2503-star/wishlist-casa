import { type Database } from "@/shared/types/database";

type Tables = Database["public"]["Tables"];

export type Group = Tables["item_groups"]["Row"];
export type ItemType = Tables["item_types"]["Row"];

/**
 * Para quem é o item. Grupo e tipo dizem o que a coisa é; isto diz de quem ela
 * é. `profile_id` só existe para quem participa do espaço — a mãe entra na
 * lista sem nunca fazer login.
 */
export type Wanter = Tables["wanters"]["Row"];
export type Workspace = Tables["workspaces"]["Row"];

/**
 * Desejo e mercado são ciclos opostos: no desejo comprar **encerra** o item, no
 * mercado comprar **reinicia** — o arroz volta semana que vem. É a única coisa
 * que separa os dois; espaço, participantes e taxonomia são os mesmos.
 */
export type ListKind = "wishlist" | "shopping";

export type List = Omit<Tables["lists"]["Row"], "kind"> & { kind: ListKind };

/** Onde a pessoa está: o workspace ativo, suas listas e a lista aberta. */
export type WorkspaceContext = {
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  lists: List[];
  activeList: List;
  /** Quem participa do espaço — é o que dá nome aos uuids de autoria. */
  profiles: Profile[];
  /** `owner` pode gerenciar participantes e apagar o workspace. */
  role: "owner" | "member";
};

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
export type ListData = {
  groups: Group[];
  types: ItemType[];
  wanters: Wanter[];
  items: Item[];
  priceSummaries: PriceSummary[];
};

/** Campos que o formulário de item (adicionar e editar) preenche. */
export type ItemDraft = {
  name: string;
  price: number | null;
  priceTarget: number | null;
  quantity: number;
  /** "kg", "un", "pct" — livre. Nulo quando a contagem basta. */
  unit: string | null;
  /** Ids de `Wanter`. Vazio é "ninguém em particular". */
  wanterIds: string[];
  priority: Priority;
  link: string | null;
  note: string | null;
  groupId: string | null;
  typeId: string | null;
};

/** Uma ida ao mercado, já fechada. */
export type ShoppingTrip = Tables["shopping_trips"]["Row"];

/**
 * O que foi levado, congelado no momento da compra — cópia e não referência,
 * porque a lista se repete toda semana e os itens são renomeados e apagados.
 */
export type TripLine = Tables["shopping_trip_items"]["Row"];

/** Ida com suas linhas e o total já somado. */
export type Trip = ShoppingTrip & { lines: TripLine[]; total: number };

/** Uma linha em conferência, ainda no diálogo de fechamento. */
export type TripLineInput = {
  /** Nulo é avulso — o que se comprou sem estar na lista. */
  item_id: string | null;
  name: string;
  quantity: number;
  unit: string | null;
  unit_price: number | null;
};
