"use client";

import { useState } from "react";

import { cn } from "@/shared/lib/cn";
import { type SharedTarget } from "@/shared/lib/share-target";
import { GridIcon, PlusIcon, TableIcon } from "@/ui/icons";
import { Button, Dialog } from "@/ui/primitives";

import { type Group, type ItemType, type ItemDraft, type ListKind, type Wanter } from "../../types";

import { EMPTY_ITEM_FORM, ItemForm } from "./item-form";

export type ViewMode = "table" | "grid";

type AddItemPanelProps = {
  groups: Group[];
  types: ItemType[];
  wanters: Wanter[];
  kind: ListKind;
  /** Quem está cadastrando — o item já nasce marcado como dela. */
  currentUserId: string;
  onAdd: (draft: ItemDraft) => Promise<boolean>;
  onCreateGroup: (name: string) => Promise<string | null>;
  onCreateType: (name: string) => Promise<string | null>;
  onCreateWanter: (name: string) => Promise<string | null>;
  viewMode: ViewMode;
  onViewModeChange: (viewMode: ViewMode) => void;
  sharedDraft: SharedTarget | null;
};

export function AddItemPanel({
  groups,
  types,
  wanters,
  kind,
  currentUserId,
  onAdd,
  onCreateGroup,
  onCreateType,
  onCreateWanter,
  viewMode,
  onViewModeChange,
  sharedDraft,
}: AddItemPanelProps) {
  // Chegou por compartilhamento: o cadastro já nasce aberto e preenchido.
  const [open, setOpen] = useState(sharedDraft !== null);

  // O palpite mais provável é que quem cadastra é quem quer — e desmarcar é um
  // toque. No mercado o campo nem aparece, então o palpite não atrapalha.
  const mine = wanters.flatMap((wanter) =>
    wanter.profile_id === currentUserId ? [wanter.id] : [],
  );

  async function handleAdd(draft: ItemDraft) {
    const added = await onAdd(draft);
    if (added) setOpen(false);
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between gap-2.5">
        <Button
          type="button"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 text-[15px] max-sm:min-h-10"
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
              "bg-surface shadow-control hover:bg-surface-alt hover:shadow-control-hover focus-visible:shadow-control-focus active:shadow-control-active inline-flex size-9 cursor-pointer items-center justify-center rounded-[7px] border transition-[background-color,color,box-shadow] duration-100 focus-visible:outline-none max-sm:size-10",
              viewMode === "table"
                ? "border-jade text-jade"
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
              "bg-surface shadow-control hover:bg-surface-alt hover:shadow-control-hover focus-visible:shadow-control-focus active:shadow-control-active inline-flex size-9 cursor-pointer items-center justify-center rounded-[7px] border transition-[background-color,color,box-shadow] duration-100 focus-visible:outline-none max-sm:size-10",
              viewMode === "grid"
                ? "border-jade text-jade"
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
          eyebrow={kind === "shopping" ? "Lista de compras" : "Lista de desejos"}
          closeLabel="Fechar cadastro"
          onClose={() => setOpen(false)}
        >
          <ItemForm
            groups={groups}
            types={types}
            wanters={wanters}
            kind={kind}
            initialValues={{
              ...EMPTY_ITEM_FORM,
              name: sharedDraft?.title ?? "",
              link: sharedDraft?.url ?? "",
              wanterIds: mine,
            }}
            submitLabel="Adicionar"
            focusNameOnMount
            onCancel={() => setOpen(false)}
            onSubmit={handleAdd}
            onCreateGroup={onCreateGroup}
            onCreateType={onCreateType}
            onCreateWanter={onCreateWanter}
          />
        </Dialog>
      ) : null}
    </div>
  );
}
