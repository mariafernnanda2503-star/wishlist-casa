import { cn } from "@/shared/lib/cn";
import { LinkIcon, PencilIcon, TrashIcon } from "@/ui/icons";

import { type Item } from "../types";

const ACTION_BUTTON_BASE =
  "shadow-control hover:shadow-control-hover active:shadow-control-active focus-visible:shadow-control-focus inline-flex size-[30px] cursor-pointer items-center justify-center rounded-[5px] transition-[background-color,box-shadow] duration-100 focus-visible:outline-none";
const NEUTRAL_ACTION_BUTTON = `${ACTION_BUTTON_BASE} bg-surface-alt text-ink-soft hover:bg-surface hover:text-accent`;
const COLORED_ACTION_BUTTON = `${ACTION_BUTTON_BASE} bg-surface-alt hover:bg-surface`;

export function ItemLink({ link }: { link: string | null }) {
  if (!link) return null;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      title="Ver produto"
      className={NEUTRAL_ACTION_BUTTON}
    >
      <LinkIcon />
    </a>
  );
}

type ItemActionsProps = {
  item: Item;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  className?: string;
};

export function ItemActions({ item, onEdit, onDelete, className }: ItemActionsProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <button
        type="button"
        title="Editar item"
        aria-label={`Editar ${item.name}`}
        onClick={() => onEdit(item.id)}
        className={cn(COLORED_ACTION_BUTTON, "text-edit")}
      >
        <PencilIcon className="size-[15px]" />
      </button>
      <button
        type="button"
        title="Remover item"
        aria-label={`Remover ${item.name}`}
        onClick={() => onDelete(item.id)}
        className={cn(COLORED_ACTION_BUTTON, "text-danger")}
      >
        <TrashIcon className="size-[15px]" />
      </button>
    </div>
  );
}
