import { type ComponentPropsWithRef } from "react";

import { cn } from "@/shared/lib/cn";

const baseClassName =
  "shadow-tag inline-flex min-h-6 min-w-6 max-w-full items-center justify-center overflow-hidden rounded-[5px] px-2 py-1 text-xs leading-none font-semibold text-ellipsis whitespace-nowrap";

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
        "ease-jumpy cursor-pointer transition-[box-shadow,filter,transform] duration-100",
        "hover:shadow-tag-hover hover:brightness-95 active:translate-y-px active:brightness-90",
        "focus-visible:shadow-control-focus focus-visible:outline-none",
        className,
      )}
      {...props}
    />
  );
}
