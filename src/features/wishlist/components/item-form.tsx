"use client";

import { useRef, useState, type FormEvent } from "react";

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
          className="min-w-0 flex-1"
          value={values.areaId}
          onChange={(event) => setField("areaId", event.target.value)}
        >
          <option value="">Área (opcional)</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </Select>
        <Select
          className="min-w-0 flex-1"
          value={values.categoryId}
          onChange={(event) => setField("categoryId", event.target.value)}
        >
          <option value="">Categoria (opcional)</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>

      <Select
        value={values.priority}
        onChange={(event) => setField("priority", event.target.value as ItemFormValues["priority"])}
      >
        {PRIORITIES.map((priority) => (
          <option key={priority} value={priority}>
            {PRIORITY_FORM_LABEL[priority]}
          </option>
        ))}
      </Select>

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
