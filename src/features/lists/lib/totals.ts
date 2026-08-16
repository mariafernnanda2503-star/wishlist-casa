import { type Group, type Item, type PriceSummary } from "../types";

import { isAcquired } from "./constants";

export type GroupTotal = {
  groupId: string | null;
  groupName: string;
  /** Custo do que ainda falta comprar, no preço mais recente conhecido. */
  remaining: number;
  /** O mesmo conjunto, se cada item saísse pelo menor preço já visto. */
  remainingAtBest: number;
  /** Quanto já foi gasto com o que saiu da lista. */
  spent: number;
  itemCount: number;
};

export type Totals = {
  remaining: number;
  remainingAtBest: number;
  spent: number;
  /** Diferença entre o preço atual e o melhor já visto — o que esperar renderia. */
  potentialSaving: number;
  byGroup: GroupTotal[];
};

/**
 * Qual preço vale para um item que ainda falta comprar.
 *
 * A ordem é da medição mais confiável para a menos: o último preço observado
 * ganha da estimativa digitada, porque foi visto de verdade. Sem nenhum dos
 * dois o item não entra na conta — melhor um total honestamente incompleto do
 * que um número inventado.
 */
function unitPrice(item: Item, summary: PriceSummary | undefined): number | null {
  return summary?.latest_price ?? item.price;
}

function unitBestPrice(item: Item, summary: PriceSummary | undefined): number | null {
  return summary?.best_price ?? summary?.latest_price ?? item.price;
}

/** Quanto o item custou de fato; cai para a estimativa quando ninguém anotou. */
function paidPrice(item: Item, summary: PriceSummary | undefined): number | null {
  return item.purchased_price ?? unitPrice(item, summary);
}

export function computeTotals(items: Item[], groups: Group[], summaries: PriceSummary[]): Totals {
  const summaryByItem = new Map(summaries.map((summary) => [summary.item_id, summary]));
  const groupNameById = new Map(groups.map((group) => [group.id, group.name]));
  const buckets = new Map<string, GroupTotal>();

  function bucketFor(groupId: string | null): GroupTotal {
    const key = groupId ?? "";
    const existing = buckets.get(key);
    if (existing) return existing;

    const created: GroupTotal = {
      groupId,
      groupName: groupId === null ? "Sem grupo" : (groupNameById.get(groupId) ?? "Sem grupo"),
      remaining: 0,
      remainingAtBest: 0,
      spent: 0,
      itemCount: 0,
    };
    buckets.set(key, created);
    return created;
  }

  const totals: Totals = {
    remaining: 0,
    remainingAtBest: 0,
    spent: 0,
    potentialSaving: 0,
    byGroup: [],
  };

  for (const item of items) {
    // `archived` é desistência: não falta comprar nem foi gasto.
    if (item.status === "archived") continue;

    const summary = summaryByItem.get(item.id);
    const bucket = bucketFor(item.group_id);
    bucket.itemCount += 1;

    if (isAcquired(item.status)) {
      const paid = paidPrice(item, summary);
      if (paid !== null) {
        const value = paid * item.quantity;
        bucket.spent += value;
        totals.spent += value;
      }
      continue;
    }

    const current = unitPrice(item, summary);
    const best = unitBestPrice(item, summary);
    if (current !== null) {
      const value = current * item.quantity;
      bucket.remaining += value;
      totals.remaining += value;
    }
    if (best !== null) {
      const value = best * item.quantity;
      bucket.remainingAtBest += value;
      totals.remainingAtBest += value;
    }
  }

  totals.potentialSaving = Math.max(0, totals.remaining - totals.remainingAtBest);
  totals.byGroup = [...buckets.values()].sort((a, b) => b.remaining - a.remaining);

  return totals;
}
