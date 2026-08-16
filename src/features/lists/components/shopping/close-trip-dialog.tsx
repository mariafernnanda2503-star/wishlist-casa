"use client";

import { useId, useState, type FormEvent } from "react";

import { PlusIcon, XIcon } from "@/ui/icons";
import { Button, Dialog, Input, fieldLabelClassName } from "@/ui/primitives";

import { type CloseTripInput } from "../../hooks";
import { formatPrice, parsePriceInput, parseQuantityInput, priceToInput } from "../../lib";
import { type Item, type TripLineInput } from "../../types";

/**
 * Uma linha em conferência. Tudo string porque tudo é editável na saída do
 * mercado: a balança deu 1,730 e não 1,5, e o arroz estava mais caro.
 */
type LineDraft = {
  key: string;
  /** Nulo é avulso — o que entrou no carrinho sem estar na lista. */
  itemId: string | null;
  name: string;
  quantity: string;
  unit: string;
  price: string;
};

function toDraft(item: Item): LineDraft {
  return {
    key: item.id,
    itemId: item.id,
    name: item.name,
    quantity: String(item.quantity).replace(".", ","),
    unit: item.unit ?? "",
    // O preço de costume entra como palpite; conferir é trocar o que mudou.
    price: priceToInput(item.price),
  };
}

function lineTotal(line: LineDraft): number {
  return (parsePriceInput(line.price) ?? 0) * parseQuantityInput(line.quantity);
}

function toInput(line: LineDraft): TripLineInput {
  return {
    item_id: line.itemId,
    name: line.name.trim(),
    quantity: parseQuantityInput(line.quantity),
    unit: line.unit.trim() || null,
    unit_price: parsePriceInput(line.price),
  };
}

/** Data de hoje em `yyyy-mm-dd`, que é o formato do `input[type=date]`. */
function today(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

const CELL = "w-full rounded-[6px] bg-surface px-2 py-1.5 text-[13px] tabular-nums";

type CloseTripDialogProps = {
  /** O que está no carrinho: os itens marcados na lista. */
  cart: Item[];
  /** Lojas já usadas, para o nome não sair "Assaí" numa vez e "assai" na outra. */
  knownStores: string[];
  closing: boolean;
  onSubmit: (input: CloseTripInput) => Promise<boolean>;
  onClose: () => void;
};

export function CloseTripDialog({
  cart,
  knownStores,
  closing,
  onSubmit,
  onClose,
}: CloseTripDialogProps) {
  const [store, setStore] = useState("");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<LineDraft[]>(() => cart.map(toDraft));
  const storesId = useId();

  const total = lines.reduce((sum, line) => sum + lineTotal(line), 0);
  const named = lines.filter((line) => line.name.trim() !== "");

  function setLine(key: string, patch: Partial<LineDraft>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  function addExtra() {
    setLines((current) => [
      ...current,
      {
        key: `extra-${crypto.randomUUID()}`,
        itemId: null,
        name: "",
        quantity: "1",
        unit: "",
        price: "",
      },
    ]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Meio-dia local: à meia-noite o fuso empurraria a compra para a véspera.
    const shoppedAt = new Date(`${date}T12:00:00`).toISOString();
    const closed = await onSubmit({
      store: store.trim(),
      shoppedAt,
      note: note.trim(),
      lines: named.map(toInput),
    });

    if (closed) onClose();
  }

  return (
    <Dialog
      title="Fechar a compra"
      eyebrow="Lista de compras"
      closeLabel="Fechar sem registrar"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-2 max-[420px]:flex-col">
          <div className="min-w-0 flex-1">
            <label htmlFor={`${storesId}-store`} className={fieldLabelClassName}>
              Mercado
            </label>
            <Input
              id={`${storesId}-store`}
              autoFocus
              type="text"
              list={storesId}
              maxLength={80}
              placeholder="Onde foi a compra"
              value={store}
              onChange={(event) => setStore(event.target.value)}
            />
            <datalist id={storesId}>
              {knownStores.map((known) => (
                <option key={known} value={known} />
              ))}
            </datalist>
          </div>
          <div className="shrink-0">
            <label htmlFor={`${storesId}-date`} className={fieldLabelClassName}>
              Data
            </label>
            <Input
              id={`${storesId}-date`}
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
        </div>

        <div>
          <p className={fieldLabelClassName}>O que foi levado</p>

          {lines.length === 0 ? (
            <p className="text-ink-soft bg-surface-alt rounded-[8px] px-3 py-4 text-center text-[13px]">
              Nada no carrinho. Marque os itens na lista ou adicione um avulso.
            </p>
          ) : (
            <ul className="divide-line divide-y">
              {/* Cabeçalho só no que é ambíguo: nome se explica, os números não. */}
              <li className="text-ink-soft flex items-center gap-1.5 pb-1 text-[10.5px] font-semibold tracking-[0.06em] uppercase">
                <span className="min-w-0 flex-1">Item</span>
                <span className="w-14 shrink-0 text-center">Qtd</span>
                <span className="w-12 shrink-0 text-center max-[420px]:hidden">Un</span>
                <span className="w-20 shrink-0 text-center">Preço</span>
                <span className="w-8 shrink-0" />
              </li>

              {lines.map((line) => (
                <li key={line.key} className="flex items-center gap-1.5 py-1.5">
                  {line.itemId === null ? (
                    <input
                      type="text"
                      aria-label="Nome do avulso"
                      placeholder="Item avulso"
                      className={`${CELL} shadow-control min-w-0 flex-1 text-left`}
                      value={line.name}
                      onChange={(event) => setLine(line.key, { name: event.target.value })}
                    />
                  ) : (
                    <span className="min-w-0 flex-1 truncate text-[13px]">{line.name}</span>
                  )}

                  <input
                    type="text"
                    inputMode="decimal"
                    aria-label={`Quantidade de ${line.name || "avulso"}`}
                    className={`${CELL} shadow-control w-14 shrink-0 text-center`}
                    value={line.quantity}
                    onChange={(event) => setLine(line.key, { quantity: event.target.value })}
                  />
                  <input
                    type="text"
                    maxLength={8}
                    aria-label={`Unidade de ${line.name || "avulso"}`}
                    placeholder="un"
                    className={`${CELL} shadow-control w-12 shrink-0 text-center max-[420px]:hidden`}
                    value={line.unit}
                    onChange={(event) => setLine(line.key, { unit: event.target.value })}
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    aria-label={`Preço de ${line.name || "avulso"}`}
                    placeholder="0,00"
                    className={`${CELL} shadow-control w-20 shrink-0 text-right`}
                    value={line.price}
                    onChange={(event) => setLine(line.key, { price: event.target.value })}
                  />

                  <button
                    type="button"
                    aria-label={`Tirar ${line.name || "avulso"} da compra`}
                    onClick={() =>
                      setLines((current) => current.filter((other) => other.key !== line.key))
                    }
                    className="text-ink-soft hover:text-danger focus-visible:shadow-control-focus inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[6px] transition-colors duration-100 focus-visible:outline-none"
                  >
                    <XIcon className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={addExtra}
            className="text-jade hover:bg-surface-alt focus-visible:shadow-control-focus mt-1.5 inline-flex cursor-pointer items-center gap-1.5 rounded-[6px] px-2 py-1.5 text-[13px] font-medium transition-colors duration-100 focus-visible:outline-none"
          >
            <PlusIcon className="size-3.5" />
            Comprei algo fora da lista
          </button>
        </div>

        <Input
          type="text"
          aria-label="Observação"
          maxLength={200}
          placeholder="Observação (opcional)"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />

        <div className="bg-surface-alt flex items-baseline justify-between gap-3 rounded-[8px] px-3 py-2.5">
          <span className="text-ink-soft text-[12px] font-semibold tracking-[0.06em] uppercase">
            Total da compra
          </span>
          <strong className="text-jade text-xl font-semibold tabular-nums">
            {formatPrice(total)}
          </strong>
        </div>

        <p className="text-ink-soft text-[12px]">
          Cada linha com preço vira uma observação no histórico do item, com o mercado e a data. Ao
          registrar, a lista volta ao início para a próxima ida.
        </p>

        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={closing || named.length === 0} className="flex-1">
            {closing ? "Registrando..." : "Registrar compra"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
