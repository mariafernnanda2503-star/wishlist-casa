"use client";

import { useState, type ComponentPropsWithRef } from "react";

import { cn } from "@/shared/lib/cn";

export const iconActionBaseClassName =
  "shadow-control hover:shadow-control-hover active:shadow-control-active focus-visible:shadow-control-focus inline-flex cursor-pointer items-center justify-center rounded-[5px] border border-transparent transition-[background-color,border-color,color,box-shadow,transform] duration-100 focus-visible:outline-none";

type IconActionProps = ComponentPropsWithRef<"button"> & {
  active?: boolean;
  tooltip?: string;
};

export function IconAction({
  active = false,
  tooltip,
  className,
  onClick,
  onFocus,
  onPointerLeave,
  ...props
}: IconActionProps) {
  const [tooltipDismissed, setTooltipDismissed] = useState(false);

  return (
    <span className="group/icon-action relative inline-flex">
      <button
        type="button"
        className={cn(
          iconActionBaseClassName,
          "peer size-9",
          active
            ? "border-jade bg-jade text-on-jade shadow-control-accent"
            : "bg-surface text-ink-soft hover:bg-surface-alt hover:text-jade",
          className,
        )}
        onClick={(event) => {
          setTooltipDismissed(true);
          onClick?.(event);
        }}
        onFocus={(event) => {
          setTooltipDismissed(false);
          onFocus?.(event);
        }}
        onPointerLeave={(event) => {
          setTooltipDismissed(false);
          onPointerLeave?.(event);
        }}
        {...props}
      />

      {tooltip && !tooltipDismissed ? (
        <span
          role="tooltip"
          className="bg-ink text-surface shadow-popover pointer-events-none absolute top-1/2 right-[calc(100%+8px)] z-20 -translate-y-1/2 rounded-[5px] px-2 py-1.5 text-[11.5px] font-medium whitespace-nowrap opacity-0 transition-[opacity,transform] duration-100 group-hover/icon-action:opacity-100 peer-focus-visible:opacity-100 max-sm:top-[calc(100%+6px)] max-sm:right-auto max-sm:left-1/2 max-sm:-translate-x-1/2 max-sm:translate-y-0"
        >
          {tooltip}
        </span>
      ) : null}
    </span>
  );
}
