"use client";

import { useMemo, useState, type KeyboardEvent } from "react";

import { SignOutButton } from "@/features/auth/components";
import { cn } from "@/shared/lib/cn";
import { type SharedTarget } from "@/shared/lib/share-target";
import { BrandLogo } from "@/ui/brand-logo";
import { UsersIcon } from "@/ui/icons";
import { Button } from "@/ui/primitives";

import { useWishlist } from "../hooks";
import {
  ALL,
  computeTotals,
  createNameLookup,
  isAcquired,
  normalizeText,
  PRIORITY_ORDER,
} from "../lib";
import { type Item, type Priority, type WishlistData, type WorkspaceContext } from "../types";

import { AddItemPanel, type ViewMode } from "./add-item-panel";
import { FiltersBar, type Filters } from "./filters-bar";
import { ItemDetailsDrawer } from "./item-details-drawer";
import { ItemGrid } from "./item-grid";
import { ItemTable } from "./item-table";
import { ListSwitcher } from "./list-switcher";
import { MembersDialog } from "./members-dialog";
import { Tag } from "./tag";
import { TotalsPanel } from "./totals-panel";
import { WorkspaceSwitcher } from "./workspace-switcher";

const NO_FILTERS: Filters = { search: "", groupId: ALL, typeId: ALL, priority: ALL };
type ListTab = "shopping" | "purchased";

type WishlistPageProps = {
  initialData: WishlistData;
  context: WorkspaceContext;
  currentUserId: string;
  /** Veio de um compartilhamento — abre o cadastro já preenchido. */
  sharedDraft: SharedTarget | null;
};

export function WishlistPage({
  initialData,
  context,
  currentUserId,
  sharedDraft,
}: WishlistPageProps) {
  const {
    items,
    groups,
    types,
    priceSummaries,
    createGroup,
    createType,
    addItem,
    updateItem,
    toggleStatus,
    updatePriority,
    deleteItem,
  } = useWishlist(initialData, context.activeList.id, context.activeWorkspace.id);

  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [activeTab, setActiveTab] = useState<ListTab>("shopping");
  const [membersOpen, setMembersOpen] = useState(false);

  const visibleItems = useMemo(() => {
    const search = normalizeText(filters.search.trim());
    return items.filter((item) => {
      if (filters.groupId !== ALL && item.group_id !== filters.groupId) return false;
      if (filters.typeId !== ALL && item.type_id !== filters.typeId) return false;
      if (filters.priority !== ALL && item.priority !== filters.priority) return false;
      if (search && !normalizeText(item.name).includes(search)) return false;
      return true;
    });
  }, [items, filters]);

  const pending = useMemo(
    () =>
      visibleItems
        .filter((item) => item.status === "wanted")
        .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]),
    [visibleItems],
  );
  // Pago e recebido caem na mesma aba; o que separa os dois é o painel do item.
  // `archived` (desistimos) fica fora das duas de propósito.
  const purchased = useMemo(
    () => visibleItems.filter((item) => isAcquired(item.status)),
    [visibleItems],
  );
  const selectedItem = items.find((item) => item.id === selectedId) ?? null;

  // Os totais somam a lista inteira de propósito, não o resultado dos filtros:
  // "quanto falta para a casa" não muda porque alguém filtrou por cozinha.
  const totals = useMemo(
    () => computeTotals(items, groups, priceSummaries),
    [items, groups, priceSummaries],
  );

  const hasActiveFilter =
    filters.groupId !== ALL ||
    filters.typeId !== ALL ||
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

  // Um mapa só, montado quando grupos ou tipos mudam, servindo tabela, grade e
  // painel — antes cada um resolvia nome do seu jeito.
  const names = useMemo(() => createNameLookup(groups, types), [groups, types]);

  const tableProps = {
    names,
    emptyMessage,
    onOpen: setSelectedId,
    onToggleStatus: (item: Item) => void toggleStatus(item),
    onChangePriority: (id: string, priority: Priority) => void updatePriority(id, priority),
  };

  return (
    <main className="mx-auto max-w-[920px] px-4 pt-4 pb-12 max-sm:px-2.5 max-sm:pt-3 max-sm:pb-10">
      <header className="bg-surface shadow-control mb-4 flex items-center justify-between gap-3 rounded-[10px] px-4 py-3 max-sm:px-3 max-sm:py-2.5">
        <div className="flex min-w-0 items-center gap-3 max-sm:gap-2">
          <BrandLogo priority className="size-8 max-sm:size-7" />
          <nav aria-label="Navegação estrutural" className="min-w-0">
            <ol className="flex items-center gap-2 text-sm max-sm:gap-1.5 max-sm:text-[13px]">
              <li className="min-w-0 max-[359px]:hidden">
                <WorkspaceSwitcher context={context} />
              </li>
              <li aria-hidden="true" className="text-line font-semibold max-[359px]:hidden">
                /
              </li>
              <li className="min-w-0">
                <ListSwitcher context={context} />
              </li>
            </ol>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setMembersOpen(true)}
            className="inline-flex items-center gap-2 text-[13px] max-sm:min-h-10"
          >
            <UsersIcon className="size-[15px]" />
            <span className="max-sm:hidden">Participantes</span>
          </Button>
          <SignOutButton />
        </div>
      </header>

      {membersOpen ? (
        <MembersDialog
          context={context}
          currentUserId={currentUserId}
          onClose={() => setMembersOpen(false)}
        />
      ) : null}

      <TotalsPanel totals={totals} />

      <FiltersBar groups={groups} types={types} filters={filters} onChange={setFilters} />

      <AddItemPanel
        groups={groups}
        types={types}
        onAdd={addItem}
        onCreateGroup={createGroup}
        onCreateType={createType}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sharedDraft={sharedDraft}
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
            "focus-visible:shadow-control-focus inline-flex cursor-pointer items-center gap-2 rounded-[6px] px-3 py-2 text-sm font-medium transition-[background-color,color,box-shadow] duration-100 focus-visible:outline-none max-sm:min-h-10 max-sm:flex-1 max-sm:justify-center",
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
            "focus-visible:shadow-control-focus inline-flex cursor-pointer items-center gap-2 rounded-[6px] px-3 py-2 text-sm font-medium transition-[background-color,color,box-shadow] duration-100 focus-visible:outline-none max-sm:min-h-10 max-sm:flex-1 max-sm:justify-center",
            activeTab === "purchased"
              ? "bg-surface text-ink shadow-tab-active"
              : "text-ink-soft hover:bg-surface hover:text-ink",
          )}
        >
          Comprados
          <Tag className="bg-success-soft text-success">{purchased.length}</Tag>
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
          groups={groups}
          types={types}
          groupName={names.group(selectedItem.group_id)}
          typeName={names.type(selectedItem.type_id)}
          profiles={context.profiles}
          currentUserId={currentUserId}
          onClose={() => setSelectedId(null)}
          onSave={updateItem}
          onCreateGroup={createGroup}
          onCreateType={createType}
          onDelete={() => handleDelete(selectedItem.id)}
        />
      ) : null}
    </main>
  );
}
