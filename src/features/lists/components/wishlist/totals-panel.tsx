"use client";

import { useState } from "react";

import { cn } from "@/shared/lib/cn";
import { ChevronDownIcon } from "@/ui/icons";

import { formatPrice, type Totals } from "../../lib";

const LABEL = "text-ink-soft block text-[11px] font-semibold tracking-[0.06em] uppercase";

export function TotalsPanel({ totals }: { totals: Totals }) {
  const [open, setOpen] = useState(false);
  const groupsWithValue = totals.byGroup.filter((group) => group.remaining > 0 || group.spent > 0);

  return (
    <section className="bg-surface shadow-control mb-3 rounded-[10px]">
      <div className="flex flex-wrap items-end justify-between gap-4 px-4 py-3">
        <div>
          <span className={LABEL}>Falta comprar</span>
          <strong className="text-jade text-xl font-semibold tabular-nums">
            {formatPrice(totals.remaining)}
          </strong>
          {totals.potentialSaving > 0 ? (
            <p className="text-ink-soft mt-0.5 text-[12px]">
              {formatPrice(totals.remainingAtBest)} no melhor preço já visto — economia de{" "}
              {formatPrice(totals.potentialSaving)}
            </p>
          ) : null}
        </div>

        <div className="text-right">
          <span className={LABEL}>Já gasto</span>
          <strong className="text-lg font-semibold tabular-nums">
            {formatPrice(totals.spent)}
          </strong>
        </div>
      </div>

      {groupsWithValue.length > 0 ? (
        <>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
            className="border-line text-ink-soft hover:text-ink focus-visible:shadow-control-focus flex w-full cursor-pointer items-center justify-center gap-1.5 border-t px-4 py-2 text-[12px] font-medium transition-colors duration-100 focus-visible:outline-none"
          >
            {open ? "Ocultar" : "Ver"} por grupo
            <ChevronDownIcon
              className={cn("size-3.5 transition-transform duration-100", open && "rotate-180")}
            />
          </button>

          {open ? (
            <div className="border-line border-t px-4">
              {/* As duas colunas são rotuladas porque uma área já toda comprada
                  mostra R$ 0,00 em "falta" — sem o rótulo, parece erro. */}
              <div className="text-ink-soft flex items-baseline gap-3 py-1.5 text-[10.5px] font-semibold tracking-[0.06em] uppercase">
                <span className="min-w-0 flex-1">Grupo</span>
                <span className="w-24 shrink-0 text-right">Falta</span>
                <span className="w-24 shrink-0 text-right">Gasto</span>
              </div>

              <ul className="divide-line divide-y">
                {groupsWithValue.map((group) => (
                  <li
                    key={group.groupId ?? "sem-grupo"}
                    className="flex items-baseline gap-3 py-2 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {group.groupName}
                      <span className="text-ink-soft ml-2 text-[12px] max-sm:hidden">
                        {group.itemCount} {group.itemCount === 1 ? "item" : "itens"}
                      </span>
                    </span>
                    <span className="text-jade w-24 shrink-0 text-right font-semibold tabular-nums">
                      {formatPrice(group.remaining)}
                    </span>
                    <span className="text-ink-soft w-24 shrink-0 text-right tabular-nums">
                      {formatPrice(group.spent)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
