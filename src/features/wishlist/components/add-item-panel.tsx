"use client";

import { type Area, type Category, type ItemDraft } from "../types";

import { ItemForm } from "./item-form";

type AddItemPanelProps = {
  areas: Area[];
  categories: Category[];
  onAdd: (draft: ItemDraft) => Promise<void>;
};

export function AddItemPanel({ areas, categories, onAdd }: AddItemPanelProps) {
  return (
    <details className="border-line bg-surface mb-4 overflow-hidden rounded-xl border">
      <summary className="text-accent cursor-pointer list-none p-3.5 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
        + Adicionar item
      </summary>
      <div className="px-3.5 pb-3.5">
        <ItemForm
          areas={areas}
          categories={categories}
          submitLabel="Adicionar"
          onSubmit={onAdd}
          resetAfterSubmit
        />
      </div>
    </details>
  );
}
