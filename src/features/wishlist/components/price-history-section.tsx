"use client";

import { useRef, useState, type FormEvent, type MouseEvent } from "react";

import { cn } from "@/shared/lib/cn";
import { CheckIcon, PencilIcon, PlusIcon, SpinnerIcon, TrashIcon, XIcon } from "@/ui/icons";
import { Button, IconAction, Input } from "@/ui/primitives";

import { usePriceHistory } from "../hooks";
import { formatPrice, parsePriceInput, priceToInput } from "../lib";
import { type Item, type PriceCheck } from "../types";

import { PriceSparkline } from "./price-sparkline";
import { Tag } from "./tag";

const LABEL = "text-ink-soft block text-[10.5px] font-semibold tracking-[0.06em] uppercase";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(iso: string) {
  return dateFormatter.format(new Date(iso));
}

type PriceHistorySectionProps = {
  item: Item;
  /** Avisa o painel que a trilha ganhou um evento de preço novo. */
  onRegistered: () => void;
};

export function PriceHistorySection({ item, onRegistered }: PriceHistorySectionProps) {
  const { checks, summary, addCheck, updateCheck, removeCheck } = usePriceHistory(
    item.id,
    item.price_target,
  );
  const priceInputRef = useRef<HTMLInputElement>(null);
  const [price, setPrice] = useState("");
  const [store, setStore] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editStore, setEditStore] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const activeId = selectedId ?? checks?.[0]?.id ?? null;
  const previous = checks?.[1] ?? null;
  const variation = summary.latest && previous ? summary.latest.price - previous.price : null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = parsePriceInput(price);
    if (parsed === null) {
      setFormError("Informe um preço válido.");
      priceInputRef.current?.focus();
      return;
    }

    setSaving(true);
    setFormError(null);
    const added = await addCheck(parsed, store.trim() || null);
    setSaving(false);

    if (added) {
      setPrice("");
      setStore("");
      setSelectedId(null);
      onRegistered();
      priceInputRef.current?.focus();
    }
  }

  function beginEdit(check: PriceCheck, event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setPendingDeleteId(null);
    setEditingId(check.id);
    setEditPrice(priceToInput(check.price));
    setEditStore(check.store ?? "");
    setEditError(null);
  }

  function cancelEdit(event?: MouseEvent<HTMLButtonElement>) {
    event?.stopPropagation();
    setEditingId(null);
    setEditError(null);
  }

  async function saveEdit(check: PriceCheck, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();

    const parsed = parsePriceInput(editPrice);
    if (parsed === null) {
      setEditError("Informe um preço válido.");
      return;
    }

    setWorkingId(check.id);
    const updated = await updateCheck(check, parsed, editStore.trim() || null);
    setWorkingId(null);

    if (updated) cancelEdit();
  }

  async function confirmRemove(check: PriceCheck, event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setWorkingId(check.id);
    const removed = await removeCheck(check.id);
    setWorkingId(null);

    if (removed) {
      setPendingDeleteId(null);
      if (activeId === check.id) setSelectedId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className={LABEL}>Histórico de preços</h3>
          <p className="text-ink-soft mt-1 text-[12px]">
            {checks === null
              ? "Carregando registros..."
              : `${checks.length} ${checks.length === 1 ? "registro" : "registros"}`}
          </p>
        </div>
        {summary.belowTarget === true ? (
          <Tag className="bg-success-soft text-success">Abaixo do alvo</Tag>
        ) : summary.belowTarget === false ? (
          <Tag className="bg-priority-media-soft text-priority-media">Acima do alvo</Tag>
        ) : null}
      </div>

      <dl className="bg-line shadow-control grid grid-cols-3 gap-px overflow-hidden rounded-[8px]">
        <div className="bg-surface-alt min-w-0 px-3 py-3 sm:px-4">
          <dt className={LABEL}>Mais recente</dt>
          <dd className="mt-1 truncate text-[13px] font-semibold tabular-nums sm:text-sm">
            {summary.latest ? formatPrice(summary.latest.price) : "—"}
          </dd>
          {variation !== null ? (
            <p
              className={cn(
                "mt-0.5 truncate text-[10.5px] font-medium tabular-nums",
                variation <= 0 ? "text-success" : "text-danger",
              )}
            >
              {variation === 0
                ? "Sem alteração"
                : `${variation < 0 ? "↓" : "↑"} ${formatPrice(Math.abs(variation))}`}
            </p>
          ) : null}
        </div>
        <div className="bg-surface-alt min-w-0 px-3 py-3 sm:px-4">
          <dt className={LABEL}>Melhor visto</dt>
          <dd className="text-success mt-1 truncate text-[13px] font-semibold tabular-nums sm:text-sm">
            {summary.best ? formatPrice(summary.best.price) : "—"}
          </dd>
        </div>
        <div className="bg-surface-alt min-w-0 px-3 py-3 sm:px-4">
          <dt className={LABEL}>Preço-alvo</dt>
          <dd className="text-ink-soft mt-1 truncate text-[13px] font-semibold tabular-nums sm:text-sm">
            {formatPrice(item.price_target)}
          </dd>
        </div>
      </dl>

      {checks && checks.length >= 2 ? (
        <PriceSparkline checks={checks} selectedId={activeId} onSelect={setSelectedId} />
      ) : null}

      <section className="bg-surface-alt shadow-control rounded-[8px] p-3 sm:p-3.5">
        <div className="mb-2.5">
          <h4 className="text-sm font-semibold">Registrar preço</h4>
          <p className="text-ink-soft mt-0.5 text-[12px]">Anote uma oferta para comparar depois.</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="grid gap-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_auto]"
        >
          <label className="min-w-0">
            <span className="sr-only">Preço visto</span>
            <Input
              ref={priceInputRef}
              type="text"
              inputMode="decimal"
              placeholder="R$ 0,00"
              aria-label="Preço visto"
              aria-invalid={formError ? true : undefined}
              className="min-w-0 text-sm"
              value={price}
              onChange={(event) => {
                setPrice(event.target.value);
                setFormError(null);
              }}
            />
          </label>
          <label className="min-w-0">
            <span className="sr-only">Loja</span>
            <Input
              type="text"
              placeholder="Loja (opcional)"
              aria-label="Loja"
              className="min-w-0 text-sm"
              value={store}
              onChange={(event) => setStore(event.target.value)}
            />
          </label>
          <Button
            type="submit"
            disabled={saving}
            className="inline-flex min-w-28 items-center justify-center gap-2 max-sm:w-full"
          >
            {saving ? <SpinnerIcon className="animate-spin" /> : <PlusIcon />}
            Registrar
          </Button>
          {formError ? (
            <p className="text-danger text-[12px] sm:col-span-3" role="alert">
              {formError}
            </p>
          ) : null}
        </form>
      </section>

      <section>
        <div className="mb-2 flex items-end justify-between gap-3">
          <h4 className={LABEL}>Registros</h4>
          {checks && checks.length > 1 ? (
            <span className="text-ink-soft text-[11px]">Selecione para localizar no gráfico</span>
          ) : null}
        </div>

        {checks === null ? (
          <div className="bg-surface-alt shadow-control rounded-[8px] px-3 py-5 text-center">
            <p className="text-ink-soft text-sm">Carregando histórico...</p>
          </div>
        ) : checks.length === 0 ? (
          <div className="bg-surface-alt shadow-control rounded-[8px] px-4 py-6 text-center">
            <p className="font-medium">Nenhum preço registrado</p>
            <p className="text-ink-soft mt-1 text-[12px]">O primeiro registro vai aparecer aqui.</p>
          </div>
        ) : (
          <ul className="divide-line shadow-control divide-y overflow-hidden rounded-[8px]">
            {checks.map((check, index) => {
              const active = check.id === activeId;
              const editing = check.id === editingId;
              const confirmingDelete = check.id === pendingDeleteId;
              const working = check.id === workingId;

              return (
                <li
                  key={check.id}
                  onClick={() => setSelectedId(check.id)}
                  onPointerEnter={() => setSelectedId(check.id)}
                  className={cn(
                    "bg-surface relative cursor-pointer px-3 py-2.5 transition-colors duration-100 sm:px-3.5",
                    active
                      ? "bg-surface-alt before:bg-jade before:absolute before:inset-y-2 before:left-0 before:w-0.5"
                      : "hover:bg-surface-alt",
                  )}
                >
                  {editing ? (
                    <form
                      onSubmit={(event) => void saveEdit(check, event)}
                      className="grid items-center gap-2 sm:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)_auto]"
                    >
                      <Input
                        autoFocus
                        type="text"
                        inputMode="decimal"
                        aria-label="Editar preço"
                        aria-invalid={editError ? true : undefined}
                        className="min-w-0 py-2 text-sm"
                        value={editPrice}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => {
                          setEditPrice(event.target.value);
                          setEditError(null);
                        }}
                      />
                      <Input
                        type="text"
                        aria-label="Editar loja"
                        placeholder="Loja (opcional)"
                        className="min-w-0 py-2 text-sm"
                        value={editStore}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => setEditStore(event.target.value)}
                      />
                      <div className="flex justify-end gap-1.5">
                        <IconAction
                          type="submit"
                          disabled={working}
                          tooltip="Salvar alterações"
                          aria-label="Salvar alterações"
                          className="text-accent hover:text-accent size-8"
                        >
                          {working ? <SpinnerIcon className="animate-spin" /> : <CheckIcon />}
                        </IconAction>
                        <IconAction
                          tooltip="Cancelar edição"
                          aria-label="Cancelar edição"
                          className="size-8"
                          onClick={cancelEdit}
                        >
                          <XIcon />
                        </IconAction>
                      </div>
                      {editError ? (
                        <p className="text-danger text-[12px] sm:col-span-3" role="alert">
                          {editError}
                        </p>
                      ) : null}
                    </form>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1 sm:grid sm:grid-cols-[minmax(105px,0.55fr)_minmax(0,1fr)] sm:items-center sm:gap-3">
                        <div className="flex items-center gap-2">
                          <strong className="shrink-0 text-sm font-semibold tabular-nums">
                            {formatPrice(check.price)}
                          </strong>
                          {index === 0 ? (
                            <span className="bg-jade-soft text-jade rounded-[4px] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase">
                              Atual
                            </span>
                          ) : null}
                        </div>
                        <p className="text-ink-soft mt-0.5 truncate text-[12px] sm:mt-0">
                          {check.store ?? "Loja não informada"}
                          <span className="sm:hidden"> · {formatDate(check.checked_at)}</span>
                        </p>
                      </div>

                      <time
                        dateTime={check.checked_at}
                        className="text-ink-soft hidden shrink-0 text-[11.5px] tabular-nums sm:block"
                      >
                        {formatDate(check.checked_at)}
                      </time>

                      {confirmingDelete ? (
                        <div className="flex shrink-0 items-center gap-1.5">
                          <span className="text-danger hidden text-[11px] font-medium sm:inline">
                            Excluir?
                          </span>
                          <IconAction
                            disabled={working}
                            tooltip="Confirmar exclusão"
                            aria-label="Confirmar exclusão"
                            className="text-danger hover:text-danger size-8"
                            onClick={(event) => void confirmRemove(check, event)}
                          >
                            {working ? <SpinnerIcon className="animate-spin" /> : <CheckIcon />}
                          </IconAction>
                          <IconAction
                            disabled={working}
                            tooltip="Cancelar exclusão"
                            aria-label="Cancelar exclusão"
                            className="size-8"
                            onClick={(event) => {
                              event.stopPropagation();
                              setPendingDeleteId(null);
                            }}
                          >
                            <XIcon />
                          </IconAction>
                        </div>
                      ) : (
                        <div className="flex shrink-0 gap-1.5">
                          <IconAction
                            tooltip="Editar registro"
                            aria-label={`Editar registro de ${formatPrice(check.price)}`}
                            className="text-edit hover:text-edit size-8"
                            onClick={(event) => beginEdit(check, event)}
                          >
                            <PencilIcon />
                          </IconAction>
                          <IconAction
                            tooltip="Excluir registro"
                            aria-label={`Excluir registro de ${formatPrice(check.price)}`}
                            className="text-danger hover:text-danger size-8"
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditingId(null);
                              setPendingDeleteId(check.id);
                            }}
                          >
                            <TrashIcon />
                          </IconAction>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </section>
  );
}
