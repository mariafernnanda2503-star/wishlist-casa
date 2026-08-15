"use client";

import { type ComponentPropsWithRef } from "react";

import { cn } from "@/shared/lib/cn";
import { SearchIcon, XIcon } from "@/ui/icons";

import { fieldClassName } from "./input";

type SearchFieldProps = Omit<ComponentPropsWithRef<"input">, "type" | "value"> & {
  value: string;
  onClear: () => void;
  wrapperClassName?: string;
};

export function SearchField({
  value,
  onClear,
  className,
  wrapperClassName,
  ...props
}: SearchFieldProps) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <SearchIcon className="text-ink-soft pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2" />

      <input
        type="search"
        value={value}
        // O `search` nativo desenha um X próprio no WebKit, que ignora os
        // tokens e duplica o botão de limpar abaixo.
        className={cn(
          fieldClassName,
          "pr-10 pl-10 [&::-webkit-search-cancel-button]:appearance-none",
          className,
        )}
        {...props}
      />

      {value ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Limpar busca"
          className="text-ink-soft hover:text-ink focus-visible:outline-accent absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-sm p-1 transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-1"
        >
          <XIcon className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
