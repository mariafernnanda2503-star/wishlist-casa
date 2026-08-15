import { logger } from "@/shared/lib/logger";
import { createClient } from "@/shared/lib/supabase/server";

import { type WishlistData } from "../types";

/** Carga inicial da lista, renderizada no servidor. O client depois só reage ao realtime. */
export async function getWishlistData(): Promise<WishlistData | null> {
  const supabase = await createClient();

  const [areasRes, categoriesRes, itemsRes] = await Promise.all([
    supabase.from("areas").select("*").order("sort_order"),
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("items").select("*").order("status").order("created_at", { ascending: false }),
  ]);

  if (areasRes.error || categoriesRes.error || itemsRes.error) {
    logger.error(
      "wishlist.initial_load_failed",
      areasRes.error ?? categoriesRes.error ?? itemsRes.error,
    );
    return null;
  }

  logger.info("wishlist.initial_load_succeeded", { itemCount: itemsRes.data.length });

  return {
    areas: areasRes.data,
    categories: categoriesRes.data,
    items: itemsRes.data as WishlistData["items"],
  };
}
