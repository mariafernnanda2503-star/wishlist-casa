"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";

import { feedback } from "@/shared/lib/feedback";
import { SearchIcon, SpinnerIcon } from "@/ui/icons";
import { Button, Input, Select } from "@/ui/primitives";

import { PRIORITIES, PRIORITY_FORM_LABEL, priceToInput } from "../../lib";
import { itemDraftSchema, type ItemFormValues } from "../../schemas";
import { type Group, type ItemType, type ItemDraft, type ListKind, type Wanter } from "../../types";

import { WanterPicker } from "./wanter-picker";

export const EMPTY_ITEM_FORM: ItemFormValues = {
  name: "",
  price: "",
  priceTarget: "",
  quantity: "1",
  unit: "",
  wanterIds: [],
  priority: "media",
  link: "",
  note: "",
  groupId: "",
  typeId: "",
};

type ItemFormProps = {
  groups: Group[];
  types: ItemType[];
  wanters: Wanter[];
  /**
   * O que a lista pede em cada caso. No mercado o item tem unidade e o preço é
   * o que se costuma pagar; alvo de preço e link são de quem persegue uma
   * compra específica, não de quem repõe arroz.
   */
  kind?: ListKind;
  initialValues?: ItemFormValues;
  submitLabel: string;
  /** Só o formulário de edição passa isto — é o que faz o botão Cancelar aparecer. */
  onCancel?: () => void;
  onSubmit: (draft: ItemDraft) => void | Promise<void>;
  onCreateGroup: (name: string) => Promise<string | null>;
  onCreateType: (name: string) => Promise<string | null>;
  onCreateWanter: (name: string) => Promise<string | null>;
  focusNameOnMount?: boolean;
};

export function ItemForm({
  groups,
  types,
  wanters,
  kind = "wishlist",
  initialValues = EMPTY_ITEM_FORM,
  submitLabel,
  onCancel,
  onSubmit,
  onCreateGroup,
  onCreateType,
  onCreateWanter,
  focusNameOnMount = false,
}: ItemFormProps) {
  const [values, setValues] = useState<ItemFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [fetchingLink, setFetchingLink] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const isShopping = kind === "shopping";

  // Grupo e tipo são opcionais: a entrada vazia é o "nenhuma" de verdade,
  // e o gatilho mostra o rótulo enquanto ela estiver escolhida.
  const groupOptions = useMemo(
    () => [
      { value: "", label: "Nenhuma" },
      ...groups.map((group) => ({ value: group.id, label: group.name })),
    ],
    [groups],
  );
  const typeOptions = useMemo(
    () => [
      { value: "", label: "Nenhuma" },
      ...types.map((type) => ({ value: type.id, label: type.name })),
    ],
    [types],
  );
  const priorityOptions = useMemo(
    () => PRIORITIES.map((priority) => ({ value: priority, label: PRIORITY_FORM_LABEL[priority] })),
    [],
  );

  function setField<K extends keyof ItemFormValues>(field: K, value: ItemFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function fillFromLink(rawLink: string) {
    const link = rawLink.trim();
    if (!link.startsWith("http") || fetchingLink) return;

    setFetchingLink(true);
    try {
      const response = await fetch(`/api/link-preview?url=${encodeURIComponent(link)}`);
      const preview = (await response.json()) as { name: string | null; price: number | null };

      if (preview.name === null && preview.price === null) {
        feedback.info("Não consegui ler essa página. Preencha à mão.", {
          event: "link_preview.empty",
        });
        return;
      }

      // Só completa o que está vazio: o que a pessoa digitou vale mais do que
      // o que a loja publica.
      setValues((current) => ({
        ...current,
        link,
        name: current.name.trim() || (preview.name ?? ""),
        price: current.price.trim() || (preview.price === null ? "" : priceToInput(preview.price)),
      }));
      feedback.success("Dados do link preenchidos.", { event: "link_preview.filled" });
    } catch (cause) {
      feedback.error("Não consegui buscar os dados do link.", {
        event: "link_preview.failed",
        error: cause,
      });
    } finally {
      setFetchingLink(false);
    }
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
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {error ? <p className="text-danger text-[13px]">{error}</p> : null}

      <Input
        ref={nameRef}
        autoFocus={focusNameOnMount}
        type="text"
        placeholder="Nome do produto"
        value={values.name}
        onChange={(event) => setField("name", event.target.value)}
      />

      <div className="flex gap-2">
        <Input
          type="text"
          inputMode="decimal"
          aria-label={isShopping ? "Preço de costume" : "Preço médio"}
          placeholder={
            isShopping ? "Preço de costume (opcional)" : "Preço médio (ex: 149,90, opcional)"
          }
          className="min-w-0 flex-1"
          value={values.price}
          onChange={(event) => setField("price", event.target.value)}
        />
        <Input
          type="text"
          inputMode="decimal"
          aria-label="Quantidade"
          placeholder="Qtd"
          className="w-16 shrink-0"
          value={values.quantity}
          onChange={(event) => setField("quantity", event.target.value)}
        />
        {isShopping ? (
          <Input
            type="text"
            aria-label="Unidade"
            placeholder="un"
            maxLength={8}
            className="w-16 shrink-0"
            value={values.unit}
            onChange={(event) => setField("unit", event.target.value)}
          />
        ) : null}
      </div>

      {isShopping ? null : (
        <Input
          type="text"
          inputMode="decimal"
          aria-label="Compro se estiver abaixo de"
          placeholder="Compro se estiver abaixo de... (opcional)"
          value={values.priceTarget}
          onChange={(event) => setField("priceTarget", event.target.value)}
        />
      )}

      <div className="flex gap-2 max-[420px]:flex-col">
        <Select
          aria-label="Grupo"
          placeholder="Grupo (opcional)"
          options={groupOptions}
          value={values.groupId}
          onChange={(value) => setField("groupId", value)}
          onCreateOption={onCreateGroup}
          wrapperClassName="min-w-0 flex-1"
        />
        <Select
          aria-label="Tipo"
          placeholder="Tipo (opcional)"
          options={typeOptions}
          value={values.typeId}
          onChange={(value) => setField("typeId", value)}
          onCreateOption={onCreateType}
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

      {/* No mercado o arroz não é "de alguém" — é da casa. */}
      {isShopping ? null : (
        <WanterPicker
          wanters={wanters}
          value={values.wanterIds}
          onChange={(wanterIds) => setField("wanterIds", wanterIds)}
          onCreate={onCreateWanter}
        />
      )}

      {isShopping ? null : (
        <div className="flex gap-2">
          <Input
            type="text"
            inputMode="url"
            aria-label="Link"
            placeholder="Link (opcional)"
            className="min-w-0 flex-1"
            value={values.link}
            onChange={(event) => setField("link", event.target.value)}
            // Colar é o momento em que a busca automática compensa: ninguém cola
            // um link de produto sem querer os dados dele.
            onPaste={(event) => {
              const pasted = event.clipboardData.getData("text");
              if (pasted.startsWith("http")) void fillFromLink(pasted);
            }}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={fetchingLink || !values.link.trim().startsWith("http")}
            onClick={() => void fillFromLink(values.link)}
            aria-label="Buscar dados do link"
            className="shrink-0 px-3"
          >
            {fetchingLink ? <SpinnerIcon className="animate-spin" /> : <SearchIcon />}
          </Button>
        </div>
      )}
      <Input
        type="text"
        aria-label="Nota"
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
