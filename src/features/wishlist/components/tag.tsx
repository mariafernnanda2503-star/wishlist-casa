import { type ComponentPropsWithRef } from "react";

import { cn } from "@/shared/lib/cn";

const baseClassName =
  "shadow-tag inline-block whitespace-nowrap rounded-[0.35em] px-[0.6em] py-[0.15em] text-xs leading-4 font-semibold";

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
