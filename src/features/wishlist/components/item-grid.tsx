"use client";

import { type MouseEvent } from "react";

import { cn } from "@/shared/lib/cn";
import { Checkbox } from "@/ui/primitives";

import { formatPrice } from "../lib";
import { type Area, type Category, type Item, type Priority } from "../types";

import { ItemLink } from "./item-actions";
import { PriorityCell } from "./priority-cell";
import { Tag } from "./tag";

type ItemGridProps = {
  items: Item[];
  areas: Area[];
  categories: Category[];
  emptyMessage: string;
  onOpen: (id: string) => void;
  onToggleStatus: (item: Item) => void;
  onChangePriority: (id: string, priority: Priority) => void;
};

export function ItemGrid({
  items,
  areas,
  categories,
  emptyMessage,
  onOpen,
  onToggleStatus,
  onChangePriority,
}: ItemGridProps) {
  if (items.length === 0) {
    return <p className="text-ink-soft px-0.5 pt-2 pb-5 text-sm">{emptyMessage}</p>;
  }

  const areaName = (id: string | null) => areas.find((area) => area.id === id)?.name ?? "—";
  const categoryName = (id: string | null) =>
    categories.find((category) => category.id === id)?.name ?? "—";

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 max-md:grid-cols-1">
      {items.map((item) => {
        const purchased = item.status === "purchased";

        function handleCardClick(event: MouseEvent<HTMLElement>) {
          if ((event.target as HTMLElement).closest("button, a, input, label")) return;
          onOpen(item.id);
        }

        return (
          <article
            key={item.id}
            onClick={handleCardClick}
            className={cn(
              "bg-surface shadow-control hover:bg-surface-alt hover:shadow-control-hover flex min-h-36 cursor-pointer flex-col rounded-[8px] p-3.5 transition-[background-color,box-shadow] duration-100",
              purchased && "opacity-55",
            )}
          >
            <div className="flex items-start gap-2.5">
              <Checkbox
                checked={purchased}
                onChange={() => onToggleStatus(item)}
                label={`Marcar ${item.name} como ${purchased ? "pendente" : "comprado"}`}
                labelClassName="sr-only"
                indicatorClassName="mt-0.5 size-5 [&_svg]:size-3"
              />
              <div className="min-w-0 flex-1">
                <h3>
                  <button
                    type="button"
                    title={item.note ?? undefined}
                    onClick={() => onOpen(item.id)}
                    className="hover:text-accent focus-visible:text-accent cursor-pointer text-left font-semibold focus-visible:outline-none"
                  >
                    {item.name}
                  </button>
                </h3>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <PriorityCell item={item} onChange={onChangePriority} />
              <Tag className="bg-accent-soft text-accent">{areaName(item.area_id)}</Tag>
              <Tag className="bg-category-soft text-category">{categoryName(item.category_id)}</Tag>
            </div>

            <div className="border-line mt-auto flex items-center gap-2 border-t pt-3">
              {item.quantity > 1 ? (
                <span className="text-ink-soft font-semibold">×{item.quantity}</span>
              ) : null}
              <span className="text-accent font-semibold tabular-nums">
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
