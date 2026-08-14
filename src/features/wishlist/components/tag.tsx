import { type ComponentPropsWithoutRef } from "react";

import { cn } from "@/shared/lib/cn";

const baseClassName =
  "inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold";

export function Tag({ className, ...props }: ComponentPropsWithoutRef<"span">) {
  return <span className={cn(baseClassName, className)} {...props} />;
}

export function TagButton({ className, ...props }: ComponentPropsWithoutRef<"button">) {
  return (
    <button type="button" className={cn(baseClassName, "cursor-pointer", className)} {...props} />
  );
}
