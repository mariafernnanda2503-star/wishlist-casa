import { type ComponentPropsWithRef } from "react";

import { cn } from "@/shared/lib/cn";

const VARIANTS = {
  primary:
    "bg-accent text-on-accent shadow-control-accent hover:bg-accent-hover hover:shadow-control-accent-hover",
  secondary:
    "bg-surface text-ink-soft shadow-control hover:bg-surface-alt hover:shadow-control-hover",
} as const;

type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: keyof typeof VARIANTS;
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "cursor-pointer rounded-lg px-3 text-sm font-medium",
        // O padding inferior é 2px maior que o superior para compensar o bisel
        // da sombra. Ao pressionar os dois trocam e o botão parece afundar —
        // o mesmo par --button-padding / --button-padding-active do tema.
        "pt-2 pb-2.5 active:pt-2.5 active:pb-2",
        "ease-jumpy transition-[background-color,box-shadow,padding] duration-100",
        // Pressionado o relevo inverte: sai o bisel, entra sombra interna.
        "active:shadow-control-active",
        "focus-visible:shadow-control-focus focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-60",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
