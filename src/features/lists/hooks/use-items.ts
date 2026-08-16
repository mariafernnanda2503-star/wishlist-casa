"use client";

import { type SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useState } from "react";

import { feedback } from "@/shared/lib/feedback";
import { type Database } from "@/shared/types/database";

import { listQueries } from "../queries/list-queries";
import { type Item, type ItemDraft, type Priority } from "../types";

type Client = SupabaseClient<Database>;

/**
 * Mesma ordenação da consulta (`order status, created_at desc`), para a lista
 * local não se reorganizar sozinha quando uma linha muda.
 */
function byQueryOrder(a: Item, b: Item) {
  return a.status.localeCompare(b.status) || b.created_at.localeCompare(a.created_at);
}

/**
 * Encaixa uma linha na lista local: entra, substitui ou sai.
 *
 * Sai quando foi excluída ou mudou de lista — as duas coisas significam a mesma
 * para esta tela. Chaveado por `id`, então a escrita local e o eco do realtime
 * convergem para o mesmo estado em vez de duplicar.
 */
function applyItemChange(current: Item[], next: Item, listId: string): Item[] {
  if (next.deleted_at !== null || next.list_id !== listId) {
    return current.filter((item) => item.id !== next.id);
  }

  const exists = current.some((item) => item.id === next.id);
  const merged = exists
    ? current.map((item) => (item.id === next.id ? next : item))
    : [...current, next];

  return merged.sort(byQueryOrder);
}

/** Colunas de `items` escritas a partir de um `ItemDraft`. */
function toRow(draft: ItemDraft, listId: string) {
  return {
    list_id: listId,
    name: draft.name,
    price: draft.price,
    price_target: draft.priceTarget,
    quantity: draft.quantity,
    unit: draft.unit,
    priority: draft.priority,
    link: draft.link,
    note: draft.note,
    group_id: draft.groupId,
    type_id: draft.typeId,
  };
}

/** Os itens da lista aberta: estado, escrita e encaixe de mudanças vindas de fora. */
export function useItems(initial: Item[], listId: string, supabase: Client) {
  const [items, setItems] = useState<Item[]>(initial);

  const apply = useCallback(
    (next: Item) => setItems((current) => applyItemChange(current, next, listId)),
    [listId],
  );

  const remove = useCallback(
    (id: string) => setItems((current) => current.filter((item) => item.id !== id)),
    [],
  );

  const reload = useCallback(async () => {
    const { data, error } = await listQueries.items(supabase, listId);
    if (error) return false;
    setItems(data as Item[]);
    return true;
  }, [supabase, listId]);

  const addItem = useCallback(
    async (draft: ItemDraft) => {
      const { data, error } = await supabase
        .from("items")
        .insert(toRow(draft, listId))
        .select()
        .single();

      if (error) {
        feedback.error("Não consegui adicionar o item.", {
          event: "list.item_add_failed",
          error,
        });
        return false;
      }

      apply(data as Item);
      feedback.success("Item adicionado.", { event: "list.item_add_succeeded" });
      return true;
    },
    [supabase, listId, apply],
  );

  const updateItem = useCallback(
    async (id: string, draft: ItemDraft) => {
      const { data, error } = await supabase
        .from("items")
        .update(toRow(draft, listId))
        .eq("id", id)
        .select()
        .single();

      if (error) {
        feedback.error("Não consegui salvar as alterações.", {
          event: "list.item_update_failed",
          error,
          context: { itemId: id },
        });
        return false;
      }

      apply(data as Item);
      feedback.success("Alterações salvas.", {
        event: "list.item_update_succeeded",
        context: { itemId: id },
      });
      return true;
    },
    [supabase, listId, apply],
  );

  const toggleStatus = useCallback(
    async (item: Item) => {
      // O clique na marca continua sendo o atalho de sempre: quero ↔ comprei.
      // Os estados intermediários vivem no painel do item, para quem quiser.
      const nextStatus = item.status === "wanted" ? "purchased" : "wanted";
      const { data, error } = await supabase
        .from("items")
        .update({
          status: nextStatus,
          purchased_at: nextStatus === "purchased" ? new Date().toISOString() : null,
        })
        .eq("id", item.id)
        .select()
        .single();

      if (error) {
        feedback.error("Não consegui atualizar o item.", {
          event: "list.item_status_failed",
          error,
          context: { itemId: item.id },
        });
        return;
      }

      apply(data as Item);
      feedback.success(
        nextStatus === "purchased" ? "Item marcado como comprado." : "Item reaberto.",
        {
          event: "list.item_status_succeeded",
          context: { itemId: item.id, status: nextStatus },
        },
      );
    },
    [supabase, apply],
  );

  const updatePriority = useCallback(
    async (id: string, priority: Priority) => {
      const { data, error } = await supabase
        .from("items")
        .update({ priority })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        feedback.error("Não consegui atualizar a prioridade.", {
          event: "list.item_priority_failed",
          error,
          context: { itemId: id },
        });
        return;
      }

      apply(data as Item);
      feedback.success("Prioridade atualizada.", {
        event: "list.item_priority_succeeded",
        context: { itemId: id, priority },
      });
    },
    [supabase, apply],
  );

  /**
   * Marca `deleted_at` em vez de apagar a linha.
   *
   * `price_checks` e `item_events` têm `on delete cascade` para `items`:
   * apagar de verdade levaria junto todo o histórico de preço e a trilha. O
   * registro some das telas (as consultas filtram `deleted_at is null`) mas
   * continua no banco, e o trigger grava o evento `deleted`.
   */
  const deleteItem = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("items")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        feedback.error("Não consegui remover o item.", {
          event: "list.item_delete_failed",
          error,
          context: { itemId: id },
        });
        return;
      }

      remove(id);
      feedback.success("Item removido.", {
        event: "list.item_delete_succeeded",
        context: { itemId: id },
      });
    },
    [supabase, remove],
  );

  return {
    items,
    apply,
    remove,
    reload,
    addItem,
    updateItem,
    toggleStatus,
    updatePriority,
    deleteItem,
  };
}
