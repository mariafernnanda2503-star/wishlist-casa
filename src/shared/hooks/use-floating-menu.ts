"use client";

import { useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";

type FloatingMenuOptions = {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  matchAnchorWidth?: boolean;
  minWidth?: number;
  maxHeight?: number;
};

export function useFloatingMenu({
  open,
  anchorRef,
  matchAnchorWidth = false,
  minWidth = 0,
  maxHeight = 320,
}: FloatingMenuOptions) {
  const [style, setStyle] = useState<CSSProperties>();

  useLayoutEffect(() => {
    if (!open) return;

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = window.innerHeight;
      const gutter = 8;
      const gap = 6;
      const spaceBelow = viewportHeight - rect.bottom - gap - gutter;
      const spaceAbove = rect.top - gap - gutter;
      const openAbove = spaceBelow < Math.min(180, maxHeight) && spaceAbove > spaceBelow;
      const availableHeight = Math.max(48, openAbove ? spaceAbove : spaceBelow);
      const requestedWidth = matchAnchorWidth ? rect.width : Math.max(rect.width, minWidth);
      const width = Math.min(requestedWidth, viewportWidth - gutter * 2);
      const left = Math.min(Math.max(rect.left, gutter), viewportWidth - width - gutter);

      setStyle({
        position: "fixed",
        left,
        width,
        maxHeight: Math.min(maxHeight, availableHeight),
        ...(openAbove
          ? { bottom: viewportHeight - rect.top + gap, top: "auto" }
          : { top: rect.bottom + gap, bottom: "auto" }),
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef, matchAnchorWidth, maxHeight, minWidth, open]);

  return style;
}
