"use client";

import { Input, Select } from "@/ui/primitives";

import { ALL, PRIORITIES, PRIORITY_LABEL } from "../lib";
import { type Area, type Category, type Priority } from "../types";

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

const filterSelectClassName = "min-w-0 flex-1 px-2.5 py-2 text-[13.5px] text-ink-soft";

export function FiltersBar({ areas, categories, filters, onChange }: FiltersBarProps) {
  function update<K extends keyof Filters>(field: K, value: Filters[K]) {
    onChange({ ...filters, [field]: value });
  }

  return (
    <div className="mb-5 flex flex-col gap-2">
      <Input
        type="text"
        placeholder="🔎 Buscar produto..."
        className="text-[14.5px]"
        value={filters.search}
        onChange={(event) => update("search", event.target.value)}
      />
      <div className="flex gap-2">
        <Select
          aria-label="Filtrar por área"
          className={filterSelectClassName}
          value={filters.areaId}
          onChange={(event) => update("areaId", event.target.value)}
        >
          <option value={ALL}>Área</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filtrar por categoria"
          className={filterSelectClassName}
          value={filters.categoryId}
          onChange={(event) => update("categoryId", event.target.value)}
        >
          <option value={ALL}>Categoria</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filtrar por prioridade"
          className={filterSelectClassName}
          value={filters.priority}
          onChange={(event) => update("priority", event.target.value)}
        >
          <option value={ALL}>Prioridade</option>
          {PRIORITIES.map((priority: Priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABEL[priority]}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
