import { type Area, type Category, type Item, type Priority } from "../types";

import { ItemRow } from "./item-row";

const HEAD_CELL =
  "bg-surface-alt shadow-table-header px-2.5 pt-2.5 pb-3 text-left text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap text-ink-soft uppercase";

type ItemTableProps = {
  items: Item[];
  areas: Area[];
  categories: Category[];
  emptyMessage: string;
  onEdit: (id: string) => void;
  onToggleStatus: (item: Item) => void;
  onChangePriority: (id: string, priority: Priority) => void;
  onDelete: (id: string) => void;
};

export function ItemTable({
  items,
  areas,
  categories,
  emptyMessage,
  onEdit,
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
    <div className="scrollbar-themed bg-surface shadow-control mb-6 overflow-x-auto rounded-[8px] max-sm:overflow-x-visible max-sm:rounded-none max-sm:bg-transparent max-sm:shadow-none">
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
            <th className={HEAD_CELL} aria-label="Ações" />
          </tr>
        </thead>
        <tbody className="max-sm:flex max-sm:flex-col max-sm:gap-2.5 [&>tr:last-child>td]:border-b-0">
          {items.map((item) => (
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
