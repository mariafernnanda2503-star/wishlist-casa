"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { feedback } from "@/shared/lib/feedback";
import { createClient } from "@/shared/lib/supabase/client";

import { type PriceCheck } from "../types";

export type PriceSummary = {
  /** Observação mais recente. */
  latest: PriceCheck | null;
  /** Menor preço já registrado. */
  best: PriceCheck | null;
  /** `null` quando o item não tem alvo definido. */
  belowTarget: boolean | null;
};

function summarize(checks: PriceCheck[], target: number | null): PriceSummary {
  // Vêm ordenados do mais recente para o mais antigo.
  const latest = checks[0] ?? null;
  const best = checks.reduce<PriceCheck | null>(
    (lowest, check) => (lowest === null || check.price < lowest.price ? check : lowest),
    null,
  );

  return {
    latest,
    best,
    belowTarget: target === null || latest === null ? null : latest.price <= target,
  };
}

type Client = ReturnType<typeof createClient>;

/** Fora do hook para que a carga inicial e as recargas usem a mesma consulta. */
function fetchChecks(supabase: Client, itemId: string) {
  return supabase
    .from("price_checks")
    .select("*")
    .eq("item_id", itemId)
    .order("checked_at", { ascending: false });
}

export function usePriceHistory(itemId: string, target: number | null) {
  const supabase = useMemo(() => createClient(), []);
  // `null` enquanto carrega — diferente de `[]`, que é "não tem histórico".
  const [checks, setChecks] = useState<PriceCheck[] | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await fetchChecks(supabase, itemId);

    if (error) {
      feedback.error("Não consegui carregar o histórico de preços.", {
        event: "price_history.load_failed",
        error,
        context: { itemId },
      });
      return;
    }

    setChecks(data);
  }, [supabase, itemId]);

  // A carga inicial não passa por `load` porque a regra do React Compiler
  // recusa setState síncrono dentro de efeito; aqui ele vem depois do await.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { data } = await fetchChecks(supabase, itemId);
      if (!cancelled) setChecks(data ?? []);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, itemId]);

  const addCheck = useCallback(
    async (price: number, store: string | null) => {
      const { error } = await supabase
        .from("price_checks")
        .insert({ item_id: itemId, price, store, source: "manual" });

      if (error) {
        feedback.error("Não consegui registrar o preço.", {
          event: "price_history.add_failed",
          error,
          context: { itemId },
        });
        return false;
      }

      // Registro de preço é ação de pessoa, não mudança de coluna, então
      // nenhum trigger o captura — a trilha depende deste insert.
      await supabase.from("item_events").insert({
        item_id: itemId,
        type: "price_registered",
        to_value: String(price),
        payload: store ? { store } : null,
      });

      await load();
      feedback.success("Preço registrado.", {
        event: "price_history.add_succeeded",
        context: { itemId },
      });
      return true;
    },
    [supabase, itemId, load],
  );

  const updateCheck = useCallback(
    async (check: PriceCheck, price: number, store: string | null) => {
      const { error } = await supabase
        .from("price_checks")
        .update({ price, store })
        .eq("id", check.id)
        .eq("item_id", itemId);

      if (error) {
        feedback.error("Não consegui atualizar o registro.", {
          event: "price_history.update_failed",
          error,
          context: { itemId, checkId: check.id },
        });
        return false;
      }

      await load();
      feedback.success("Registro atualizado.", {
        event: "price_history.update_succeeded",
        context: { itemId, checkId: check.id },
      });
      return true;
    },
    [supabase, itemId, load],
  );

  const removeCheck = useCallback(
    async (checkId: string) => {
      const { error } = await supabase.from("price_checks").delete().eq("id", checkId);

      if (error) {
        feedback.error("Não consegui remover o registro.", {
          event: "price_history.remove_failed",
          error,
          context: { itemId, checkId },
        });
        return false;
      }

      await load();
      feedback.success("Registro removido.", {
        event: "price_history.remove_succeeded",
        context: { itemId, checkId },
      });
      return true;
    },
    [supabase, itemId, load],
  );

  const summary = useMemo(() => summarize(checks ?? [], target), [checks, target]);

  return { checks, summary, addCheck, updateCheck, removeCheck };
}
