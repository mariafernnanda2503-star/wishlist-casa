"use client";

import { type SupabaseClient } from "@supabase/supabase-js";
import { useEffect } from "react";

import { logger } from "@/shared/lib/logger";
import { type Database } from "@/shared/types/database";

import { type Item } from "../types";

type Client = SupabaseClient<Database>;

type Handlers = {
  onItemChanged: (item: Item) => void;
  onItemRemoved: (id: string) => void;
  onTaxonomyChanged: () => void;
  onPriceChanged: () => void;
};

/**
 * Um canal só para as quatro tabelas que a tela observa.
 *
 * Canal por tabela abriria quatro conexões para o mesmo fim. E o filtro de
 * `items` é aplicado no servidor: sem ele, mudança em qualquer lista de
 * qualquer espaço acordaria esta tela.
 */
export function useListRealtime(supabase: Client, listId: string, handlers: Handlers) {
  const { onItemChanged, onItemRemoved, onTaxonomyChanged, onPriceChanged } = handlers;

  useEffect(() => {
    const channel = supabase
      .channel("list-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items", filter: `list_id=eq.${listId}` },
        (payload) => {
          // O próprio payload traz a linha: aplicar direto evita refazer a
          // consulta inteira a cada mudança de uma coluna.
          if (payload.eventType === "DELETE") {
            const removed = payload.old as Partial<Item>;
            if (removed.id) onItemRemoved(removed.id);
            return;
          }
          onItemChanged(payload.new as Item);
        },
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "item_groups" }, () => {
        onTaxonomyChanged();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "item_types" }, () => {
        onTaxonomyChanged();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "wanters" }, () => {
        onTaxonomyChanged();
      })
      // Preço registrado muda o total da lista. Sem isto, o card só acompanha
      // quem registrou — e só depois de recarregar a página.
      .on("postgres_changes", { event: "*", schema: "public", table: "price_checks" }, () => {
        onPriceChanged();
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") logger.info("list.realtime_connected");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          logger.warn("list.realtime_connection_unstable", { status });
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, listId, onItemChanged, onItemRemoved, onTaxonomyChanged, onPriceChanged]);
}
