import { type ComponentPropsWithRef } from "react";

import { cn } from "@/shared/lib/cn";

// Sem borda: quem faz esse papel é a linha escura de 1px dentro de
// `shadow-control`, igual aos campos do tema. Os estados seguem o mesmo
// caminho do botão — repouso, hover, foco — trocando só a sombra.
export const fieldClassName = cn(
  // caret-accent: o cursor piscando também segue o acento, em vez do preto
  // padrão do navegador que destoa da base sépia.
  "w-full rounded-lg bg-surface px-3 py-2.5 text-[15px] text-ink caret-accent placeholder:text-ink-soft",
  "shadow-control transition-[box-shadow] duration-100",
  "hover:shadow-control-hover",
  "focus:shadow-control-focus focus:outline-none",
  "disabled:pointer-events-none disabled:opacity-60",
);

export function Input({ className, ...props }: ComponentPropsWithRef<"input">) {
  return <input className={cn(fieldClassName, className)} {...props} />;
}
