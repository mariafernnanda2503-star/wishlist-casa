"use client";

import { type SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useState } from "react";

import { type Database } from "@/shared/types/database";

import { listQueries } from "../queries/list-queries";
import { type PriceSummary } from "../types";

type Client = SupabaseClient<Database>;

/**
 * Último e melhor preço por item — é o que alimenta os totais.
 *
 * Único conjunto que não dá para recalcular no cliente: a view agrega o
 * histórico inteiro de `price_checks`, que o cliente não carrega. Por isso
 * recarrega em vez de encaixar a mudança localmente.
 */
export function usePriceSummaries(initial: PriceSummary[], supabase: Client) {
  const [priceSummaries, setPriceSummaries] = useState<PriceSummary[]>(initial);

  const reload = useCallback(async () => {
    const { data } = await listQueries.priceSummaries(supabase);
    if (data) setPriceSummaries(data as PriceSummary[]);
  }, [supabase]);

  return { priceSummaries, reload };
}
