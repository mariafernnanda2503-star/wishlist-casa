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

  if (areasRes.error || categoriesRes.error || itemsRes.error) return null;

  return {
    areas: areasRes.data,
    categories: categoriesRes.data,
    items: itemsRes.data as WishlistData["items"],
  };
}
