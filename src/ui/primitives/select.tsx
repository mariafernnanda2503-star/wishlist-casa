"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { useFloatingMenu } from "@/shared/hooks/use-floating-menu";
import { cn } from "@/shared/lib/cn";
import { ChevronDownIcon } from "@/ui/icons";

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
};

/**
 * Gatilho + lista própria, no lugar do `<select>` nativo.
 *
 * O nativo mostra fechado o texto da opção selecionada, então um rótulo como
 * "Área" só apareceria fechado se também fosse uma opção escolhível — que era
 * exatamente o problema. Separando o gatilho da lista, o rótulo vive só no
 * gatilho, e a lista mostra apenas escolhas de verdade.
 */
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
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const floatingStyle = useFloatingMenu({
    open,
    anchorRef: containerRef,
    matchAnchorWidth: true,
  });

  const selected = options.find((option) => option.value === value);
  const showingPlaceholder = value === emptyValue || !selected;

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function choose(index: number) {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
  }

  function openAt(index: number) {
    setActiveIndex(index);
    setOpen(true);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const selectedIndex = Math.max(
      0,
      options.findIndex((option) => option.value === value),
    );

    switch (event.key) {
      case "Escape":
        setOpen(false);
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
        else choose(activeIndex);
        return;
      default:
        return;
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", wrapperClassName)}>
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onClick={() => {
          if (open) setOpen(false);
          else
            openAt(
              Math.max(
                0,
                options.findIndex((option) => option.value === value),
              ),
            );
        }}
        onKeyDown={onKeyDown}
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
            "border-line text-ink-soft group-hover/select:text-accent flex items-center justify-center self-stretch border-l transition-[background-color,color] duration-100",
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
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          style={floatingStyle}
          className="popover scrollbar-themed fixed z-50 overflow-y-auto overscroll-contain"
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(index)}
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
      ) : null}
    </div>
  );
}
