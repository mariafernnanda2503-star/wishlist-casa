"use client";

import { useState } from "react";

import { LinkIcon, PencilIcon, TrashIcon } from "@/ui/icons";
import { Button, Drawer } from "@/ui/primitives";

import { formatPrice, priceToInput, PRIORITY_LABEL, PRIORITY_TAG_CLASS } from "../lib";
import { type ItemFormValues } from "../schemas";
import { type Area, type Category, type Item, type ItemDraft } from "../types";

import { ItemForm } from "./item-form";
import { Tag } from "./tag";

type ItemDetailsDrawerProps = {
  item: Item;
  areas: Area[];
  categories: Category[];
  areaName: string;
  categoryName: string;
  onClose: () => void;
  onSave: (id: string, draft: ItemDraft) => Promise<boolean>;
  onDelete: () => void;
};

const DETAIL_LABEL =
  "text-ink-soft mb-1.5 block text-[11px] font-semibold tracking-[0.06em] uppercase";

function toFormValues(item: Item): ItemFormValues {
  return {
    name: item.name,
    price: priceToInput(item.price),
    quantity: String(item.quantity),
    priority: item.priority,
    link: item.link ?? "",
    note: item.note ?? "",
    areaId: item.area_id ?? "",
    categoryId: item.category_id ?? "",
  };
}

export function ItemDetailsDrawer({
  item,
  areas,
  categories,
  areaName,
  categoryName,
  onClose,
  onSave,
  onDelete,
}: ItemDetailsDrawerProps) {
  const [editing, setEditing] = useState(false);
  const purchased = item.status === "purchased";

  async function handleSave(draft: ItemDraft) {
    const saved = await onSave(item.id, draft);
    if (saved) setEditing(false);
  }

  return (
    <Drawer
      title={editing ? "Editar item" : item.name}
      eyebrow={editing ? item.name : "Detalhes do item"}
      closeLabel="Fechar detalhes"
      onClose={onClose}
      footer={
        editing ? undefined : (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditing(true)}
              className="text-edit hover:text-edit inline-flex flex-1 items-center justify-center gap-2"
            >
              <PencilIcon />
              Editar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onDelete}
              className="text-danger hover:text-danger inline-flex flex-1 items-center justify-center gap-2"
            >
              <TrashIcon />
              Excluir
            </Button>
          </>
        )
      }
    >
      {editing ? (
        <ItemForm
          areas={areas}
          categories={categories}
          initialValues={toFormValues(item)}
          submitLabel="Salvar alterações"
          focusNameOnMount
          onCancel={() => setEditing(false)}
          onSubmit={handleSave}
        />
      ) : (
        <div className="space-y-4">
          <section className="bg-surface-alt shadow-control flex items-end justify-between gap-4 rounded-[8px] px-4 py-3.5">
            <div>
              <span className={DETAIL_LABEL}>Preço médio</span>
              <strong className="text-accent text-2xl font-semibold tabular-nums">
                {formatPrice(item.price)}
              </strong>
            </div>
            <div className="text-right">
              <span className={DETAIL_LABEL}>Quantidade</span>
              <strong className="text-lg font-semibold tabular-nums">{item.quantity}</strong>
            </div>
          </section>

          <dl className="grid grid-cols-2 gap-3">
            <div className="border-line border-b pb-3">
              <dt className={DETAIL_LABEL}>Status</dt>
              <dd>
                <Tag
                  className={
                    purchased
                      ? "bg-accent-soft text-accent"
                      : "bg-priority-media-soft text-priority-media"
                  }
                >
                  {purchased ? "Comprado" : "Pendente"}
                </Tag>
              </dd>
            </div>
            <div className="border-line border-b pb-3">
              <dt className={DETAIL_LABEL}>Prioridade</dt>
              <dd>
                <Tag className={PRIORITY_TAG_CLASS[item.priority]}>
                  {PRIORITY_LABEL[item.priority]}
                </Tag>
              </dd>
            </div>
            <div className="border-line border-b pb-3">
              <dt className={DETAIL_LABEL}>Área</dt>
              <dd>
                <Tag className="bg-accent-soft text-accent">{areaName}</Tag>
              </dd>
            </div>
            <div className="border-line border-b pb-3">
              <dt className={DETAIL_LABEL}>Categoria</dt>
              <dd>
                <Tag className="bg-category-soft text-category">{categoryName}</Tag>
              </dd>
            </div>
          </dl>

          <section>
            <h3 className={DETAIL_LABEL}>Nota</h3>
            <p className={item.note ? "text-sm leading-6" : "text-ink-soft text-sm"}>
              {item.note ?? "Nenhuma nota adicionada."}
            </p>
          </section>

          {item.link ? (
            <section>
              <h3 className={DETAIL_LABEL}>Link</h3>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-surface-alt text-accent shadow-control hover:bg-surface hover:shadow-control-hover focus-visible:shadow-control-focus inline-flex items-center gap-2 rounded-[6px] px-3 pt-2 pb-2.5 text-sm font-medium focus-visible:outline-none"
              >
                <LinkIcon />
                Abrir página do produto
              </a>
            </section>
          ) : null}
        </div>
      )}
    </Drawer>
  );
}
