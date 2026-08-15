"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { feedback } from "@/shared/lib/feedback";
import { logger } from "@/shared/lib/logger";
import { createClient } from "@/shared/lib/supabase/client";

import { normalizeText } from "../lib";
import {
  type Group,
  type ItemType,
  type Item,
  type ItemDraft,
  type Priority,
  type WishlistData,
} from "../types";

/** Colunas de `items` escritas a partir de um `ItemDraft`. */
function toRow(draft: ItemDraft, listId: string) {
  return {
    list_id: listId,
    name: draft.name,
    price: draft.price,
    price_target: draft.priceTarget,
    quantity: draft.quantity,
    priority: draft.priority,
    link: draft.link,
    note: draft.note,
    group_id: draft.groupId,
    type_id: draft.typeId,
  };
}

export function useWishlist(initialData: WishlistData, listId: string, workspaceId: string) {
  const supabase = useMemo(() => createClient(), []);

  const [items, setItems] = useState<Item[]>(initialData.items);
  const [groups, setGroups] = useState<Group[]>(initialData.groups);
  const [types, setTypes] = useState<ItemType[]>(initialData.types);
  const reload = useCallback(async () => {
    const [groupsRes, typesRes, itemsRes] = await Promise.all([
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
        .is("deleted_at", null)
        .order("status")
        .order("created_at", { ascending: false }),
    ]);

    if (groupsRes.error || typesRes.error || itemsRes.error) {
      feedback.error("Não consegui atualizar os dados. Recarregue a página.", {
        event: "wishlist.reload_failed",
        error: groupsRes.error ?? typesRes.error ?? itemsRes.error,
      });
      return false;
    }

    setGroups(groupsRes.data);
    setTypes(typesRes.data);
    setItems(itemsRes.data as Item[]);
    logger.info("wishlist.reload_succeeded", { itemCount: itemsRes.data.length });
    return true;
  }, [supabase, listId, workspaceId]);

  // Mantém a lista em sincronia entre dispositivos sem refresh.
  useEffect(() => {
    const channel = supabase
      .channel("wishlist-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "items" }, () => {
        void reload();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "item_groups" }, () => {
        void reload();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "item_types" }, () => {
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

  const createGroup = useCallback(
    async (rawName: string) => {
      const name = rawName.trim();
      const existing = groups.find((group) => normalizeText(group.name) === normalizeText(name));
      if (existing) return existing.id;

      const sortOrder =
        groups.reduce((highest, group) => Math.max(highest, group.sort_order), 0) + 1;
      const { data, error: insertError } = await supabase
        .from("item_groups")
        .insert({ name, sort_order: sortOrder, workspace_id: workspaceId })
        .select()
        .single();

      if (insertError) {
        feedback.error("Não consegui adicionar o grupo.", {
          event: "wishlist.group_add_failed",
          error: insertError,
        });
        return null;
      }

      setGroups((current) =>
        current.some((group) => group.id === data.id) ? current : [...current, data],
      );
      feedback.success("Grupo adicionado.", {
        event: "wishlist.group_add_succeeded",
        context: { groupId: data.id },
      });
      return data.id;
    },
    [groups, supabase, workspaceId],
  );

  const createType = useCallback(
    async (rawName: string) => {
      const name = rawName.trim();
      const existing = types.find((type) => normalizeText(type.name) === normalizeText(name));
      if (existing) return existing.id;

      const sortOrder = types.reduce((highest, type) => Math.max(highest, type.sort_order), 0) + 1;
      const { data, error: insertError } = await supabase
        .from("item_types")
        .insert({ name, sort_order: sortOrder, workspace_id: workspaceId })
        .select()
        .single();

      if (insertError) {
        feedback.error("Não consegui adicionar o tipo.", {
          event: "wishlist.type_add_failed",
          error: insertError,
        });
        return null;
      }

      setTypes((current) =>
        current.some((type) => type.id === data.id) ? current : [...current, data],
      );
      feedback.success("Tipo adicionado.", {
        event: "wishlist.type_add_succeeded",
        context: { typeId: data.id },
      });
      return data.id;
    },
    [types, supabase, workspaceId],
  );

  const addItem = useCallback(
    async (draft: ItemDraft) => {
      const { error: insertError } = await supabase.from("items").insert(toRow(draft, listId));
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
    [supabase, reload, listId],
  );

  const updateItem = useCallback(
    async (id: string, draft: ItemDraft) => {
      const { error: updateError } = await supabase
        .from("items")
        .update(toRow(draft, listId))
        .eq("id", id);
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
    [supabase, reload, listId],
  );

  const toggleStatus = useCallback(
    async (item: Item) => {
      // O clique na marca continua sendo o atalho de sempre: quero ↔ comprei.
      // Os estados intermediários vivem no painel do item, para quem quiser.
      const nextStatus = item.status === "wanted" ? "purchased" : "wanted";
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
    groups,
    types,
    createGroup,
    createType,
    addItem,
    updateItem,
    toggleStatus,
    updatePriority,
    deleteItem,
  };
}
