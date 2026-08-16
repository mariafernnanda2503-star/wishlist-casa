"use client";

import { useMemo, useState } from "react";

import { cn } from "@/shared/lib/cn";
import { SortIcon } from "@/ui/icons";

import { PRIORITY_ORDER, type NameLookup } from "../lib";
import { type Item, type Priority } from "../types";

import { ItemRow } from "./item-row";

const HEAD_CELL =
  "bg-surface-alt shadow-table-header p-0 text-left text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap text-ink-soft uppercase transition-colors duration-100";

type SortKey = "name" | "priority" | "group" | "type" | "quantity" | "price";
type SortState = { key: SortKey; direction: "asc" | "desc" };

const COLLATOR = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });

type SortableHeadProps = {
  label: string;
  sortKey: SortKey;
  sort: SortState | null;
  onSort: (key: SortKey) => void;
};

function SortableHead({ label, sortKey, sort, onSort }: SortableHeadProps) {
  const active = sort?.key === sortKey;
  const direction = active ? sort.direction : null;

  return (
    <th
      className={cn(
        HEAD_CELL,
        "hover:bg-surface last:[&_button]:pr-3.5",
        active && "text-jade shadow-table-header-active hover:bg-surface-alt",
      )}
      aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none"}
    >
      <button
        type="button"
        title={`Ordenar por ${label.toLowerCase()}`}
        onClick={() => onSort(sortKey)}
        className={cn(
          "group hover:text-ink focus-visible:text-jade focus-visible:shadow-control-focus flex w-full cursor-pointer items-center gap-1.5 px-3 pt-2.5 pb-3 transition-colors duration-100 focus-visible:outline-none",
          active && "text-jade hover:text-jade",
        )}
      >
        {label}
        <SortIcon
          className={cn(
            "group-hover:text-jade size-3.5 transition-[color,opacity] duration-100",
            !active && "opacity-45 group-hover:opacity-100",
            direction === "asc" && "[&_.sort-down]:opacity-25",
            direction === "desc" && "[&_.sort-up]:opacity-25",
          )}
        />
      </button>
    </th>
  );
}

type ItemTableProps = {
  items: Item[];
  names: NameLookup;
  emptyMessage: string;
  onOpen: (id: string) => void;
  onToggleStatus: (item: Item) => void;
  onChangePriority: (id: string, priority: Priority) => void;
};

export function ItemTable({
  items,
  names,
  emptyMessage,
  onOpen,
  onToggleStatus,
  onChangePriority,
}: ItemTableProps) {
  const [sort, setSort] = useState<SortState | null>(null);

  const sortedItems = useMemo(() => {
    if (!sort) return items;
    const activeSort = sort;

    function valueFor(item: Item): string | number | null {
      switch (activeSort.key) {
        case "name":
          return item.name;
        case "priority":
          return PRIORITY_ORDER[item.priority];
        case "group":
          return names.group(item.group_id);
        case "type":
          return names.type(item.type_id);
        case "quantity":
          return item.quantity;
        case "price":
          return item.price;
      }
    }

    return [...items].sort((left, right) => {
      const leftValue = valueFor(left);
      const rightValue = valueFor(right);

      if (leftValue === null && rightValue === null) return 0;
      if (leftValue === null) return 1;
      if (rightValue === null) return -1;

      const comparison =
        typeof leftValue === "number" && typeof rightValue === "number"
          ? leftValue - rightValue
          : COLLATOR.compare(String(leftValue), String(rightValue));

      return activeSort.direction === "asc" ? comparison : -comparison;
    });
  }, [names, items, sort]);

  function handleSort(key: SortKey) {
    setSort((current) => ({
      key,
      direction: current?.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  if (items.length === 0) {
    return <p className="text-ink-soft px-0.5 pt-2 pb-5 text-sm">{emptyMessage}</p>;
  }

  return (
    <div className="scrollbar-themed bg-surface shadow-control mb-6 overflow-x-auto rounded-[8px] max-sm:overflow-x-visible">
      <table className="w-full border-collapse text-sm max-sm:block">
        <thead className="max-sm:hidden">
          <tr>
            <th
              className={cn(HEAD_CELL, "w-[1%] px-3 pt-2.5 pb-3 first:pl-3.5")}
              aria-label="Comprado"
            />
            <SortableHead label="Produto" sortKey="name" sort={sort} onSort={handleSort} />
            <SortableHead label="Prioridade" sortKey="priority" sort={sort} onSort={handleSort} />
            <SortableHead label="Grupo" sortKey="group" sort={sort} onSort={handleSort} />
            <SortableHead label="Tipo" sortKey="type" sort={sort} onSort={handleSort} />
            <SortableHead label="Qtd" sortKey="quantity" sort={sort} onSort={handleSort} />
            <SortableHead label="Preço" sortKey="price" sort={sort} onSort={handleSort} />
            <th className={cn(HEAD_CELL, "px-3 pt-2.5 pb-3 last:pr-3.5")}>Link</th>
          </tr>
        </thead>
        <tbody className="max-sm:flex max-sm:flex-col [&>tr:last-child>td]:border-b-0 sm:[&>tr:last-child>td]:pb-3">
          {sortedItems.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              groupName={names.group(item.group_id)}
              typeName={names.type(item.type_id)}
              onOpen={onOpen}
              onToggleStatus={onToggleStatus}
              onChangePriority={onChangePriority}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
