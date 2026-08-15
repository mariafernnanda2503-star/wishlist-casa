"use client";

import { useId, type ComponentPropsWithRef, type ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

import { fieldClassName } from "./input";

/** Compartilhado com o Select para que as duas labels sejam de fato a mesma. */
export const fieldLabelClassName =
  "text-ink-soft mb-1 block text-[11px] font-semibold tracking-[0.06em] uppercase";

type FieldProps = Omit<ComponentPropsWithRef<"input">, "id"> & {
  label: string;
  /** Ação encostada na direita, dentro do campo — hoje só o olho da senha. */
  trailing?: ReactNode;
};

export function Field({ label, trailing, className, ...props }: FieldProps) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className={fieldLabelClassName}>
        {label}
      </label>
      <div className="relative">
        <input id={id} className={cn(fieldClassName, trailing && "pr-11", className)} {...props} />
        {trailing ? (
          <span className="text-ink-soft absolute top-1/2 right-3.5 flex -translate-y-1/2 items-center">
            {trailing}
          </span>
        ) : null}
      </div>
    </div>
  );
}
