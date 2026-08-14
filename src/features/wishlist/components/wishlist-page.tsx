"use client";

import { useMemo, useState } from "react";

import { SignOutButton } from "@/features/auth/components";

import { useWishlist } from "../hooks";
import { ALL, normalizeText, PRIORITY_ORDER } from "../lib";
import { type Item, type ItemDraft, type Priority, type WishlistData } from "../types";

import { AddItemPanel } from "./add-item-panel";
import { FiltersBar, type Filters } from "./filters-bar";
import { ItemTable } from "./item-table";

const NO_FILTERS: Filters = { search: "", areaId: ALL, categoryId: ALL, priority: ALL };

type WishlistPageProps = {
  userEmail: string;
  initialData: WishlistData;
};

export function WishlistPage({ userEmail, initialData }: WishlistPageProps) {
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
    editingId,
    onEdit: setEditingId,
    onSave: handleSave,
    onToggleStatus: (item: Item) => void toggleStatus(item),
    onChangePriority: (id: string, priority: Priority) => void updatePriority(id, priority),
    onDelete: handleDelete,
  };

  return (
    <main className="mx-auto max-w-[920px] px-4 pt-4 pb-12 max-sm:px-2.5 max-sm:pt-3 max-sm:pb-10">
      <header className="flex items-center justify-between gap-3 pt-2 pb-4">
        <h1 className="text-[22px] font-semibold">🏠 Wishlist da Casa</h1>
        <div className="flex items-center gap-3">
          <span className="text-ink-soft text-[13px] max-sm:hidden">{userEmail}</span>
          <SignOutButton />
        </div>
      </header>

      {error ? (
        <div className="border-danger-line bg-danger-soft text-danger mb-3 rounded-lg border px-3 py-2.5 text-[13px]">
          {error}
        </div>
      ) : null}

      <AddItemPanel areas={areas} categories={categories} onAdd={addItem} />

      <FiltersBar areas={areas} categories={categories} filters={filters} onChange={setFilters} />

      <section>
        <h2 className="text-ink-soft mb-2 ml-0.5 flex items-center gap-2 text-[13px] tracking-[0.04em] uppercase">
          Pendentes
          <span className="bg-line text-ink rounded-full px-2 py-px text-xs">{pending.length}</span>
        </h2>
        <ItemTable items={pending} {...tableProps} />
      </section>

      {purchased.length > 0 ? (
        <section>
          <h2 className="text-ink-soft mb-2 ml-0.5 flex items-center gap-2 text-[13px] tracking-[0.04em] uppercase">
            Já comprados
            <span className="bg-line text-ink rounded-full px-2 py-px text-xs">
              {purchased.length}
            </span>
          </h2>
          <ItemTable items={purchased} {...tableProps} />
        </section>
      ) : null}
    </main>
  );
}
