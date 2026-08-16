"use client";

import { useRef, useState, type ReactNode } from "react";

import { useFloatingMenu } from "@/shared/hooks/use-floating-menu";
import { cn } from "@/shared/lib/cn";
import { ChevronDownIcon } from "@/ui/icons";

type MenuButtonProps = {
  /** Conteúdo do gatilho — um título, um nome, o que o menu está mostrando. */
  label: ReactNode;
  triggerClassName?: string;
  chevronClassName?: string;
  menuClassName?: string;
  /** Recebe `close` para cada item poder fechar o menu ao ser escolhido. */
  children: (close: () => void) => ReactNode;
};

/**
 * Gatilho com chevron + menu flutuante que fecha ao clicar fora.
 *
 * Existia duas vezes, quase idêntico, no seletor de lista e no de espaço. O
 * conteúdo dos dois é bem diferente, então o que virou compartilhado é só a
 * mecânica — posicionamento, estado de aberto e fechamento por clique fora.
 */
export function MenuButton({
  label,
  triggerClassName,
  chevronClassName,
  menuClassName,
  children,
}: MenuButtonProps) {
  const [open, setOpen] = useState(false);
  // `useRef` e não `useState`: um objeto `{ current }` recriado a cada render
  // faria o efeito do hook de posicionamento rodar sem parar.
  const containerRef = useRef<HTMLDivElement>(null);
  const floatingStyle = useFloatingMenu({ open, anchorRef: containerRef, matchAnchorWidth: false });

  return (
    <div ref={containerRef} className="relative min-w-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((atual) => !atual)}
        className={cn(
          "flex min-w-0 cursor-pointer items-center focus-visible:outline-none",
          triggerClassName,
        )}
      >
        {label}
        <ChevronDownIcon
          className={cn(
            "shrink-0 transition-transform duration-100",
            open && "rotate-180",
            chevronClassName,
          )}
        />
      </button>

      {open ? (
        <>
          {/* Clique fora fecha. Um irmão invisível evita ouvinte no document. */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="menu"
            style={floatingStyle}
            className={cn("popover fixed z-50", menuClassName)}
          >
            {children(() => setOpen(false))}
          </div>
        </>
      ) : null}
    </div>
  );
}
