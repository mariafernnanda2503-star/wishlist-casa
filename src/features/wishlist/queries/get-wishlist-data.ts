import { logger } from "@/shared/lib/logger";
import { createClient } from "@/shared/lib/supabase/server";

import { type WishlistData } from "../types";

/**
 * Carga inicial da lista, renderizada no servidor. O client depois só reage ao
 * realtime.
 *
 * Os filtros por `list_id` e `workspace_id` são redundantes com a RLS — ela já
 * barraria o que é de outro workspace. Estão aqui porque a pessoa pode
 * participar de vários: sem eles viriam os itens de todas as listas dela.
 */
export async function getWishlistData(
  listId: string,
  workspaceId: string,
): Promise<WishlistData | null> {
  const supabase = await createClient();

  const [groupsRes, typesRes, itemsRes, profilesRes, summariesRes] = await Promise.all([
    supabase
      .from("item_groups")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null)
      .order("sort_order"),
    supabase
      .from("item_types")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("archived_at", null)
      .order("sort_order"),
    supabase
      .from("items")
      .select("*")
      .eq("list_id", listId)
      // Exclusão é reversível: o registro continua lá, só não aparece.
      .is("deleted_at", null)
      .order("status")
      .order("created_at", { ascending: false }),
    // A RLS já limita aos perfis de quem divide workspace com a pessoa.
    supabase.from("profiles").select("*"),
    supabase.from("item_price_summary").select("*"),
  ]);

  if (
    groupsRes.error ||
    typesRes.error ||
    itemsRes.error ||
    profilesRes.error ||
    summariesRes.error
  ) {
    logger.error(
      "wishlist.initial_load_failed",
      groupsRes.error ??
        typesRes.error ??
        itemsRes.error ??
        profilesRes.error ??
        summariesRes.error,
    );
    return null;
  }

  logger.info("wishlist.initial_load_succeeded", { listId, itemCount: itemsRes.data.length });

  return {
    groups: groupsRes.data,
    types: typesRes.data,
    items: itemsRes.data as WishlistData["items"],
    profiles: profilesRes.data,
    priceSummaries: summariesRes.data as WishlistData["priceSummaries"],
  };
}
