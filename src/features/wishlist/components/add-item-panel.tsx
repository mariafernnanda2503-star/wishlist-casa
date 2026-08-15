"use client";

import { useState } from "react";

import { cn } from "@/shared/lib/cn";
import { GridIcon, PlusIcon, TableIcon } from "@/ui/icons";
import { Button, Dialog } from "@/ui/primitives";

import { type Area, type Category, type ItemDraft } from "../types";

import { ItemForm } from "./item-form";

export type ViewMode = "table" | "grid";

type AddItemPanelProps = {
  areas: Area[];
  categories: Category[];
  onAdd: (draft: ItemDraft) => Promise<boolean>;
  viewMode: ViewMode;
  onViewModeChange: (viewMode: ViewMode) => void;
};

export function AddItemPanel({
  areas,
  categories,
  onAdd,
  viewMode,
  onViewModeChange,
}: AddItemPanelProps) {
  const [open, setOpen] = useState(false);

  async function handleAdd(draft: ItemDraft) {
    const added = await onAdd(draft);
    if (added) setOpen(false);
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 text-[15px]"
        >
          <PlusIcon />
          Adicionar item
        </Button>

        <div role="group" aria-label="Visualização dos itens" className="flex items-center gap-1">
          <button
            type="button"
            title="Visualização em tabela"
            aria-label="Visualização em tabela"
            aria-pressed={viewMode === "table"}
            onClick={() => onViewModeChange("table")}
            className={cn(
              "bg-surface shadow-control hover:bg-surface-alt hover:shadow-control-hover focus-visible:shadow-control-focus active:shadow-control-active inline-flex size-9 cursor-pointer items-center justify-center rounded-[7px] border transition-[background-color,color,box-shadow] duration-100 focus-visible:outline-none",
              viewMode === "table"
                ? "border-accent text-accent"
                : "text-ink-soft hover:text-ink border-transparent",
            )}
          >
            <TableIcon />
          </button>
          <button
            type="button"
            title="Visualização em grade"
            aria-label="Visualização em grade"
            aria-pressed={viewMode === "grid"}
            onClick={() => onViewModeChange("grid")}
            className={cn(
              "bg-surface shadow-control hover:bg-surface-alt hover:shadow-control-hover focus-visible:shadow-control-focus active:shadow-control-active inline-flex size-9 cursor-pointer items-center justify-center rounded-[7px] border transition-[background-color,color,box-shadow] duration-100 focus-visible:outline-none",
              viewMode === "grid"
                ? "border-accent text-accent"
                : "text-ink-soft hover:text-ink border-transparent",
            )}
          >
            <GridIcon />
          </button>
        </div>
      </div>

      {open ? (
        <Dialog
          title="Adicionar item"
          eyebrow="Lista de desejos"
          closeLabel="Fechar cadastro"
          onClose={() => setOpen(false)}
        >
          <ItemForm
            areas={areas}
            categories={categories}
            submitLabel="Adicionar"
            focusNameOnMount
            onCancel={() => setOpen(false)}
            onSubmit={handleAdd}
          />
        </Dialog>
      ) : null}
    </div>
  );
}
