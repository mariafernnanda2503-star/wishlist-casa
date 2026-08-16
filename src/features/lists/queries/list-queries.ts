import { type SupabaseClient } from "@supabase/supabase-js";

import { type Database } from "@/shared/types/database";

/**
 * As consultas de uma lista, em um lugar só. Servem os dois tipos: o que muda
 * entre desejo e mercado é a tela, não o que se busca.
 *
 * Elas rodam de dois lados — no servidor pela carga inicial, no cliente pelas
 * recargas — e antes existiam duplicadas nos dois. Já divergiram: quando o
 * filtro `deleted_at is null` entrou, foi preciso lembrar de editar as duas
 * cópias. Aqui o cliente entra como parâmetro, então o mesmo filtro serve aos
 * dois sem que nenhum importe o outro.
 *
 * Este arquivo não importa nada de servidor nem de navegador de propósito:
 * fosse o contrário, o bundle do cliente puxaria `next/headers` junto.
 */
type Client = SupabaseClient<Database>;

export const listQueries = {
  groups: (db: Client, workspaceId: string) =>
    db
      .from("item_groups")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null)
      .order("sort_order"),

  types: (db: Client, workspaceId: string) =>
    db
      .from("item_types")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null)
      .order("sort_order"),

  wanters: (db: Client, workspaceId: string) =>
    db
      .from("wanters")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null)
      .order("sort_order")
      .order("name"),

  items: (db: Client, listId: string) =>
    db
      .from("items")
      .select("*")
      .eq("list_id", listId)
      // Exclusão é reversível: o registro continua lá, só não aparece.
      .is("deleted_at", null)
      .order("status")
      .order("created_at", { ascending: false }),

  priceSummaries: (db: Client) => db.from("item_price_summary").select("*"),

  /** A RLS já limita aos perfis de quem divide workspace com a pessoa. */
  profiles: (db: Client) => db.from("profiles").select("*"),
};
