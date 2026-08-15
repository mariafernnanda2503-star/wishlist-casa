import { type ComponentPropsWithRef } from "react";

import { cn } from "@/shared/lib/cn";
import { CheckIcon } from "@/ui/icons";

type CheckboxProps = Omit<ComponentPropsWithRef<"input">, "type"> & {
  label: string;
};

/**
 * O input nativo fica invisível mas continua sendo o elemento real — recebe o
 * foco, o clique e o valor do formulário. O quadrado é um irmão que reage via
 * `peer-*`. Sem relevo: aqui a marca é a cor, não a sombra.
 */
export function Checkbox({ label, className, ...props }: CheckboxProps) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-2 select-none", className)}>
      <input type="checkbox" className="peer sr-only" {...props} />
      <span
        className={cn(
          // Mesmo relevo dos campos: é o que amarra a checkbox ao resto dos
          // controles em vez de deixá-la como um quadrado solto.
          "bg-surface shadow-control flex size-[15px] shrink-0 items-center justify-center rounded-[5px]",
          "transition-[background-color,box-shadow] duration-100",
          "peer-hover:shadow-control-hover",
          // Marcado é fundo suave + marca no acento, o mesmo par das tags do
          // app. Preencher de jade sólido faria um controle secundário
          // competir em peso com o botão primário.
          "peer-checked:bg-accent-soft peer-checked:text-accent",
          "peer-focus-visible:shadow-control-focus",
          "[&_svg]:opacity-0 peer-checked:[&_svg]:opacity-100",
        )}
      >
        <CheckIcon className="size-2.5 transition-opacity duration-100" strokeWidth={3.5} />
      </span>
      {label}
    </label>
  );
}
