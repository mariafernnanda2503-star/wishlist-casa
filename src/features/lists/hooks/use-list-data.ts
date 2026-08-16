"use client";

import { useMemo } from "react";

import { createClient } from "@/shared/lib/supabase/client";

import { type ListData } from "../types";

import { useItems } from "./use-items";
import { useListRealtime } from "./use-list-realtime";
import { usePriceSummaries } from "./use-price-summaries";
import { useTaxonomies } from "./use-taxonomies";

/**
 * Orquestrador da tela: compõe os sub-hooks de cada domínio e liga o realtime
 * neles.
 *
 * A superfície devolvida é plana de propósito — quem consome não precisa saber
 * de qual sub-hook cada coisa veio, então mover uma responsabilidade entre eles
 * não quebra a página.
 */
export function useListData(initialData: ListData, listId: string, workspaceId: string) {
  const supabase = useMemo(() => createClient(), []);

  const items = useItems(initialData.items, listId, supabase);
  const taxonomies = useTaxonomies(
    initialData.groups,
    initialData.types,
    initialData.wanters,
    workspaceId,
    supabase,
  );
  const summaries = usePriceSummaries(initialData.priceSummaries, supabase);

  useListRealtime(supabase, listId, {
    onItemChanged: items.apply,
    onItemRemoved: items.remove,
    onTaxonomyChanged: taxonomies.reload,
    onPriceChanged: summaries.reload,
  });

  return {
    items: items.items,
    groups: taxonomies.groups,
    types: taxonomies.types,
    wanters: taxonomies.wanters,
    priceSummaries: summaries.priceSummaries,
    createGroup: taxonomies.createGroup,
    createType: taxonomies.createType,
    createWanter: taxonomies.createWanter,
    // Fechar a ida ao mercado mexe em todos os itens de uma vez, por dentro do
    // banco; nenhuma escrita local sabe disso, então a tela recarrega.
    reloadItems: items.reload,
    addItem: items.addItem,
    updateItem: items.updateItem,
    toggleStatus: items.toggleStatus,
    updatePriority: items.updatePriority,
    deleteItem: items.deleteItem,
  };
}
