"use client";

import { useState, type FormEvent } from "react";

import { PlusIcon, TrashIcon } from "@/ui/icons";
import { Button, Input } from "@/ui/primitives";

import { usePriceHistory } from "../hooks";
import { formatPrice, parsePriceInput } from "../lib";
import { type Item } from "../types";

import { PriceSparkline } from "./price-sparkline";
import { Tag } from "./tag";

const LABEL = "text-ink-soft mb-1.5 block text-[11px] font-semibold tracking-[0.06em] uppercase";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

function formatDate(iso: string) {
  return dateFormatter.format(new Date(iso));
}

type PriceHistorySectionProps = {
  item: Item;
  /** Avisa o painel que a trilha ganhou um evento novo. */
  onRegistered: () => void;
};

export function PriceHistorySection({ item, onRegistered }: PriceHistorySectionProps) {
  const { checks, summary, addCheck, removeCheck } = usePriceHistory(item.id, item.price_target);
  const [price, setPrice] = useState("");
  const [store, setStore] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = parsePriceInput(price);
    if (parsed === null) return;

    setSaving(true);
    const added = await addCheck(parsed, store.trim() || null);
    setSaving(false);

    if (added) {
      setPrice("");
      setStore("");
      onRegistered();
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className={`${LABEL} mb-0`}>Preços vistos</h3>
        {summary.belowTarget === true ? (
          <Tag className="bg-accent-soft text-accent">Abaixo do alvo</Tag>
        ) : summary.belowTarget === false ? (
          <Tag className="bg-priority-media-soft text-priority-media">Acima do alvo</Tag>
        ) : null}
      </div>

      <dl className="bg-line shadow-control grid grid-cols-3 gap-px overflow-hidden rounded-[8px]">
        <div className="bg-surface-alt min-w-0 px-3 py-3">
          <dt className={LABEL}>Último</dt>
          <dd className="truncate text-[13px] font-semibold tabular-nums sm:text-sm">
            {summary.latest ? formatPrice(summary.latest.price) : "—"}
          </dd>
        </div>
        <div className="bg-surface-alt min-w-0 px-3 py-3">
          <dt className={LABEL}>Melhor</dt>
          <dd className="text-accent truncate text-[13px] font-semibold tabular-nums sm:text-sm">
            {summary.best ? formatPrice(summary.best.price) : "—"}
          </dd>
        </div>
        <div className="bg-surface-alt min-w-0 px-3 py-3">
          <dt className={LABEL}>Alvo</dt>
          <dd className="text-ink-soft truncate text-[13px] font-semibold tabular-nums sm:text-sm">
            {formatPrice(item.price_target)}
          </dd>
        </div>
      </dl>

      {checks && checks.length >= 2 ? <PriceSparkline checks={checks} /> : null}

      <form
        onSubmit={onSubmit}
        className="flex gap-2 max-[420px]:grid max-[420px]:grid-cols-[minmax(0,1fr)_auto]"
      >
        <Input
          type="text"
          inputMode="decimal"
          placeholder="Vi por quanto?"
          aria-label="Preço visto"
          className="min-w-0 flex-1"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
        <Input
          type="text"
          placeholder="Onde? (opcional)"
          aria-label="Loja"
          className="min-w-0 flex-1 max-[420px]:col-span-2 max-[420px]:row-start-2"
          value={store}
          onChange={(event) => setStore(event.target.value)}
        />
        <Button
          type="submit"
          disabled={saving || parsePriceInput(price) === null}
          aria-label="Registrar preço"
          className="shrink-0 px-3 max-[420px]:col-start-2 max-[420px]:row-start-1"
        >
          <PlusIcon />
        </Button>
      </form>

      {checks === null ? (
        <p className="text-ink-soft text-sm">Carregando histórico...</p>
      ) : checks.length === 0 ? (
        <p className="text-ink-soft text-sm">
          Nenhum preço registrado ainda. Anote o que você viu e o histórico começa aqui.
        </p>
      ) : (
        <ul className="divide-line divide-y">
          {checks.map((check) => (
            <li key={check.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="font-semibold tabular-nums">{formatPrice(check.price)}</span>
              {check.store ? <span className="text-ink-soft truncate">{check.store}</span> : null}
              <span className="text-ink-soft ml-auto shrink-0 tabular-nums">
                {formatDate(check.checked_at)}
              </span>
              <button
                type="button"
                onClick={() => void removeCheck(check.id)}
                aria-label={`Remover registro de ${formatPrice(check.price)}`}
                className="text-ink-soft hover:text-danger focus-visible:outline-accent shrink-0 cursor-pointer rounded-sm p-1 transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <TrashIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
