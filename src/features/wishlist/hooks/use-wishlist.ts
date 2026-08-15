"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { feedback } from "@/shared/lib/feedback";
import { logger } from "@/shared/lib/logger";
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
  const reload = useCallback(async () => {
    const [areasRes, categoriesRes, itemsRes] = await Promise.all([
      supabase.from("areas").select("*").order("sort_order"),
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("items").select("*").order("status").order("created_at", { ascending: false }),
    ]);

    if (areasRes.error || categoriesRes.error || itemsRes.error) {
      feedback.error("Não consegui atualizar os dados. Recarregue a página.", {
        event: "wishlist.reload_failed",
        error: areasRes.error ?? categoriesRes.error ?? itemsRes.error,
      });
      return false;
    }

    setAreas(areasRes.data);
    setCategories(categoriesRes.data);
    setItems(itemsRes.data as Item[]);
    logger.info("wishlist.reload_succeeded", { itemCount: itemsRes.data.length });
    return true;
  }, [supabase]);

  // Mantém a lista em sincronia entre dispositivos sem refresh.
  useEffect(() => {
    const channel = supabase
      .channel("items-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "items" }, () => {
        void reload();
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") logger.info("wishlist.realtime_connected");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          logger.warn("wishlist.realtime_connection_unstable", { status });
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, reload]);

  const addItem = useCallback(
    async (draft: ItemDraft) => {
      const { error: insertError } = await supabase.from("items").insert(toRow(draft));
      if (insertError) {
        feedback.error("Não consegui adicionar o item.", {
          event: "wishlist.item_add_failed",
          error: insertError,
        });
        return false;
      }
      if (await reload()) {
        feedback.success("Item adicionado.", { event: "wishlist.item_add_succeeded" });
      }
      return true;
    },
    [supabase, reload],
  );

  const updateItem = useCallback(
    async (id: string, draft: ItemDraft) => {
      const { error: updateError } = await supabase.from("items").update(toRow(draft)).eq("id", id);
      if (updateError) {
        feedback.error("Não consegui salvar as alterações.", {
          event: "wishlist.item_update_failed",
          error: updateError,
          context: { itemId: id },
        });
        return false;
      }
      if (await reload()) {
        feedback.success("Alterações salvas.", {
          event: "wishlist.item_update_succeeded",
          context: { itemId: id },
        });
      }
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
      if (toggleError) {
        feedback.error("Não consegui atualizar o item.", {
          event: "wishlist.item_status_failed",
          error: toggleError,
          context: { itemId: item.id },
        });
        return;
      }

      if (await reload()) {
        feedback.success(
          nextStatus === "purchased" ? "Item marcado como comprado." : "Item reaberto.",
          {
            event: "wishlist.item_status_succeeded",
            context: { itemId: item.id, status: nextStatus },
          },
        );
      }
    },
    [supabase, reload],
  );

  const updatePriority = useCallback(
    async (id: string, priority: Priority) => {
      const { error: priorityError } = await supabase
        .from("items")
        .update({ priority })
        .eq("id", id);
      if (priorityError) {
        feedback.error("Não consegui atualizar a prioridade.", {
          event: "wishlist.item_priority_failed",
          error: priorityError,
          context: { itemId: id },
        });
        return;
      }

      if (await reload()) {
        feedback.success("Prioridade atualizada.", {
          event: "wishlist.item_priority_succeeded",
          context: { itemId: id, priority },
        });
      }
    },
    [supabase, reload],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase.from("items").delete().eq("id", id);
      if (deleteError) {
        feedback.error("Não consegui remover o item.", {
          event: "wishlist.item_delete_failed",
          error: deleteError,
          context: { itemId: id },
        });
        return;
      }

      if (await reload()) {
        feedback.success("Item removido.", {
          event: "wishlist.item_delete_succeeded",
          context: { itemId: id },
        });
      }
    },
    [supabase, reload],
  );

  return {
    items,
    areas,
    categories,
    addItem,
    updateItem,
    toggleStatus,
    updatePriority,
    deleteItem,
  };
}
