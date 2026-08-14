import { type Priority } from "../types";

export const PRIORITY_ORDER: Record<Priority, number> = { alta: 0, media: 1, baixa: 2 };

export const PRIORITY_LABEL: Record<Priority, string> = {
  alta: "🔴 Alta",
  media: "🟡 Média",
  baixa: "⚪ Baixa",
};

export const PRIORITY_FORM_LABEL: Record<Priority, string> = {
  alta: "🔴 Alta prioridade",
  media: "🟡 Média prioridade",
  baixa: "⚪ Baixa prioridade",
};

export const PRIORITIES: Priority[] = ["alta", "media", "baixa"];

export const PRIORITY_TAG_CLASS: Record<Priority, string> = {
  alta: "bg-priority-alta-soft text-priority-alta",
  media: "bg-priority-media-soft text-priority-media",
  baixa: "bg-priority-baixa-soft text-priority-baixa",
};

export const DEFAULT_PRIORITY: Priority = "media";

export const ALL = "all";
