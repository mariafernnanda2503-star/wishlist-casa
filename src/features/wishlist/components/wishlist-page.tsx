"use client";

import { useMemo, useState } from "react";

import { SignOutButton } from "@/features/auth/components";

import { useWishlist } from "../hooks";
import { ALL, normalizeText, PRIORITY_ORDER } from "../lib";
import { type Item, type ItemDraft, type Priority, type WishlistData } from "../types";

import { AddItemPanel, type ViewMode } from "./add-item-panel";
import { EditItemDialog } from "./edit-item-dialog";
import { FiltersBar, type Filters } from "./filters-bar";
import { ItemGrid } from "./item-grid";
import { ItemTable } from "./item-table";
import { Tag } from "./tag";

const NO_FILTERS: Filters = { search: "", areaId: ALL, categoryId: ALL, priority: ALL };

type WishlistPageProps = {
  initialData: WishlistData;
};

export function WishlistPage({ initialData }: WishlistPageProps) {
  const {
    items,
    areas,
    categories,
    error,
    addItem,
    updateItem,
    toggleStatus,
    updatePriority,
    deleteItem,
  } = useWishlist(initialData);

  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const visibleItems = useMemo(() => {
    const search = normalizeText(filters.search.trim());
    return items.filter((item) => {
      if (filters.areaId !== ALL && item.area_id !== filters.areaId) return false;
      if (filters.categoryId !== ALL && item.category_id !== filters.categoryId) return false;
      if (filters.priority !== ALL && item.priority !== filters.priority) return false;
      if (search && !normalizeText(item.name).includes(search)) return false;
      return true;
    });
  }, [items, filters]);

  const pending = useMemo(
    () =>
      visibleItems
        .filter((item) => item.status === "pending")
        .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]),
    [visibleItems],
  );
  const purchased = useMemo(
    () => visibleItems.filter((item) => item.status === "purchased"),
    [visibleItems],
  );
  const editingItem = items.find((item) => item.id === editingId) ?? null;

  const hasActiveFilter =
    filters.areaId !== ALL ||
    filters.categoryId !== ALL ||
    filters.priority !== ALL ||
    filters.search.trim() !== "";
  const emptyMessage = hasActiveFilter
    ? "Nenhum item encontrado com esse filtro/busca."
    : "Nada por aqui ainda.";

  async function handleSave(id: string, draft: ItemDraft) {
    const saved = await updateItem(id, draft);
    if (saved) setEditingId(null);
  }

  function handleDelete(id: string) {
    if (window.confirm("Remover este item da lista?")) void deleteItem(id);
  }

  const tableProps = {
    areas,
    categories,
    emptyMessage,
    onEdit: setEditingId,
    onToggleStatus: (item: Item) => void toggleStatus(item),
    onChangePriority: (id: string, priority: Priority) => void updatePriority(id, priority),
    onDelete: handleDelete,
  };

  return (
    <main className="mx-auto max-w-[920px] px-4 pt-4 pb-12 max-sm:px-2.5 max-sm:pt-3 max-sm:pb-10">
      <header className="bg-surface shadow-control mb-4 flex items-center justify-between gap-3 rounded-[10px] px-4 py-3">
        <nav aria-label="Navegação estrutural" className="min-w-0">
          <ol className="flex items-center gap-2 text-sm">
            <li className="text-ink-soft">Casa</li>
            <li aria-hidden="true" className="text-line font-semibold">
              /
            </li>
            <li className="min-w-0">
              <h1 className="text-ink truncate font-semibold">Lista de desejos</h1>
            </li>
          </ol>
        </nav>
        <SignOutButton />
      </header>

      {error ? (
        <div className="border-danger-line bg-danger-soft text-danger mb-3 rounded-lg border px-3 py-2.5 text-[13px]">
          {error}
        </div>
      ) : null}

      <FiltersBar areas={areas} categories={categories} filters={filters} onChange={setFilters} />

      <AddItemPanel
        areas={areas}
        categories={categories}
        onAdd={addItem}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <section>
        <h2 className="text-ink-soft mb-2 ml-0.5 flex items-center gap-2 text-[13px] tracking-[0.04em] uppercase">
          Pendentes
          <Tag className="bg-priority-media-soft text-priority-media">{pending.length}</Tag>
        </h2>
        {viewMode === "table" ? (
          <ItemTable items={pending} {...tableProps} />
        ) : (
          <ItemGrid items={pending} {...tableProps} />
        )}
      </section>

      {purchased.length > 0 ? (
        <section>
          <h2 className="text-ink-soft mb-2 ml-0.5 flex items-center gap-2 text-[13px] tracking-[0.04em] uppercase">
            Já comprados
            <Tag className="bg-accent-soft text-accent">{purchased.length}</Tag>
          </h2>
          {viewMode === "table" ? (
            <ItemTable items={purchased} {...tableProps} />
          ) : (
            <ItemGrid items={purchased} {...tableProps} />
          )}
        </section>
      ) : null}

      {editingItem ? (
        <EditItemDialog
          key={editingItem.id}
          item={editingItem}
          areas={areas}
          categories={categories}
          onClose={() => setEditingId(null)}
          onSave={handleSave}
        />
      ) : null}
    </main>
  );
}
