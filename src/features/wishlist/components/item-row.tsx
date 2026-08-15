"use client";

import { cn } from "@/shared/lib/cn";
import { Checkbox } from "@/ui/primitives";

import { formatPrice } from "../lib";
import { type Item, type Priority } from "../types";

import { ItemActions, ItemLink } from "./item-actions";
import { PriorityCell } from "./priority-cell";
import { Tag } from "./tag";

const CELL = "border-b border-line px-2.5 py-2 align-middle max-sm:border-b-0 max-sm:p-0";
const DESKTOP_ONLY = "max-sm:hidden";

type ItemRowProps = {
  item: Item;
  areaName: string;
  categoryName: string;
  onToggleStatus: (item: Item) => void;
  onChangePriority: (id: string, priority: Priority) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export function ItemRow({
  item,
  areaName,
  categoryName,
  onToggleStatus,
  onChangePriority,
  onEdit,
  onDelete,
}: ItemRowProps) {
  const purchased = item.status === "purchased";
  const quantityText = item.quantity > 1 ? `×${item.quantity}` : "";

  const priority = <PriorityCell item={item} onChange={onChangePriority} />;
  const areaTag = <Tag className="bg-accent-soft text-accent">{areaName}</Tag>;
  const categoryTag = <Tag className="bg-category-soft text-category">{categoryName}</Tag>;
  const linkIcon = <ItemLink link={item.link} />;

  return (
    <tr
      className={cn(
        purchased && "opacity-55",
        "hover:bg-surface-alt/60 max-sm:bg-surface max-sm:shadow-control max-sm:hover:bg-surface transition-colors duration-100 max-sm:flex max-sm:items-start max-sm:rounded-[8px] max-sm:p-3",
      )}
    >
      <td
        className={cn(
          CELL,
          "w-[1%] whitespace-nowrap max-sm:flex max-sm:w-8 max-sm:shrink-0 max-sm:items-center max-sm:justify-start max-sm:pt-0.5",
        )}
      >
        <Checkbox
          checked={purchased}
          onChange={() => onToggleStatus(item)}
          label={`Marcar ${item.name} como ${purchased ? "pendente" : "comprado"}`}
          labelClassName="sr-only"
          indicatorClassName="size-5 [&_svg]:size-3"
        />
      </td>

      <td className={cn(CELL, "max-sm:min-w-0 max-sm:flex-1")}>
        <div>
          <div className="min-w-[140px] font-medium">{item.name}</div>
          {item.note ? (
            <div className="text-ink-soft mt-0.5 text-xs italic">{item.note}</div>
          ) : null}
        </div>

        <div className="border-line mt-2.5 hidden flex-wrap items-center gap-1.5 border-t pt-2.5 max-sm:flex">
          {priority}
          {areaTag}
          {categoryTag}
        </div>
        <div className="mt-2.5 hidden items-center max-sm:flex">
          {quantityText ? (
            <span className="text-ink-soft mr-2 font-semibold">{quantityText}</span>
          ) : null}
          <span className="text-accent mr-2 font-semibold tabular-nums">
            {formatPrice(item.price)}
          </span>
          {item.link ? <span className="ml-auto">{linkIcon}</span> : null}
        </div>
      </td>

      <td className={cn(CELL, DESKTOP_ONLY, "whitespace-nowrap")}>{priority}</td>
      <td className={cn(CELL, DESKTOP_ONLY)}>{areaTag}</td>
      <td className={cn(CELL, DESKTOP_ONLY)}>{categoryTag}</td>
      <td
        className={cn(
          CELL,
          DESKTOP_ONLY,
          "text-ink-soft w-[1%] text-center font-semibold whitespace-nowrap tabular-nums",
        )}
      >
        {quantityText}
      </td>
      <td
        className={cn(
          CELL,
          DESKTOP_ONLY,
          "text-accent text-right font-semibold whitespace-nowrap tabular-nums",
        )}
      >
        {formatPrice(item.price)}
      </td>
      <td className={cn(CELL, DESKTOP_ONLY, "w-[1%] whitespace-nowrap")}>{linkIcon}</td>

      <td className={cn(CELL, "w-[1%] whitespace-nowrap max-sm:ml-2 max-sm:shrink-0")}>
        <ItemActions item={item} onEdit={onEdit} onDelete={onDelete} />
      </td>
    </tr>
  );
}
