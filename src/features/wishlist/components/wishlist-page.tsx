"use client";

import { useMemo, useState, type KeyboardEvent } from "react";

import { SignOutButton } from "@/features/auth/components";
import { cn } from "@/shared/lib/cn";

import { useWishlist } from "../hooks";
import { ALL, normalizeText, PRIORITY_ORDER } from "../lib";
import { type Item, type Priority, type WishlistData } from "../types";

import { AddItemPanel, type ViewMode } from "./add-item-panel";
import { FiltersBar, type Filters } from "./filters-bar";
import { ItemDetailsDrawer } from "./item-details-drawer";
import { ItemGrid } from "./item-grid";
import { ItemTable } from "./item-table";
import { Tag } from "./tag";

const NO_FILTERS: Filters = { search: "", areaId: ALL, categoryId: ALL, priority: ALL };
type ListTab = "shopping" | "purchased";

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [activeTab, setActiveTab] = useState<ListTab>("shopping");

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
  const selectedItem = items.find((item) => item.id === selectedId) ?? null;

  const hasActiveFilter =
    filters.areaId !== ALL ||
    filters.categoryId !== ALL ||
    filters.priority !== ALL ||
    filters.search.trim() !== "";
  const emptyMessage = hasActiveFilter
    ? "Nenhum item encontrado com esse filtro/busca."
    : "Nada por aqui ainda.";

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const nextTab = activeTab === "shopping" ? "purchased" : "shopping";
    setActiveTab(nextTab);
    requestAnimationFrame(() => document.getElementById(`${nextTab}-tab`)?.focus());
  }

  function handleDelete(id: string) {
    if (!window.confirm("Remover este item da lista?")) return;
    setSelectedId(null);
    void deleteItem(id);
  }

  const tableProps = {
    areas,
    categories,
    emptyMessage,
    onOpen: setSelectedId,
    onToggleStatus: (item: Item) => void toggleStatus(item),
    onChangePriority: (id: string, priority: Priority) => void updatePriority(id, priority),
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

      <div
        role="tablist"
        aria-label="Itens da lista"
        className="bg-surface-alt shadow-control mb-3 inline-flex items-center gap-1 rounded-[8px] p-1 max-sm:flex max-sm:w-full"
      >
        <button
          type="button"
          id="shopping-tab"
          role="tab"
          aria-selected={activeTab === "shopping"}
          aria-controls="shopping-panel"
          tabIndex={activeTab === "shopping" ? 0 : -1}
          onClick={() => setActiveTab("shopping")}
          onKeyDown={handleTabKeyDown}
          className={cn(
            "focus-visible:shadow-control-focus inline-flex cursor-pointer items-center gap-2 rounded-[6px] px-3 py-2 text-sm font-medium transition-[background-color,color,box-shadow] duration-100 focus-visible:outline-none max-sm:flex-1 max-sm:justify-center",
            activeTab === "shopping"
              ? "bg-surface text-ink shadow-tab-active"
              : "text-ink-soft hover:bg-surface hover:text-ink",
          )}
        >
          A comprar
          <Tag className="bg-priority-media-soft text-priority-media">{pending.length}</Tag>
        </button>
        <button
          type="button"
          id="purchased-tab"
          role="tab"
          aria-selected={activeTab === "purchased"}
          aria-controls="purchased-panel"
          tabIndex={activeTab === "purchased" ? 0 : -1}
          onClick={() => setActiveTab("purchased")}
          onKeyDown={handleTabKeyDown}
          className={cn(
            "focus-visible:shadow-control-focus inline-flex cursor-pointer items-center gap-2 rounded-[6px] px-3 py-2 text-sm font-medium transition-[background-color,color,box-shadow] duration-100 focus-visible:outline-none max-sm:flex-1 max-sm:justify-center",
            activeTab === "purchased"
              ? "bg-surface text-ink shadow-tab-active"
              : "text-ink-soft hover:bg-surface hover:text-ink",
          )}
        >
          Comprados
          <Tag className="bg-accent-soft text-accent">{purchased.length}</Tag>
        </button>
      </div>

      <section
        id="shopping-panel"
        role="tabpanel"
        aria-labelledby="shopping-tab"
        hidden={activeTab !== "shopping"}
      >
        {viewMode === "table" ? (
          <ItemTable items={pending} {...tableProps} />
        ) : (
          <ItemGrid items={pending} {...tableProps} />
        )}
      </section>

      <section
        id="purchased-panel"
        role="tabpanel"
        aria-labelledby="purchased-tab"
        hidden={activeTab !== "purchased"}
      >
        {viewMode === "table" ? (
          <ItemTable items={purchased} {...tableProps} />
        ) : (
          <ItemGrid items={purchased} {...tableProps} />
        )}
      </section>

      {selectedItem ? (
        <ItemDetailsDrawer
          item={selectedItem}
          areas={areas}
          categories={categories}
          areaName={areas.find((area) => area.id === selectedItem.area_id)?.name ?? "—"}
          categoryName={
            categories.find((category) => category.id === selectedItem.category_id)?.name ?? "—"
          }
          onClose={() => setSelectedId(null)}
          onSave={updateItem}
          onDelete={() => handleDelete(selectedItem.id)}
        />
      ) : null}
    </main>
  );
}
