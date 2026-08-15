"use client";

import { cn } from "@/shared/lib/cn";

import { formatPrice } from "../lib";
import { type PriceCheck } from "../types";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

type PriceSparklineProps = {
  checks: PriceCheck[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/** Gráfico curto e interativo, ligado à seleção da lista de registros. */
export function PriceSparkline({ checks, selectedId, onSelect }: PriceSparklineProps) {
  if (checks.length < 2) return null;

  const latest = checks[0];
  const oldest = checks[checks.length - 1];
  if (!latest || !oldest) return null;

  const chronological = [...checks].reverse();
  const prices = chronological.map((check) => check.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const selected = checks.find((check) => check.id === selectedId) ?? latest;

  const points = chronological.map((check, index) => ({
    check,
    x: (index / (chronological.length - 1)) * 100,
    y: 10 + (1 - (check.price - min) / span) * 80,
  }));

  const falling = latest.price <= oldest.price;
  const polyline = points.map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");

  return (
    <figure className="bg-surface-alt shadow-control rounded-[8px] px-3 py-3 sm:px-4">
      <figcaption className="flex min-w-0 items-end justify-between gap-3">
        <div className="min-w-0">
          <span className="text-ink-soft block text-[10.5px] font-semibold tracking-[0.06em] uppercase">
            Evolução
          </span>
          <strong className="block truncate text-sm font-semibold tabular-nums">
            {formatPrice(selected.price)}
          </strong>
        </div>
        <span className="text-ink-soft truncate text-right text-[12px]">
          {selected.store ?? "Loja não informada"} ·{" "}
          {dateFormatter.format(new Date(selected.checked_at))}
        </span>
      </figcaption>

      <div className={cn("relative mt-2 h-20", falling ? "text-accent" : "text-danger")}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full overflow-visible"
          aria-hidden="true"
        >
          <line x1="0" y1="10" x2="100" y2="10" className="stroke-line" strokeWidth="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" className="stroke-line" strokeWidth="0.5" />
          <line x1="0" y1="90" x2="100" y2="90" className="stroke-line" strokeWidth="0.5" />
          <polygon points={`0,100 ${polyline} 100,100`} fill="currentColor" fillOpacity="0.08" />
          <polyline
            points={polyline}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {points.map(({ check, x, y }) => {
          const active = check.id === selected.id;

          return (
            <button
              key={check.id}
              type="button"
              onClick={() => onSelect(check.id)}
              onPointerEnter={() => onSelect(check.id)}
              onFocus={() => onSelect(check.id)}
              aria-label={`${formatPrice(check.price)}, ${check.store ?? "loja não informada"}, ${dateFormatter.format(new Date(check.checked_at))}`}
              aria-pressed={active}
              className={cn(
                "bg-surface focus-visible:shadow-control-focus absolute size-3 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-2 border-current transition-[transform,background-color] duration-100 focus-visible:outline-none",
                active && (falling ? "bg-accent-soft scale-125" : "bg-danger-soft scale-125"),
              )}
              style={{ left: `${x}%`, top: `${y}%` }}
            />
          );
        })}
      </div>
    </figure>
  );
}
