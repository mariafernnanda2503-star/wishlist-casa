"use client";

import { useMemo } from "react";

import { SearchField, Select, type SelectOption } from "@/ui/primitives";

import { ALL, PRIORITIES, PRIORITY_LABEL } from "../lib";
import { type Group, type ItemType } from "../types";

export type Filters = {
  search: string;
  groupId: string;
  typeId: string;
  priority: string;
};

type FiltersBarProps = {
  groups: Group[];
  types: ItemType[];
  filters: Filters;
  onChange: (filters: Filters) => void;
};

const FILTER_TRIGGER = "bg-surface-alt text-[13.5px]";

/** Primeira entrada limpa o filtro; o rótulo do gatilho fica fora da lista. */
const RESET: SelectOption = { value: ALL, label: "Todas" };

export function FiltersBar({ groups, types, filters, onChange }: FiltersBarProps) {
  function update<K extends keyof Filters>(field: K, value: Filters[K]) {
    onChange({ ...filters, [field]: value });
  }

  const groupOptions = useMemo(
    () => [RESET, ...groups.map((group) => ({ value: group.id, label: group.name }))],
    [groups],
  );
  const typeOptions = useMemo(
    () => [RESET, ...types.map((type) => ({ value: type.id, label: type.name }))],
    [types],
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

      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Select
          aria-label="Filtrar por grupo"
          placeholder="Grupo"
          emptyValue={ALL}
          options={groupOptions}
          value={filters.groupId}
          onChange={(value) => update("groupId", value)}
          compact
          wrapperClassName="min-w-0 sm:flex-1"
          className={FILTER_TRIGGER}
        />
        <Select
          aria-label="Filtrar por tipo"
          placeholder="Tipo"
          emptyValue={ALL}
          options={typeOptions}
          value={filters.typeId}
          onChange={(value) => update("typeId", value)}
          compact
          wrapperClassName="min-w-0 sm:flex-1"
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
          wrapperClassName="col-span-2 min-w-0 sm:flex-1"
          className={FILTER_TRIGGER}
        />
      </div>
    </div>
  );
}
