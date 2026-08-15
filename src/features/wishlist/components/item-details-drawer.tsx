"use client";

import { useState } from "react";

import { ChartLineIcon, HistoryIcon, InfoIcon, LinkIcon, PencilIcon, TrashIcon } from "@/ui/icons";
import { Button, Drawer, IconAction } from "@/ui/primitives";

import { formatPrice, isAcquired, priceToInput, PRIORITY_LABEL, PRIORITY_TAG_CLASS } from "../lib";
import { type ItemFormValues } from "../schemas";
import { type Group, type ItemType, type Item, type ItemDraft, type Profile } from "../types";

import { ItemForm } from "./item-form";
import { ItemTimeline } from "./item-timeline";
import { PriceHistorySection } from "./price-history-section";
import { Tag } from "./tag";

type ItemDetailsDrawerProps = {
  item: Item;
  groups: Group[];
  types: ItemType[];
  groupName: string;
  typeName: string;
  profiles: Profile[];
  currentUserId: string;
  onClose: () => void;
  onSave: (id: string, draft: ItemDraft) => Promise<boolean>;
  onCreateGroup: (name: string) => Promise<string | null>;
  onCreateType: (name: string) => Promise<string | null>;
  onDelete: () => void;
};

const DETAIL_LABEL =
  "text-ink-soft mb-1.5 block text-[11px] font-semibold tracking-[0.06em] uppercase";

type DetailsSection = "summary" | "prices" | "history";

const SECTION_LABEL: Record<DetailsSection, string> = {
  summary: "Resumo do item",
  prices: "Preços vistos",
  history: "Histórico",
};

function toFormValues(item: Item): ItemFormValues {
  return {
    name: item.name,
    price: priceToInput(item.price),
    priceTarget: priceToInput(item.price_target),
    quantity: String(item.quantity),
    priority: item.priority,
    link: item.link ?? "",
    note: item.note ?? "",
    groupId: item.group_id ?? "",
    typeId: item.type_id ?? "",
  };
}

export function ItemDetailsDrawer({
  item,
  groups,
  types,
  groupName,
  typeName,
  profiles,
  currentUserId,
  onClose,
  onSave,
  onCreateGroup,
  onCreateType,
  onDelete,
}: ItemDetailsDrawerProps) {
  const [editing, setEditing] = useState(false);
  const [section, setSection] = useState<DetailsSection>("summary");
  const [timelineVersion, setTimelineVersion] = useState(0);
  const purchased = isAcquired(item.status);

  async function handleSave(draft: ItemDraft) {
    const saved = await onSave(item.id, draft);
    if (saved) setEditing(false);
  }

  return (
    <Drawer
      title={editing ? "Editar item" : item.name}
      eyebrow={editing ? item.name : SECTION_LABEL[section]}
      closeLabel="Fechar detalhes"
      onClose={onClose}
      navigation={
        editing ? undefined : (
          <nav
            aria-label="Seções do item"
            className="flex h-fit items-center justify-center gap-2 sm:flex-col sm:justify-start"
          >
            <IconAction
              active={section === "summary"}
              aria-label="Abrir resumo"
              aria-current={section === "summary" ? "page" : undefined}
              tooltip="Resumo"
              onClick={() => setSection("summary")}
              className="hover:-translate-x-0.5 max-sm:hover:translate-x-0 max-sm:hover:-translate-y-0.5"
            >
              <InfoIcon />
            </IconAction>
            <IconAction
              active={section === "prices"}
              aria-label="Abrir preços vistos"
              aria-current={section === "prices" ? "page" : undefined}
              tooltip="Preços vistos"
              onClick={() => setSection("prices")}
              className="hover:-translate-x-0.5 max-sm:hover:translate-x-0 max-sm:hover:-translate-y-0.5"
            >
              <ChartLineIcon />
            </IconAction>
            <IconAction
              active={section === "history"}
              aria-label="Abrir histórico"
              aria-current={section === "history" ? "page" : undefined}
              tooltip="Histórico"
              onClick={() => setSection("history")}
              className="hover:-translate-x-0.5 max-sm:hover:translate-x-0 max-sm:hover:-translate-y-0.5"
            >
              <HistoryIcon />
            </IconAction>
          </nav>
        )
      }
      footer={
        editing ? undefined : (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditing(true)}
              className="text-edit hover:text-edit inline-flex items-center justify-center gap-2 max-sm:flex-1 sm:min-w-28"
            >
              <PencilIcon />
              Editar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onDelete}
              className="text-danger hover:text-danger inline-flex items-center justify-center gap-2 max-sm:flex-1 sm:min-w-28"
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
          groups={groups}
          types={types}
          initialValues={toFormValues(item)}
          submitLabel="Salvar alterações"
          focusNameOnMount
          onCancel={() => setEditing(false)}
          onSubmit={handleSave}
          onCreateGroup={onCreateGroup}
          onCreateType={onCreateType}
        />
      ) : (
        <div>
          {section === "summary" ? (
            <div className="space-y-4 sm:space-y-5">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1.05fr)_minmax(220px,0.95fr)] sm:gap-4">
                <section className="bg-surface-alt shadow-control flex min-h-28 items-end justify-between gap-4 rounded-[8px] px-4 py-3.5 sm:min-h-full sm:flex-col sm:items-start sm:justify-between sm:px-5 sm:py-4">
                  <div>
                    <span className={DETAIL_LABEL}>Preço estimado</span>
                    <strong className="text-accent text-2xl font-semibold tabular-nums sm:text-3xl">
                      {formatPrice(item.price)}
                    </strong>
                  </div>
                  <div className="text-right sm:text-left">
                    <span className={DETAIL_LABEL}>Quantidade</span>
                    <strong className="text-lg font-semibold tabular-nums">{item.quantity}</strong>
                  </div>
                </section>

                <dl className="bg-line shadow-control grid grid-cols-2 gap-px overflow-hidden rounded-[8px]">
                  <div className="bg-surface-alt px-3 py-2.5">
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
                  <div className="bg-surface-alt px-3 py-2.5">
                    <dt className={DETAIL_LABEL}>Prioridade</dt>
                    <dd>
                      <Tag className={PRIORITY_TAG_CLASS[item.priority]}>
                        {PRIORITY_LABEL[item.priority]}
                      </Tag>
                    </dd>
                  </div>
                  <div className="bg-surface-alt col-span-2 px-3 py-2.5">
                    <dt className={DETAIL_LABEL}>Grupo</dt>
                    <dd>
                      <Tag className="bg-accent-soft text-accent">{groupName}</Tag>
                    </dd>
                  </div>
                  <div className="bg-surface-alt col-span-2 px-3 py-2.5">
                    <dt className={DETAIL_LABEL}>Tipo</dt>
                    <dd>
                      <Tag className="bg-type-soft text-type">{typeName}</Tag>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <section className="min-w-0">
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
                      className="bg-surface-alt text-accent shadow-control hover:bg-surface hover:shadow-control-hover focus-visible:shadow-control-focus inline-flex items-center justify-center gap-2 rounded-[6px] px-3 pt-2 pb-2.5 text-sm font-medium focus-visible:outline-none max-sm:w-full"
                    >
                      <LinkIcon />
                      Abrir página do produto
                    </a>
                  </section>
                ) : null}
              </div>
            </div>
          ) : null}

          {section === "prices" ? (
            <PriceHistorySection
              item={item}
              onRegistered={() => setTimelineVersion((current) => current + 1)}
            />
          ) : null}

          {section === "history" ? (
            <ItemTimeline
              itemId={item.id}
              profiles={profiles}
              currentUserId={currentUserId}
              refreshKey={timelineVersion}
            />
          ) : null}
        </div>
      )}
    </Drawer>
  );
}
