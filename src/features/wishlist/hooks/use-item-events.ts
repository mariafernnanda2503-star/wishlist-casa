"use client";

import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/shared/lib/supabase/client";

import { type ItemEvent } from "../types";

type Client = ReturnType<typeof createClient>;

function fetchEvents(supabase: Client, itemId: string) {
  return supabase
    .from("item_events")
    .select("*")
    .eq("item_id", itemId)
    .order("created_at", { ascending: false });
}

/**
 * A trilha é só de leitura: quem escreve são os triggers do banco e as ações
 * do app.
 *
 * `refreshKey` existe porque o painel do item não remonta quando algo acontece
 * dentro dele — registrar um preço gera um evento que a trilha não veria.
 * Mudar a chave é o sinal de "busque de novo".
 */
export function useItemEvents(itemId: string, refreshKey = 0) {
  const supabase = useMemo(() => createClient(), []);
  const [events, setEvents] = useState<ItemEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { data } = await fetchEvents(supabase, itemId);
      if (!cancelled) setEvents(data ?? []);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, itemId, refreshKey]);

  return events;
}
