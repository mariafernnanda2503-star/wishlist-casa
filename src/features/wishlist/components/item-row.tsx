"use client";

import { cn } from "@/shared/lib/cn";
import { CheckIcon, LinkIcon, TrashIcon } from "@/ui/icons";

import { formatPrice } from "../lib";
import { type Item, type Priority } from "../types";

import { PriorityCell } from "./priority-cell";
import { Tag } from "./tag";

const CELL = "border-b border-line px-3 py-2.5 align-middle max-sm:border-b-0 max-sm:p-0";
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
  const linkIcon = item.link ? (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      title="Ver produto"
      className="text-ink-soft hover:text-accent focus-visible:outline-accent inline-flex items-center justify-center rounded-sm no-underline transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <LinkIcon />
    </a>
  ) : null;

  return (
    <tr
      className={cn(
        purchased && "opacity-55",
        "max-sm:border-line max-sm:bg-surface max-sm:flex max-sm:items-start max-sm:rounded-[10px] max-sm:border max-sm:p-3",
      )}
    >
      <td
        className={cn(
          CELL,
          "w-[1%] whitespace-nowrap max-sm:flex max-sm:w-11 max-sm:shrink-0 max-sm:items-center max-sm:justify-center",
        )}
      >
        <button
          type="button"
          onClick={() => onToggleStatus(item)}
          title={`Marcar como ${purchased ? "pendente" : "comprado"}`}
          className={cn(
            "text-on-accent flex size-[22px] cursor-pointer items-center justify-center rounded-full border-2 p-0 text-xs font-bold max-sm:size-6",
            "ease-jumpy transition-[background-color,border-color,transform] duration-100",
            "focus-visible:shadow-control-focus focus-visible:outline-none active:scale-90",
            purchased
              ? "border-accent bg-accent hover:border-accent-hover hover:bg-accent-hover"
              : "border-line bg-surface hover:border-accent",
          )}
        >
          {purchased ? <CheckIcon className="size-3" strokeWidth={3.5} /> : null}
        </button>
      </td>

      <td className={cn(CELL, "max-sm:min-w-0 max-sm:flex-1")}>
        <button
          type="button"
          onClick={() => onEdit(item.id)}
          title="Editar item"
          className="group focus-visible:outline-accent block cursor-pointer rounded-sm border-none bg-transparent p-0 text-left focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <div
            className={cn(
              "group-hover:decoration-line min-w-[140px] font-medium group-hover:underline",
              purchased && "line-through",
            )}
          >
            {item.name}
          </div>
          {item.note ? (
            <div className="text-ink-soft mt-0.5 text-xs italic">{item.note}</div>
          ) : null}
        </button>

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
          {linkIcon ? <span className="ml-auto">{linkIcon}</span> : null}
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
        <button
          type="button"
          title="Remover"
          onClick={() => onDelete(item.id)}
          className="text-ink-soft hover:text-danger active:text-danger focus-visible:outline-accent ease-jumpy cursor-pointer rounded-sm border-none bg-transparent p-1 transition-[color,transform] duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-90"
        >
          <TrashIcon className="size-[15px]" />
        </button>
      </td>
    </tr>
  );
}
