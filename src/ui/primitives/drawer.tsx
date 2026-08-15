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
  navigation?: ReactNode;
};

export function Drawer({
  title,
  eyebrow,
  closeLabel = "Fechar",
  onClose,
  children,
  footer,
  navigation,
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
      className="backdrop:bg-ink/40 m-0 ml-auto h-dvh w-[min(600px,calc(100%-24px))] max-w-none overflow-visible border-none bg-transparent p-0 backdrop:backdrop-blur-[2px] max-sm:mt-auto max-sm:ml-0 max-sm:h-[min(90dvh,780px)] max-sm:w-full"
    >
      <div className="drawer-panel border-line bg-surface shadow-popover flex h-full min-h-0 flex-col overflow-hidden rounded-l-[6px] border-l max-sm:rounded-t-[16px] max-sm:rounded-b-none max-sm:border-t max-sm:border-l-0">
        <div
          aria-hidden="true"
          className="bg-line mx-auto mt-2 h-1 w-10 shrink-0 rounded-full sm:hidden"
        />

        <header className="border-line bg-surface-alt max-sm:bg-surface flex shrink-0 items-start justify-between gap-5 border-b px-6 py-5 max-sm:px-4 max-sm:pt-2.5 max-sm:pb-3.5">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-accent mb-0.5 text-[11px] font-semibold tracking-[0.08em] uppercase">
                {eyebrow}
              </p>
            ) : null}
            <h2 id={titleId} className="truncate text-2xl font-semibold max-sm:text-xl">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="bg-surface text-danger shadow-control hover:bg-surface-alt hover:shadow-control-hover active:shadow-control-active focus-visible:shadow-control-focus inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[5px] transition-[background-color,box-shadow] duration-100 focus-visible:outline-none"
          >
            <XIcon />
          </button>
        </header>

        {navigation ? (
          <div className="border-line bg-surface-alt flex shrink-0 justify-center border-b px-4 py-2 sm:hidden">
            {navigation}
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1">
          <div className="scrollbar-themed min-w-0 flex-1 overflow-y-auto px-6 py-5 max-sm:px-4 max-sm:py-4">
            {children}
          </div>

          {navigation ? (
            <aside className="border-line bg-surface-alt hidden w-14 shrink-0 items-start justify-center border-l px-2 py-3 sm:flex">
              {navigation}
            </aside>
          ) : null}
        </div>

        {footer ? (
          <footer className="border-line bg-surface-alt flex shrink-0 justify-end gap-2 border-t px-6 py-4 max-sm:px-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </footer>
        ) : null}
      </div>
    </dialog>
  );
}
