"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

import { XIcon } from "@/ui/icons";

type DialogProps = {
  title: string;
  eyebrow?: string;
  closeLabel?: string;
  onClose: () => void;
  children: ReactNode;
};

export function Dialog({ title, eyebrow, closeLabel = "Fechar", onClose, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="backdrop:bg-ink/40 m-auto w-[calc(100%-24px)] max-w-[560px] overflow-visible border-none bg-transparent p-0 backdrop:backdrop-blur-[2px]"
    >
      <div className="scrollbar-themed bg-surface shadow-control max-h-[calc(100dvh-24px)] overflow-y-auto rounded-[10px] p-4 sm:p-5">
        <header className="border-line mb-4 flex items-start justify-between gap-4 border-b pb-3">
          <div>
            {eyebrow ? (
              <p className="text-accent mb-0.5 text-[11px] font-semibold tracking-[0.08em] uppercase">
                {eyebrow}
              </p>
            ) : null}
            <h2 id={titleId} className="text-xl font-semibold">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="bg-surface-alt text-danger shadow-control hover:bg-surface hover:shadow-control-hover active:shadow-control-active focus-visible:shadow-control-focus inline-flex size-8 cursor-pointer items-center justify-center rounded-[6px] transition-[background-color,color,box-shadow] duration-100 focus-visible:outline-none"
          >
            <XIcon />
          </button>
        </header>

        {children}
      </div>
    </dialog>
  );
}
