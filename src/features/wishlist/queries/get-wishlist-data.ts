import { logger } from "@/shared/lib/logger";
import { createClient } from "@/shared/lib/supabase/server";

import { type WishlistData } from "../types";

import { wishlistQueries } from "./wishlist-queries";

/**
 * Carga inicial da lista, renderizada no servidor. O client depois só reage ao
 * realtime.
 *
 * Os filtros por lista e workspace são redundantes com a RLS — ela já barraria
 * o que é de outro espaço. Existem porque a pessoa pode participar de vários:
 * sem eles viriam os itens de todas as listas dela.
 */
export async function getWishlistData(
  listId: string,
  workspaceId: string,
): Promise<WishlistData | null> {
  const db = await createClient();

  const [groups, types, items, priceSummaries] = await Promise.all([
    wishlistQueries.groups(db, workspaceId),
    wishlistQueries.types(db, workspaceId),
    wishlistQueries.items(db, listId),
    wishlistQueries.priceSummaries(db),
  ]);

  // Os testes vão um a um porque é assim que o TypeScript estreita cada `data`
  // para não-nulo; uma variável com o primeiro erro não carrega essa informação.
  if (groups.error || types.error || items.error || priceSummaries.error) {
    logger.error(
      "wishlist.initial_load_failed",
      groups.error ?? types.error ?? items.error ?? priceSummaries.error,
    );
    return null;
  }

  logger.info("wishlist.initial_load_succeeded", { listId, itemCount: items.data.length });

  return {
    groups: groups.data,
    types: types.data,
    items: items.data as WishlistData["items"],
    priceSummaries: priceSummaries.data as WishlistData["priceSummaries"],
  };
}
