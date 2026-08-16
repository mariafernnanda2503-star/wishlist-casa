"use client";

import { type MouseEvent } from "react";

import { cn } from "@/shared/lib/cn";
import { Checkbox } from "@/ui/primitives";

import { formatPrice, isAcquired, quantityBadge } from "../../lib";
import { type Item, type Priority } from "../../types";
import { Tag } from "../tag";

import { ItemLink } from "./item-actions";
import { PriorityCell } from "./priority-cell";

const CELL =
  "border-b border-line px-3 py-2.5 align-middle first:pl-3.5 last:pr-3.5 max-sm:border-b-0 max-sm:p-0";
const DESKTOP_ONLY = "max-sm:hidden";

type ItemRowProps = {
  item: Item;
  groupName: string;
  typeName: string;
  /** Vazio quando ninguém foi marcado, ou na lista de mercado. */
  wanterNames: string[];
  onOpen: (id: string) => void;
  onToggleStatus: (item: Item) => void;
  onChangePriority: (id: string, priority: Priority) => void;
};

export function ItemRow({
  item,
  groupName,
  typeName,
  wanterNames,
  onOpen,
  onToggleStatus,
  onChangePriority,
}: ItemRowProps) {
  const purchased = isAcquired(item.status);
  const quantityText = quantityBadge(item.quantity, item.unit);

  const priority = <PriorityCell item={item} onChange={onChangePriority} />;
  const groupTag = <Tag className="bg-jade-soft text-jade">{groupName}</Tag>;
  const typeTag = <Tag className="bg-type-soft text-type">{typeName}</Tag>;
  const linkIcon = <ItemLink link={item.link} />;

  function handleRowClick(event: MouseEvent<HTMLTableRowElement>) {
    if ((event.target as HTMLElement).closest("button, a, input, label")) return;
    onOpen(item.id);
  }

  return (
    <tr
      className={cn(
        purchased && "opacity-55",
        "hover:bg-surface-alt/60 max-sm:border-line cursor-pointer transition-colors duration-100 max-sm:flex max-sm:h-[72px] max-sm:items-center max-sm:border-b max-sm:px-3 max-sm:last:border-b-0 sm:h-[52px]",
      )}
      onClick={handleRowClick}
    >
      <td
        className={cn(
          CELL,
          "w-[1%] whitespace-nowrap max-sm:flex max-sm:w-10 max-sm:shrink-0 max-sm:items-center max-sm:justify-center",
        )}
      >
        <Checkbox
          checked={purchased}
          onChange={() => onToggleStatus(item)}
          label={`Marcar ${item.name} como ${purchased ? "pendente" : "comprado"}`}
          labelClassName="sr-only"
          className="max-sm:p-2"
          indicatorClassName="size-5 [&_svg]:size-3"
        />
      </td>

      <td className={cn(CELL, "max-sm:min-w-0 max-sm:flex-1")}>
        <div className="max-sm:hidden">
          <button
            type="button"
            title={item.note ?? undefined}
            onClick={() => onOpen(item.id)}
            className="hover:text-jade focus-visible:text-jade max-w-full cursor-pointer text-left font-medium break-words focus-visible:outline-none sm:min-w-[140px]"
          >
            {item.name}
          </button>
          {/* Junto do nome, não em coluna própria: só alguns itens são de
              alguém, e uma coluna quase vazia custa largura em todas as linhas. */}
          {wanterNames.length > 0 ? (
            <span className="mt-0.5 flex flex-wrap gap-1">
              {wanterNames.map((name) => (
                <Tag key={name} className="bg-wanter-soft text-wanter">
                  {name}
                </Tag>
              ))}
            </span>
          ) : null}
        </div>

        <div className="hidden min-w-0 max-sm:block">
          <button
            type="button"
            title={item.note ?? undefined}
            onClick={() => onOpen(item.id)}
            className="hover:text-jade focus-visible:text-jade block w-full truncate text-left text-[13.5px] font-semibold focus-visible:outline-none"
          >
            {item.name}
          </button>
          <div className="mt-1 flex min-w-0 items-center gap-1.5">
            {priority}
            <span className="text-ink-soft min-w-0 flex-1 truncate text-[11px]">
              {quantityText ? `${quantityText} · ` : ""}
              {wanterNames.length > 0 ? `${wanterNames.join(", ")} · ` : ""}
              {groupName} · {typeName}
            </span>
            <span className="text-jade shrink-0 text-[13px] font-semibold tabular-nums">
              {formatPrice(item.price)}
            </span>
          </div>
        </div>
      </td>

      <td className={cn(CELL, DESKTOP_ONLY, "whitespace-nowrap")}>{priority}</td>
      <td className={cn(CELL, DESKTOP_ONLY)}>{groupTag}</td>
      <td className={cn(CELL, DESKTOP_ONLY)}>{typeTag}</td>
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
          "text-jade text-right font-semibold whitespace-nowrap tabular-nums",
        )}
      >
        {formatPrice(item.price)}
      </td>
      <td className={cn(CELL, DESKTOP_ONLY, "w-[1%] whitespace-nowrap")}>{linkIcon}</td>
    </tr>
  );
}
