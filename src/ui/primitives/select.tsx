"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { useFloatingMenu } from "@/shared/hooks/use-floating-menu";
import { cn } from "@/shared/lib/cn";
import { ChevronDownIcon, PlusIcon } from "@/ui/icons";

import { fieldClassName } from "./input";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Texto do gatilho quando `value` é `emptyValue`. Não é item da lista. */
  placeholder: string;
  /** Valor que conta como "nada escolhido". Filtros usam "all"; formulários, "". */
  emptyValue?: string;
  "aria-label"?: string;
  className?: string;
  wrapperClassName?: string;
  compact?: boolean;
  /** Quando presente, o menu ganha busca e permite criar uma opção inexistente. */
  onCreateOption?: (label: string) => Promise<string | null>;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Gatilho + lista própria, com criação opcional de valores. */
export function Select({
  value,
  onChange,
  options,
  placeholder,
  emptyValue = "",
  "aria-label": ariaLabel,
  className,
  wrapperClassName,
  compact = false,
  onCreateOption,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const floatingStyle = useFloatingMenu({
    open,
    anchorRef: containerRef,
    matchAnchorWidth: true,
  });

  const selected = options.find((option) => option.value === value);
  const showingPlaceholder = value === emptyValue || !selected;
  const normalizedQuery = normalize(query.trim());
  const filteredOptions = normalizedQuery
    ? options.filter((option) => normalize(option.label).includes(normalizedQuery))
    : options;
  const exactOption = normalizedQuery
    ? options.find((option) => normalize(option.label) === normalizedQuery)
    : undefined;
  const canCreate = Boolean(onCreateOption && query.trim() && !exactOption);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open && onCreateOption) searchRef.current?.focus();
  }, [open, onCreateOption]);

  function close({ restoreFocus = false } = {}) {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function choose(option: SelectOption) {
    onChange(option.value);
    close();
  }

  function openAt(index: number) {
    setQuery("");
    setActiveIndex(index);
    setOpen(true);
  }

  async function createOption() {
    const label = query.trim();
    if (!onCreateOption || !label || exactOption || creating) return;

    setCreating(true);
    const createdValue = await onCreateOption(label);
    setCreating(false);

    if (!createdValue) return;
    onChange(createdValue);
    close();
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const selectedIndex = Math.max(
      0,
      options.findIndex((option) => option.value === value),
    );

    switch (event.key) {
      case "Escape":
        close();
        return;
      case "ArrowDown":
        event.preventDefault();
        if (!open) openAt(selectedIndex);
        else setActiveIndex((current) => Math.min(current + 1, options.length - 1));
        return;
      case "ArrowUp":
        event.preventDefault();
        if (!open) openAt(selectedIndex);
        else setActiveIndex((current) => Math.max(current - 1, 0));
        return;
      case "Home":
        if (!open) return;
        event.preventDefault();
        setActiveIndex(0);
        return;
      case "End":
        if (!open) return;
        event.preventDefault();
        setActiveIndex(options.length - 1);
        return;
      case "Enter":
      case " ":
        event.preventDefault();
        if (!open) openAt(selectedIndex);
        else if (options[activeIndex]) choose(options[activeIndex]);
        return;
      default:
        return;
    }
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "Escape":
        event.preventDefault();
        close({ restoreFocus: true });
        return;
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, filteredOptions.length - 1));
        return;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
        return;
      case "Enter": {
        event.preventDefault();
        const option = filteredOptions[activeIndex];
        if (option) choose(option);
        else if (canCreate) void createOption();
        return;
      }
      default:
        return;
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", wrapperClassName)}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onClick={() => {
          if (open) close();
          else
            openAt(
              Math.max(
                0,
                options.findIndex((option) => option.value === value),
              ),
            );
        }}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          fieldClassName,
          className,
          "group/select grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] p-0 text-left",
        )}
      >
        <span
          className={cn(
            "min-w-0 truncate px-3.5",
            compact ? "py-2" : "py-2.5",
            showingPlaceholder && "text-ink-soft",
          )}
        >
          {showingPlaceholder ? placeholder : selected.label}
        </span>
        <span
          className={cn(
            "border-line text-ink-soft group-hover/select:text-accent flex items-center justify-center self-stretch border-l transition-colors duration-100",
            compact ? "w-9" : "w-[43px]",
            open && "text-accent",
          )}
        >
          <ChevronDownIcon
            className={cn("transition-transform duration-100", open && "rotate-180")}
          />
        </span>
      </button>

      {open ? (
        <div
          style={floatingStyle}
          className="popover scrollbar-themed fixed z-50 overflow-y-auto overscroll-contain"
        >
          {onCreateOption ? (
            <div className="border-line mb-1 border-b p-1 pb-2">
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onSearchKeyDown}
                placeholder="Buscar ou adicionar..."
                aria-label={`Buscar ou adicionar ${ariaLabel?.toLowerCase() ?? "opção"}`}
                className="bg-surface text-ink shadow-control focus:shadow-control-focus w-full rounded-[6px] px-2.5 py-2 text-[13px] outline-none"
              />
            </div>
          ) : null}

          <div id={listId} role="listbox" aria-label={ariaLabel}>
            {filteredOptions.map((option, index) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(option)}
                className={cn(
                  "popover-item truncate",
                  index === activeIndex && "bg-surface",
                  option.value === value && "text-accent font-semibold",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {canCreate ? (
            <button
              type="button"
              disabled={creating}
              onClick={() => void createOption()}
              className="border-line text-accent hover:bg-surface focus-visible:bg-surface mt-1 flex w-full cursor-pointer items-center gap-2 border-t px-3 pt-2.5 pb-2 text-left text-[13px] font-semibold outline-none disabled:pointer-events-none disabled:opacity-60"
            >
              <PlusIcon className="size-3.5" />
              {creating ? "Adicionando..." : `Adicionar “${query.trim()}”`}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
