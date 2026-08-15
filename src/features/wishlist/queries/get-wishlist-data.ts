import { logger } from "@/shared/lib/logger";
import { createClient } from "@/shared/lib/supabase/server";

import { type WishlistData } from "../types";

/** Carga inicial da lista, renderizada no servidor. O client depois só reage ao realtime. */
export async function getWishlistData(): Promise<WishlistData | null> {
  const supabase = await createClient();

  const [groupsRes, typesRes, itemsRes, profilesRes, summariesRes] = await Promise.all([
    supabase.from("item_groups").select("*").order("sort_order"),
    supabase.from("item_types").select("*").order("sort_order"),
    supabase
      .from("items")
      .select("*")
      // Exclusão é reversível: o registro continua lá, só não aparece.
      .is("deleted_at", null)
      .order("status")
      .order("created_at", { ascending: false }),
    // São dois usuários: cabe carregar todos e resolver os nomes no cliente.
    supabase.from("profiles").select("*"),
    // Dois números por item, em vez do histórico inteiro só para somar.
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

  logger.info("wishlist.initial_load_succeeded", { itemCount: itemsRes.data.length });

  return {
    groups: groupsRes.data,
    types: typesRes.data,
    items: itemsRes.data as WishlistData["items"],
    profiles: profilesRes.data,
    priceSummaries: summariesRes.data as WishlistData["priceSummaries"],
  };
}
