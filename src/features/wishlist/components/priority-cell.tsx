"use client";

import { useEffect, useRef, useState } from "react";

import { PRIORITIES, PRIORITY_LABEL, PRIORITY_TAG_CLASS } from "../lib";
import { type Item, type Priority } from "../types";

import { TagButton } from "./tag";

type PriorityCellProps = {
  item: Item;
  onChange: (id: string, priority: Priority) => void;
};

export function PriorityCell({ item, onChange }: PriorityCellProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <TagButton
        className={PRIORITY_TAG_CLASS[item.priority]}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {PRIORITY_LABEL[item.priority]}
      </TagButton>

      {open ? (
        <div
          role="menu"
          className="border-line bg-surface absolute top-full left-0 z-10 mt-1 flex flex-col gap-px rounded-lg border p-1 shadow-[0_4px_14px_rgba(0,0,0,0.15)]"
        >
          {PRIORITIES.map((priority) => (
            <button
              key={priority}
              type="button"
              role="menuitem"
              className="text-ink hover:bg-surface-alt cursor-pointer rounded-md px-2.5 py-2 text-left text-[13.5px] whitespace-nowrap"
              onClick={() => {
                setOpen(false);
                onChange(item.id, priority);
              }}
            >
              {PRIORITY_LABEL[priority]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
