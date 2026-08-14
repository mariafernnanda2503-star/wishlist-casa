"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { createClient } from "@/shared/lib/supabase/client";

import {
  type Area,
  type Category,
  type Item,
  type ItemDraft,
  type Priority,
  type WishlistData,
} from "../types";

/** Colunas de `items` escritas a partir de um `ItemDraft`. */
function toRow(draft: ItemDraft) {
  return {
    name: draft.name,
    price: draft.price,
    quantity: draft.quantity,
    priority: draft.priority,
    link: draft.link,
    note: draft.note,
    area_id: draft.areaId,
    category_id: draft.categoryId,
  };
}

export function useWishlist(initialData: WishlistData) {
  const supabase = useMemo(() => createClient(), []);

  const [items, setItems] = useState<Item[]>(initialData.items);
  const [areas, setAreas] = useState<Area[]>(initialData.areas);
  const [categories, setCategories] = useState<Category[]>(initialData.categories);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [areasRes, categoriesRes, itemsRes] = await Promise.all([
      supabase.from("areas").select("*").order("sort_order"),
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("items").select("*").order("status").order("created_at", { ascending: false }),
    ]);

    if (areasRes.error || categoriesRes.error || itemsRes.error) {
      setError("Não consegui atualizar os dados. Recarregue a página.");
      return;
    }

    setAreas(areasRes.data);
    setCategories(categoriesRes.data);
    setItems(itemsRes.data as Item[]);
    setError(null);
  }, [supabase]);

  // Mantém a lista em sincronia entre dispositivos sem refresh.
  useEffect(() => {
    const channel = supabase
      .channel("items-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "items" }, () => {
        void reload();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, reload]);

  const addItem = useCallback(
    async (draft: ItemDraft) => {
      const { error: insertError } = await supabase.from("items").insert(toRow(draft));
      if (insertError) setError("Não consegui adicionar o item.");
      else await reload();
    },
    [supabase, reload],
  );

  const updateItem = useCallback(
    async (id: string, draft: ItemDraft) => {
      const { error: updateError } = await supabase.from("items").update(toRow(draft)).eq("id", id);
      if (updateError) {
        setError("Não consegui salvar as alterações.");
        return false;
      }
      await reload();
      return true;
    },
    [supabase, reload],
  );

  const toggleStatus = useCallback(
    async (item: Item) => {
      const nextStatus = item.status === "pending" ? "purchased" : "pending";
      const { error: toggleError } = await supabase
        .from("items")
        .update({
          status: nextStatus,
          purchased_at: nextStatus === "purchased" ? new Date().toISOString() : null,
        })
        .eq("id", item.id);
      if (toggleError) setError("Não consegui atualizar o item.");
      else await reload();
    },
    [supabase, reload],
  );

  const updatePriority = useCallback(
    async (id: string, priority: Priority) => {
      const { error: priorityError } = await supabase
        .from("items")
        .update({ priority })
        .eq("id", id);
      if (priorityError) setError("Não consegui atualizar a prioridade.");
      else await reload();
    },
    [supabase, reload],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase.from("items").delete().eq("id", id);
      if (deleteError) setError("Não consegui remover o item.");
      else await reload();
    },
    [supabase, reload],
  );

  return {
    items,
    areas,
    categories,
    error,
    addItem,
    updateItem,
    toggleStatus,
    updatePriority,
    deleteItem,
  };
}
