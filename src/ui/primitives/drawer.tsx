"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

import { XIcon } from "@/ui/icons";

type DrawerProps = {
  title: string;
  eyebrow?: string;
  closeLabel?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function Drawer({
  title,
  eyebrow,
  closeLabel = "Fechar",
  onClose,
  children,
  footer,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!drawerRef.current?.open) drawerRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={drawerRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="backdrop:bg-ink/40 m-0 ml-auto h-dvh w-[min(440px,calc(100%-16px))] max-w-none overflow-visible border-none bg-transparent p-0 backdrop:backdrop-blur-[2px] max-sm:mt-auto max-sm:ml-0 max-sm:h-[min(88dvh,720px)] max-sm:w-full"
    >
      <div className="drawer-panel bg-surface shadow-control flex h-full min-h-0 flex-col overflow-hidden rounded-l-[12px] max-sm:rounded-t-[12px] max-sm:rounded-b-none">
        <header className="border-line flex shrink-0 items-start justify-between gap-4 border-b px-5 py-4 max-sm:px-4">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-accent mb-0.5 text-[11px] font-semibold tracking-[0.08em] uppercase">
                {eyebrow}
              </p>
            ) : null}
            <h2 id={titleId} className="truncate text-xl font-semibold">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="bg-surface-alt text-danger shadow-control hover:bg-surface hover:shadow-control-hover active:shadow-control-active focus-visible:shadow-control-focus inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[6px] transition-[background-color,box-shadow] duration-100 focus-visible:outline-none"
          >
            <XIcon />
          </button>
        </header>

        <div className="scrollbar-themed min-h-0 flex-1 overflow-y-auto px-5 py-4 max-sm:px-4">
          {children}
        </div>

        {footer ? (
          <footer className="border-line bg-surface-alt flex shrink-0 gap-2 border-t px-5 py-4 max-sm:px-4">
            {footer}
          </footer>
        ) : null}
      </div>
    </dialog>
  );
}
