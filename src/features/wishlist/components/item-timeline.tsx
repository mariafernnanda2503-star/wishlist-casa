"use client";

import { useItemEvents } from "../hooks";
import { STATUS_LABEL } from "../lib";
import { type ItemEvent, type Profile, type Status } from "../types";

const LABEL = "text-ink-soft mb-1.5 block text-[11px] font-semibold tracking-[0.06em] uppercase";

const stampFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function statusLabel(value: string | null) {
  return value ? (STATUS_LABEL[value as Status] ?? value) : "—";
}

function describe(event: ItemEvent): string {
  switch (event.type) {
    case "created":
      return "adicionou o item";
    case "status_changed":
      return `mudou de ${statusLabel(event.from_value)} para ${statusLabel(event.to_value)}`;
    case "price_registered":
      return "registrou um preço";
    case "deleted":
      return "removeu da lista";
    case "restored":
      return "restaurou o item";
    default:
      return event.type;
  }
}

type ItemTimelineProps = {
  itemId: string;
  profiles: Profile[];
  currentUserId: string | null;
  /** Muda quando algo acontece no painel, para a trilha buscar de novo. */
  refreshKey: number;
};

export function ItemTimeline({ itemId, profiles, currentUserId, refreshKey }: ItemTimelineProps) {
  const events = useItemEvents(itemId, refreshKey);

  function actorName(actor: string | null) {
    if (actor === null) return "Alguém";
    if (actor === currentUserId) return "Você";
    return profiles.find((profile) => profile.id === actor)?.display_name ?? "Alguém";
  }

  return (
    <section>
      <h3 className={LABEL}>Histórico</h3>

      {events === null ? (
        <p className="text-ink-soft text-sm">Carregando histórico...</p>
      ) : events.length === 0 ? (
        // Itens criados antes da trilha existir não têm eventos anteriores.
        <p className="text-ink-soft text-sm">Nada registrado ainda para este item.</p>
      ) : (
        <ol className="space-y-2.5">
          {events.map((event) => (
            <li key={event.id} className="flex gap-2.5 text-sm">
              <span
                aria-hidden="true"
                className="bg-accent-soft mt-1.5 size-2 shrink-0 rounded-full"
              />
              <div className="min-w-0 flex-1">
                <p className="leading-5">
                  <strong className="font-semibold">{actorName(event.actor)}</strong>{" "}
                  {describe(event)}
                </p>
                <time
                  dateTime={event.created_at}
                  className="text-ink-soft text-[12px] tabular-nums"
                >
                  {stampFormatter.format(new Date(event.created_at))}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
