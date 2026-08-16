"use client";

import { useMemo, useState } from "react";

import { cn } from "@/shared/lib/cn";
import { CartIcon, ChevronDownIcon } from "@/ui/icons";
import { Button } from "@/ui/primitives";

import { useShoppingTrips } from "../../hooks";
import { createActorLookup, formatPrice, formatQuantity } from "../../lib";
import { type Item, type Profile, type Trip } from "../../types";

import { CloseTripDialog } from "./close-trip-dialog";

const LABEL = "text-ink-soft block text-[11px] font-semibold tracking-[0.06em] uppercase";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

/**
 * O painel da lista de compras, no lugar dos totais da lista de desejos.
 *
 * As duas metades são a mesma história: em cima o carrinho de agora, embaixo as
 * idas já fechadas. Ficam juntas porque a pergunta é uma só — "quanto vai dar,
 * e quanto costuma dar".
 */
export function ShoppingBoard({
  listId,
  items,
  profiles,
  currentUserId,
  onTripClosed,
}: {
  listId: string;
  /** Todos os itens da lista, sem filtro: o carrinho não segue a busca. */
  items: Item[];
  /** Dão nome aos uuids de quem registrou e de quem corrigiu depois. */
  profiles: Profile[];
  currentUserId: string;
  /** A ida fechada devolve tudo para "a comprar" — a tela precisa recarregar. */
  onTripClosed: () => void;
}) {
  const { trips, closing, closeTrip } = useShoppingTrips(listId);
  const [open, setOpen] = useState(false);
  const [closingOpen, setClosingOpen] = useState(false);

  const cart = useMemo(() => items.filter((item) => item.status !== "wanted"), [items]);

  // O que está no carrinho vale o preço de costume enquanto ninguém confere;
  // é palpite, e o diálogo de fechamento é onde ele vira número.
  const estimate = cart.reduce((total, item) => total + (item.price ?? 0) * item.quantity, 0);

  const knownStores = useMemo(() => {
    const stores = (trips ?? []).flatMap((trip) => (trip.store ? [trip.store] : []));
    return [...new Set(stores)];
  }, [trips]);

  const lastTrip = trips?.[0] ?? null;
  const actorName = createActorLookup(profiles, currentUserId);

  return (
    <section className="bg-surface shadow-control mb-3 rounded-[10px]">
      <div className="flex flex-wrap items-end justify-between gap-4 px-4 py-3">
        <div>
          <span className={LABEL}>No carrinho</span>
          <strong className="text-jade text-xl font-semibold tabular-nums">
            {formatPrice(estimate)}
          </strong>
          <p className="text-ink-soft mt-0.5 text-[12px]">
            {cart.length === 0
              ? "Marque o que já pegou para fechar a compra."
              : `${cart.length} de ${items.length} ${items.length === 1 ? "item" : "itens"} — estimativa pelo preço de costume`}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          {lastTrip ? (
            <span className="text-ink-soft text-[12px]">
              Última: {formatPrice(lastTrip.total)} em{" "}
              {dateFormatter.format(new Date(lastTrip.shopped_at))}
              {lastTrip.store ? ` · ${lastTrip.store}` : ""}
            </span>
          ) : null}
          <Button
            type="button"
            disabled={cart.length === 0}
            onClick={() => setClosingOpen(true)}
            className="inline-flex items-center gap-2 text-[15px] max-sm:min-h-10"
          >
            <CartIcon />
            Fechar compra
          </Button>
        </div>
      </div>

      {trips !== null && trips.length > 0 ? (
        <>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
            className="border-line text-ink-soft hover:text-ink focus-visible:shadow-control-focus flex w-full cursor-pointer items-center justify-center gap-1.5 border-t px-4 py-2 text-[12px] font-medium transition-colors duration-100 focus-visible:outline-none"
          >
            {open ? "Ocultar" : "Ver"} compras anteriores ({trips.length})
            <ChevronDownIcon
              className={cn("size-3.5 transition-transform duration-100", open && "rotate-180")}
            />
          </button>

          {open ? (
            <ul className="divide-line border-line divide-y border-t px-4">
              {trips.map((trip) => (
                <TripRow key={trip.id} trip={trip} actorName={actorName} />
              ))}
            </ul>
          ) : null}
        </>
      ) : null}

      {closingOpen ? (
        <CloseTripDialog
          cart={cart}
          knownStores={knownStores}
          closing={closing}
          onSubmit={async (input) => {
            const closed = await closeTrip(input);
            if (closed) onTripClosed();
            return closed;
          }}
          onClose={() => setClosingOpen(false)}
        />
      ) : null}
    </section>
  );
}

function TripRow({ trip, actorName }: { trip: Trip; actorName: (actor: string | null) => string }) {
  const [open, setOpen] = useState(false);
  // Só aparece quando alguém mexeu depois de fechada: numa lista de família,
  // "corrigida por" é a informação que evita a discussão. `updated_by` nulo é
  // ida que nunca foi tocada — comparar só as datas confundiria com isso.
  const corrigida =
    trip.updated_by !== null && new Date(trip.updated_at) > new Date(trip.created_at);

  return (
    <li className="py-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="focus-visible:shadow-control-focus flex w-full cursor-pointer items-baseline gap-3 rounded-[6px] text-left focus-visible:outline-none"
      >
        <ChevronDownIcon
          className={cn(
            "text-ink-soft size-3.5 shrink-0 self-center transition-transform duration-100",
            open && "rotate-180",
          )}
        />
        <span className="min-w-0 flex-1 truncate text-sm">
          {trip.store ?? "Sem mercado anotado"}
          <span className="text-ink-soft ml-2 text-[12px]">
            {dateFormatter.format(new Date(trip.shopped_at))} · {trip.lines.length}{" "}
            {trip.lines.length === 1 ? "item" : "itens"} · {actorName(trip.created_by)}
          </span>
        </span>
        <span className="shrink-0 text-sm font-semibold tabular-nums">
          {formatPrice(trip.total)}
        </span>
      </button>

      {open ? (
        <ul className="mt-1.5 ml-6.5">
          {trip.note ? <li className="text-ink-soft mb-1 text-[12px]">{trip.note}</li> : null}
          {corrigida ? (
            <li className="text-ink-soft mb-1 text-[12px]">
              Corrigida por {actorName(trip.updated_by)} em{" "}
              {dateFormatter.format(new Date(trip.updated_at))}
            </li>
          ) : null}
          {trip.lines.map((line) => (
            <li key={line.id} className="flex items-baseline gap-3 py-1 text-[13px]">
              <span className="min-w-0 flex-1 truncate">
                {line.name}
                {/* Avulso é o que se comprou sem estar na lista — sem a marca,
                    a ida parece ter itens que ninguém planejou. */}
                {line.item_id === null ? (
                  <span className="text-ink-soft ml-1.5 text-[11px]">avulso</span>
                ) : null}
              </span>
              <span className="text-ink-soft w-20 shrink-0 text-right tabular-nums">
                {formatQuantity(line.quantity, line.unit)}
              </span>
              <span className="w-24 shrink-0 text-right tabular-nums">
                {line.unit_price === null ? "—" : formatPrice(line.unit_price * line.quantity)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}
