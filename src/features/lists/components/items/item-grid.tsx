"use client";

import { type MouseEvent } from "react";

import { cn } from "@/shared/lib/cn";
import { Checkbox } from "@/ui/primitives";

import { formatPrice, isAcquired, quantityBadge, type NameLookup } from "../../lib";
import { type Item, type Priority } from "../../types";

import { ItemLink } from "./item-actions";
import { PriorityCell } from "./priority-cell";

type ItemGridProps = {
  items: Item[];
  names: NameLookup;
  emptyMessage: string;
  onOpen: (id: string) => void;
  onToggleStatus: (item: Item) => void;
  onChangePriority: (id: string, priority: Priority) => void;
};

export function ItemGrid({
  items,
  names,
  emptyMessage,
  onOpen,
  onToggleStatus,
  onChangePriority,
}: ItemGridProps) {
  if (items.length === 0) {
    return <p className="text-ink-soft px-0.5 pt-2 pb-5 text-sm">{emptyMessage}</p>;
  }

  return (
    <div className="mb-6 grid grid-cols-2 gap-2.5 sm:gap-3">
      {items.map((item) => {
        const purchased = isAcquired(item.status);
        const quantityText = quantityBadge(item.quantity, item.unit);

        function handleCardClick(event: MouseEvent<HTMLElement>) {
          if ((event.target as HTMLElement).closest("button, a, input, label")) return;
          onOpen(item.id);
        }

        return (
          <article
            key={item.id}
            onClick={handleCardClick}
            className={cn(
              "bg-surface shadow-control hover:bg-surface-alt hover:shadow-control-hover flex min-h-[164px] min-w-0 cursor-pointer flex-col rounded-[8px] p-3 transition-[background-color,box-shadow] duration-100 sm:p-3.5",
              purchased && "opacity-55",
            )}
          >
            <div className="flex min-w-0 items-start gap-2.5">
              <Checkbox
                checked={purchased}
                onChange={() => onToggleStatus(item)}
                label={`Marcar ${item.name} como ${purchased ? "pendente" : "comprado"}`}
                labelClassName="sr-only"
                className="max-sm:-m-2 max-sm:p-2"
                indicatorClassName="mt-0.5 size-5 [&_svg]:size-3"
              />
              <div className="min-w-0 flex-1">
                <h3>
                  <button
                    type="button"
                    title={item.note ?? undefined}
                    onClick={() => onOpen(item.id)}
                    className="hover:text-jade focus-visible:text-jade line-clamp-2 min-h-10 max-w-full cursor-pointer text-left text-sm leading-5 font-semibold break-words focus-visible:outline-none"
                  >
                    {item.name}
                  </button>
                </h3>
              </div>
            </div>

            <div className="mt-2.5 flex min-w-0 items-center gap-1.5">
              <PriorityCell item={item} onChange={onChangePriority} />
            </div>

            <p
              title={`${names.group(item.group_id)} · ${names.type(item.type_id)}`}
              className="text-ink-soft mt-2 truncate text-[11.5px]"
            >
              {quantityText ? `${quantityText} · ` : ""}
              {names.group(item.group_id)} · {names.type(item.type_id)}
            </p>

            <div className="border-line mt-auto flex min-w-0 items-center gap-2 border-t pt-2.5">
              <span className="text-jade min-w-0 truncate text-[13px] font-semibold tabular-nums sm:text-sm">
                {formatPrice(item.price)}
              </span>
              {item.link ? (
                <span className="ml-auto">
                  <ItemLink link={item.link} />
                </span>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
