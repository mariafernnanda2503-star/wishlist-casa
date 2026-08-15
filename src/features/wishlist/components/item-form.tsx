"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";

import { Button, Input, Select } from "@/ui/primitives";

import { PRIORITIES, PRIORITY_FORM_LABEL } from "../lib";
import { itemDraftSchema, type ItemFormValues } from "../schemas";
import { type Area, type Category, type ItemDraft } from "../types";

export const EMPTY_ITEM_FORM: ItemFormValues = {
  name: "",
  price: "",
  quantity: "1",
  priority: "media",
  link: "",
  note: "",
  areaId: "",
  categoryId: "",
};

type ItemFormProps = {
  areas: Area[];
  categories: Category[];
  initialValues?: ItemFormValues;
  submitLabel: string;
  /** Só o formulário de edição passa isto — é o que faz o botão Cancelar aparecer. */
  onCancel?: () => void;
  onSubmit: (draft: ItemDraft) => void | Promise<void>;
  resetAfterSubmit?: boolean;
};

export function ItemForm({
  areas,
  categories,
  initialValues = EMPTY_ITEM_FORM,
  submitLabel,
  onCancel,
  onSubmit,
  resetAfterSubmit = false,
}: ItemFormProps) {
  const [values, setValues] = useState<ItemFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Área e categoria são opcionais: a entrada vazia é o "nenhuma" de verdade,
  // e o gatilho mostra o rótulo enquanto ela estiver escolhida.
  const areaOptions = useMemo(
    () => [
      { value: "", label: "Nenhuma" },
      ...areas.map((area) => ({ value: area.id, label: area.name })),
    ],
    [areas],
  );
  const categoryOptions = useMemo(
    () => [
      { value: "", label: "Nenhuma" },
      ...categories.map((category) => ({ value: category.id, label: category.name })),
    ],
    [categories],
  );
  const priorityOptions = useMemo(
    () => PRIORITIES.map((priority) => ({ value: priority, label: PRIORITY_FORM_LABEL[priority] })),
    [],
  );

  function setField<K extends keyof ItemFormValues>(field: K, value: ItemFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = itemDraftSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Confira os campos do formulário.");
      return;
    }

    setError(null);
    await onSubmit(parsed.data);

    if (resetAfterSubmit) {
      setValues(EMPTY_ITEM_FORM);
      nameRef.current?.focus();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {error ? <p className="text-danger text-[13px]">{error}</p> : null}

      <Input
        ref={nameRef}
        type="text"
        placeholder="Nome do produto"
        value={values.name}
        onChange={(event) => setField("name", event.target.value)}
      />

      <div className="flex gap-2">
        <Input
          type="text"
          inputMode="decimal"
          placeholder="Preço médio (ex: 149,90, opcional)"
          className="min-w-0 flex-1"
          value={values.price}
          onChange={(event) => setField("price", event.target.value)}
        />
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          placeholder="Qtd"
          className="w-20 shrink-0"
          value={values.quantity}
          onChange={(event) => setField("quantity", event.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Select
          aria-label="Área"
          placeholder="Área (opcional)"
          options={areaOptions}
          value={values.areaId}
          onChange={(value) => setField("areaId", value)}
          wrapperClassName="min-w-0 flex-1"
        />
        <Select
          aria-label="Categoria"
          placeholder="Categoria (opcional)"
          options={categoryOptions}
          value={values.categoryId}
          onChange={(value) => setField("categoryId", value)}
          wrapperClassName="min-w-0 flex-1"
        />
      </div>

      <Select
        aria-label="Prioridade"
        placeholder="Prioridade"
        options={priorityOptions}
        value={values.priority}
        onChange={(value) => setField("priority", value as ItemFormValues["priority"])}
      />

      <Input
        type="text"
        inputMode="url"
        placeholder="Link (opcional)"
        value={values.link}
        onChange={(event) => setField("link", event.target.value)}
      />
      <Input
        type="text"
        placeholder="Nota (opcional)"
        value={values.note}
        onChange={(event) => setField("note", event.target.value)}
      />

      <div className="mt-0.5 flex gap-2">
        {onCancel ? (
          <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" className="flex-1 text-[15px]">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
