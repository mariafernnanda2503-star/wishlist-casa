"use client";

import { priceToInput } from "../lib";
import { type ItemFormValues } from "../schemas";
import { type Area, type Category, type Item, type ItemDraft, type Priority } from "../types";

import { ItemForm } from "./item-form";
import { ItemRow } from "./item-row";

const COLUMN_COUNT = 9;

const HEAD_CELL =
  "border-b border-line bg-surface-alt px-3 py-2.5 text-left text-[11px] font-semibold tracking-[0.04em] whitespace-nowrap text-ink-soft uppercase";

function toFormValues(item: Item): ItemFormValues {
  return {
    name: item.name,
    price: priceToInput(item.price),
    quantity: String(item.quantity),
    priority: item.priority,
    link: item.link ?? "",
    note: item.note ?? "",
    areaId: item.area_id ?? "",
    categoryId: item.category_id ?? "",
  };
}

type ItemTableProps = {
  items: Item[];
  areas: Area[];
  categories: Category[];
  emptyMessage: string;
  editingId: string | null;
  onEdit: (id: string | null) => void;
  onSave: (id: string, draft: ItemDraft) => Promise<void>;
  onToggleStatus: (item: Item) => void;
  onChangePriority: (id: string, priority: Priority) => void;
  onDelete: (id: string) => void;
};

export function ItemTable({
  items,
  areas,
  categories,
  emptyMessage,
  editingId,
  onEdit,
  onSave,
  onToggleStatus,
  onChangePriority,
  onDelete,
}: ItemTableProps) {
  if (items.length === 0) {
    return <p className="text-ink-soft px-0.5 pt-2 pb-5 text-sm">{emptyMessage}</p>;
  }

  const areaName = (id: string | null) => areas.find((area) => area.id === id)?.name ?? "—";
  const categoryName = (id: string | null) =>
    categories.find((category) => category.id === id)?.name ?? "—";

  return (
    <div className="border-line bg-surface mb-6 overflow-x-auto rounded-[10px] border max-sm:overflow-x-visible max-sm:rounded-none max-sm:border-none max-sm:bg-transparent">
      <table className="w-full border-collapse text-sm max-sm:block">
        <thead className="max-sm:hidden">
          <tr>
            <th className={HEAD_CELL} aria-label="Comprado" />
            <th className={HEAD_CELL}>Produto</th>
            <th className={HEAD_CELL}>Prioridade</th>
            <th className={HEAD_CELL}>Área</th>
            <th className={HEAD_CELL}>Categoria</th>
            <th className={HEAD_CELL}>Qtd</th>
            <th className={HEAD_CELL}>Preço</th>
            <th className={HEAD_CELL}>Link</th>
            <th className={HEAD_CELL} aria-label="Remover" />
          </tr>
        </thead>
        <tbody className="max-sm:flex max-sm:flex-col max-sm:gap-2.5 [&>tr:last-child>td]:border-b-0">
          {items.map((item) =>
            item.id === editingId ? (
              <tr key={item.id} className="max-sm:block">
                <td colSpan={COLUMN_COUNT} className="bg-surface-alt p-3 max-sm:block">
                  <ItemForm
                    areas={areas}
                    categories={categories}
                    initialValues={toFormValues(item)}
                    submitLabel="Salvar"
                    onCancel={() => onEdit(null)}
                    onSubmit={(draft) => onSave(item.id, draft)}
                  />
                </td>
              </tr>
            ) : (
              <ItemRow
                key={item.id}
                item={item}
                areaName={areaName(item.area_id)}
                categoryName={categoryName(item.category_id)}
                onToggleStatus={onToggleStatus}
                onChangePriority={onChangePriority}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}
