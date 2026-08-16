"use client";

import { useState, type FormEvent } from "react";

import { cn } from "@/shared/lib/cn";
import { CheckIcon, PlusIcon, XIcon } from "@/ui/icons";
import { Input, fieldLabelClassName } from "@/ui/primitives";

import { type Wanter } from "../../types";

type WanterPickerProps = {
  wanters: Wanter[];
  value: string[];
  onChange: (wanterIds: string[]) => void;
  onCreate: (name: string) => Promise<string | null>;
};

/**
 * Quem quer o item, por marcas alternáveis em vez de lista suspensa.
 *
 * Uma família tem três ou quatro pessoas: todas cabem na tela de uma vez, e
 * marcar duas é um toque em cada. Uma lista suspensa de múltipla escolha
 * esconderia o que já está escolhido atrás de um gatilho.
 */
export function WanterPicker({ wanters, value, onChange, onCreate }: WanterPickerProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((other) => other !== id) : [...value, id]);
  }

  async function handleAdd(event: FormEvent) {
    // O seletor vive dentro do formulário do item: sem isto, dar Enter aqui
    // enviaria o item inteiro em vez de criar a pessoa.
    event.preventDefault();
    event.stopPropagation();

    const trimmed = name.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    const id = await onCreate(trimmed);
    setSaving(false);

    if (id === null) return;
    // Quem acabou de ser criada já entra marcada — foi para isso que se criou.
    if (!value.includes(id)) onChange([...value, id]);
    setName("");
    setAdding(false);
  }

  return (
    <div>
      <span className={fieldLabelClassName}>Quem quer</span>

      <div className="flex flex-wrap items-center gap-1.5">
        {wanters.map((wanter) => {
          const chosen = value.includes(wanter.id);
          return (
            <button
              key={wanter.id}
              type="button"
              aria-pressed={chosen}
              onClick={() => toggle(wanter.id)}
              className={cn(
                "shadow-control hover:shadow-control-hover focus-visible:shadow-control-focus active:shadow-control-active inline-flex cursor-pointer items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 text-[13px] transition-[background-color,color,box-shadow] duration-100 focus-visible:outline-none",
                chosen
                  ? "bg-jade-soft text-jade font-medium"
                  : "bg-surface text-ink-soft hover:text-ink",
              )}
            >
              {chosen ? <CheckIcon className="size-3" strokeWidth={3.5} /> : null}
              {wanter.name}
            </button>
          );
        })}

        {adding ? (
          <span className="inline-flex items-center gap-1.5">
            <Input
              autoFocus
              type="text"
              maxLength={40}
              aria-label="Nome da pessoa"
              placeholder="Ex: Mãe"
              className="w-32 px-2.5 py-1.5 text-[13px]"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleAdd(event);
                if (event.key === "Escape") setAdding(false);
              }}
            />
            <button
              type="button"
              disabled={saving || !name.trim()}
              onClick={(event) => void handleAdd(event)}
              aria-label="Adicionar pessoa"
              className="text-jade hover:bg-surface-alt focus-visible:shadow-control-focus inline-flex size-8 cursor-pointer items-center justify-center rounded-[6px] transition-colors duration-100 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            >
              <CheckIcon className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              aria-label="Cancelar nova pessoa"
              className="text-ink-soft hover:text-danger focus-visible:shadow-control-focus inline-flex size-8 cursor-pointer items-center justify-center rounded-[6px] transition-colors duration-100 focus-visible:outline-none"
            >
              <XIcon className="size-3.5" />
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-ink-soft hover:text-jade hover:bg-surface-alt focus-visible:shadow-control-focus inline-flex cursor-pointer items-center gap-1 rounded-[6px] px-2 py-1.5 text-[13px] transition-colors duration-100 focus-visible:outline-none"
          >
            <PlusIcon className="size-3" />
            Outra pessoa
          </button>
        )}
      </div>
    </div>
  );
}
