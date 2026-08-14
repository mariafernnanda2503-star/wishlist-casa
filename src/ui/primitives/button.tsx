import { type ComponentPropsWithRef } from "react";

import { cn } from "@/shared/lib/cn";

const VARIANTS = {
  primary:
    "bg-accent text-on-accent shadow-control-accent hover:bg-accent-hover hover:shadow-control-accent-hover",
  secondary: "bg-surface text-ink-soft shadow-control hover:bg-surface-alt",
} as const;

type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: keyof typeof VARIANTS;
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        // O padding inferior é 2px maior que o superior para compensar o bisel
        // da sombra; ao pressionar, os dois trocam e o botão parece afundar.
        "cursor-pointer rounded-lg px-3 pt-2 pb-2.5 text-sm font-medium",
        "transition-[background-color,box-shadow,padding] duration-150",
        "active:pt-2.5 active:pb-2",
        "disabled:cursor-default disabled:opacity-60",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
