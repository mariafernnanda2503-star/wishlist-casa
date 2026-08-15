"use client";

import { useMemo } from "react";

import { SearchField, Select, type SelectOption } from "@/ui/primitives";

import { ALL, PRIORITIES, PRIORITY_LABEL } from "../lib";
import { type Area, type Category } from "../types";

export type Filters = {
  search: string;
  areaId: string;
  categoryId: string;
  priority: string;
};

type FiltersBarProps = {
  areas: Area[];
  categories: Category[];
  filters: Filters;
  onChange: (filters: Filters) => void;
};

const FILTER_TRIGGER = "bg-surface-alt text-[13.5px]";

/** Primeira entrada limpa o filtro; o rótulo do gatilho fica fora da lista. */
const RESET: SelectOption = { value: ALL, label: "Todas" };

export function FiltersBar({ areas, categories, filters, onChange }: FiltersBarProps) {
  function update<K extends keyof Filters>(field: K, value: Filters[K]) {
    onChange({ ...filters, [field]: value });
  }

  const areaOptions = useMemo(
    () => [RESET, ...areas.map((area) => ({ value: area.id, label: area.name }))],
    [areas],
  );
  const categoryOptions = useMemo(
    () => [RESET, ...categories.map((category) => ({ value: category.id, label: category.name }))],
    [categories],
  );
  const priorityOptions = useMemo(
    () => [
      RESET,
      ...PRIORITIES.map((priority) => ({ value: priority, label: PRIORITY_LABEL[priority] })),
    ],
    [],
  );

  return (
    <div className="mb-5 flex flex-col gap-2">
      <SearchField
        placeholder="Buscar produto..."
        aria-label="Buscar produto"
        className="text-[14.5px]"
        value={filters.search}
        onChange={(event) => update("search", event.target.value)}
        onClear={() => update("search", "")}
      />

      <div className="flex gap-2">
        <Select
          aria-label="Filtrar por área"
          placeholder="Área"
          emptyValue={ALL}
          options={areaOptions}
          value={filters.areaId}
          onChange={(value) => update("areaId", value)}
          compact
          wrapperClassName="min-w-0 flex-1"
          className={FILTER_TRIGGER}
        />
        <Select
          aria-label="Filtrar por categoria"
          placeholder="Categoria"
          emptyValue={ALL}
          options={categoryOptions}
          value={filters.categoryId}
          onChange={(value) => update("categoryId", value)}
          compact
          wrapperClassName="min-w-0 flex-1"
          className={FILTER_TRIGGER}
        />
        <Select
          aria-label="Filtrar por prioridade"
          placeholder="Prioridade"
          emptyValue={ALL}
          options={priorityOptions}
          value={filters.priority}
          onChange={(value) => update("priority", value)}
          compact
          wrapperClassName="min-w-0 flex-1"
          className={FILTER_TRIGGER}
        />
      </div>
    </div>
  );
}
