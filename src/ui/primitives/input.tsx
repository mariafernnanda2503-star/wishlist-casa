import { type ComponentPropsWithRef } from "react";

import { cn } from "@/shared/lib/cn";

// Sem borda: quem faz esse papel é a linha escura de 1px dentro de
// `shadow-control`, igual aos campos do tema.
export const fieldClassName =
  "w-full rounded-lg bg-surface px-3 py-2.5 text-[15px] text-ink shadow-control " +
  "placeholder:text-ink-soft focus:outline-2 focus:outline-offset-1 focus:outline-accent";

export function Input({ className, ...props }: ComponentPropsWithRef<"input">) {
  return <input className={cn(fieldClassName, className)} {...props} />;
}
