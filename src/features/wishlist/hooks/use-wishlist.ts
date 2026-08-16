"use client";

import { useMemo } from "react";

import { createClient } from "@/shared/lib/supabase/client";

import { type WishlistData } from "../types";

import { useItems } from "./use-items";
import { usePriceSummaries } from "./use-price-summaries";
import { useTaxonomies } from "./use-taxonomies";
import { useWishlistRealtime } from "./use-wishlist-realtime";

/**
 * Orquestrador da tela: compõe os sub-hooks de cada domínio e liga o realtime
 * neles.
 *
 * A superfície devolvida é plana de propósito — quem consome não precisa saber
 * de qual sub-hook cada coisa veio, então mover uma responsabilidade entre eles
 * não quebra a página.
 */
export function useWishlist(initialData: WishlistData, listId: string, workspaceId: string) {
  const supabase = useMemo(() => createClient(), []);

  const items = useItems(initialData.items, listId, supabase);
  const taxonomies = useTaxonomies(initialData.groups, initialData.types, workspaceId, supabase);
  const summaries = usePriceSummaries(initialData.priceSummaries, supabase);

  useWishlistRealtime(supabase, listId, {
    onItemChanged: items.apply,
    onItemRemoved: items.remove,
    onTaxonomyChanged: taxonomies.reload,
    onPriceChanged: summaries.reload,
  });

  return {
    items: items.items,
    groups: taxonomies.groups,
    types: taxonomies.types,
    priceSummaries: summaries.priceSummaries,
    createGroup: taxonomies.createGroup,
    createType: taxonomies.createType,
    addItem: items.addItem,
    updateItem: items.updateItem,
    toggleStatus: items.toggleStatus,
    updatePriority: items.updatePriority,
    deleteItem: items.deleteItem,
  };
}
