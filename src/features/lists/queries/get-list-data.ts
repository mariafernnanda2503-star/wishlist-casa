import { logger } from "@/shared/lib/logger";
import { createClient } from "@/shared/lib/supabase/server";

import { type ListData } from "../types";

import { listQueries } from "./list-queries";

/**
 * Carga inicial da lista, renderizada no servidor. O client depois só reage ao
 * realtime.
 *
 * Os filtros por lista e workspace são redundantes com a RLS — ela já barraria
 * o que é de outro espaço. Existem porque a pessoa pode participar de vários:
 * sem eles viriam os itens de todas as listas dela.
 */
export async function getListData(listId: string, workspaceId: string): Promise<ListData | null> {
  const db = await createClient();

  const [groups, types, wanters, items, priceSummaries] = await Promise.all([
    listQueries.groups(db, workspaceId),
    listQueries.types(db, workspaceId),
    listQueries.wanters(db, workspaceId),
    listQueries.items(db, listId),
    listQueries.priceSummaries(db),
  ]);

  // Os testes vão um a um porque é assim que o TypeScript estreita cada `data`
  // para não-nulo; uma variável com o primeiro erro não carrega essa informação.
  if (groups.error || types.error || wanters.error || items.error || priceSummaries.error) {
    logger.error(
      "list.initial_load_failed",
      groups.error ?? types.error ?? wanters.error ?? items.error ?? priceSummaries.error,
    );
    return null;
  }

  logger.info("list.initial_load_succeeded", { listId, itemCount: items.data.length });

  return {
    groups: groups.data,
    types: types.data,
    wanters: wanters.data,
    items: items.data as ListData["items"],
    priceSummaries: priceSummaries.data as ListData["priceSummaries"],
  };
}
