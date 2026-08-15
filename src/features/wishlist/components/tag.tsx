import { type ComponentPropsWithRef } from "react";

import { cn } from "@/shared/lib/cn";

const baseClassName =
  "inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold";

export function Tag({ className, ...props }: ComponentPropsWithRef<"span">) {
  return <span className={cn(baseClassName, className)} {...props} />;
}

/** Tag clicável — a de prioridade. Escurece de leve e afunda 1px ao pressionar. */
export function TagButton({ className, ...props }: ComponentPropsWithRef<"button">) {
  return (
    <button
      type="button"
      className={cn(
        baseClassName,
        "ease-jumpy cursor-pointer transition-[filter,transform] duration-100",
        "hover:brightness-95 active:translate-y-px active:brightness-90",
        "focus-visible:shadow-control-focus focus-visible:outline-none",
        className,
      )}
      {...props}
    />
  );
}
