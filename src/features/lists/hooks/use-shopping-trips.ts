"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { feedback } from "@/shared/lib/feedback";
import { createClient } from "@/shared/lib/supabase/client";

import { type Trip, type TripLine, type TripLineInput } from "../types";

type Client = ReturnType<typeof createClient>;

/** Linha sem preço não entra no total; a ida vale mesmo assim. */
function sumLines(lines: TripLine[]): number {
  return lines.reduce((total, line) => total + (line.unit_price ?? 0) * line.quantity, 0);
}

/**
 * Fora do hook para a carga inicial e as recargas usarem a mesma consulta.
 *
 * As linhas vêm embutidas em vez de numa segunda ida ao banco: o histórico
 * precisa delas para abrir o detalhe, e o total sai da soma delas — a view
 * `shopping_trip_totals` fica para consulta em SQL.
 */
function fetchTrips(supabase: Client, listId: string) {
  return supabase
    .from("shopping_trips")
    .select("*, shopping_trip_items(*)")
    .eq("list_id", listId)
    .order("shopped_at", { ascending: false });
}

type TripRow = Omit<Trip, "lines" | "total"> & { shopping_trip_items: TripLine[] };

function toTrips(rows: TripRow[]): Trip[] {
  return rows.map(({ shopping_trip_items: lines, ...trip }) => ({
    ...trip,
    lines,
    total: sumLines(lines),
  }));
}

export type CloseTripInput = {
  store: string;
  /** ISO. O diálogo manda meio-dia local, para o fuso não empurrar de dia. */
  shoppedAt: string;
  note: string;
  lines: TripLineInput[];
};

/** As idas ao mercado de uma lista: histórico e fechamento. */
export function useShoppingTrips(listId: string) {
  const supabase = useMemo(() => createClient(), []);
  // `null` enquanto carrega — diferente de `[]`, que é "nunca fechou nenhuma".
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [closing, setClosing] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await fetchTrips(supabase, listId);

    if (error) {
      feedback.error("Não consegui carregar as compras anteriores.", {
        event: "shopping_trips.load_failed",
        error,
        context: { listId },
      });
      return;
    }

    setTrips(toTrips(data));
  }, [supabase, listId]);

  // A carga inicial não passa por `load` porque a regra do React Compiler
  // recusa setState síncrono dentro de efeito; aqui ele vem depois do await.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { data } = await fetchTrips(supabase, listId);
      if (!cancelled) setTrips(data ? toTrips(data) : []);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, listId]);

  /**
   * Uma chamada só para as quatro escritas: criar a ida, congelar as linhas,
   * alimentar o histórico de preço e devolver a lista ao início. Feito daqui em
   * quatro requisições, uma falha no meio deixaria lista zerada sem histórico.
   */
  const closeTrip = useCallback(
    async (input: CloseTripInput) => {
      if (closing) return false;

      setClosing(true);
      const { error } = await supabase.rpc("close_shopping_trip", {
        p_list_id: listId,
        p_store: input.store,
        p_shopped_at: input.shoppedAt,
        p_note: input.note,
        p_lines: input.lines,
      });
      setClosing(false);

      if (error) {
        feedback.error("Não consegui fechar a compra.", {
          event: "shopping_trips.close_failed",
          error,
          context: { listId },
        });
        return false;
      }

      await load();
      feedback.success("Compra registrada. A lista está pronta para a próxima.", {
        event: "shopping_trips.close_succeeded",
        context: { listId, lineCount: input.lines.length },
      });
      return true;
    },
    [supabase, listId, closing, load],
  );

  return { trips, closing, closeTrip };
}
