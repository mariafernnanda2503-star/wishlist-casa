import { type Database } from "@/shared/types/database";

type Tables = Database["public"]["Tables"];

export type Area = Tables["areas"]["Row"];
export type Category = Tables["categories"]["Row"];

export type Priority = "alta" | "media" | "baixa";
export type Status = "pending" | "purchased";

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
  areas: Area[];
  categories: Category[];
  items: Item[];
};

/** Campos que o formulário de item (adicionar e editar) preenche. */
export type ItemDraft = {
  name: string;
  price: number | null;
  quantity: number;
  priority: Priority;
  link: string | null;
  note: string | null;
  areaId: string | null;
  categoryId: string | null;
};
