"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import { Button } from "./button";
import { Dialog } from "./dialog";
import { Input } from "./input";

type NameDialogProps = {
  title: string;
  eyebrow?: string;
  placeholder: string;
  fieldLabel: string;
  /** Valor inicial — vazio para criar, o nome atual para renomear. */
  initialValue?: string;
  hint?: ReactNode;
  submitLabel: string;
  saving: boolean;
  onSubmit: (name: string) => void | Promise<void>;
  onClose: () => void;
};

/**
 * Diálogo de um campo só: criar ou renomear algo pelo nome.
 *
 * Serve listas e espaços, que tinham cada um a sua cópia do mesmo formulário.
 */
export function NameDialog({
  title,
  eyebrow,
  placeholder,
  fieldLabel,
  initialValue = "",
  hint,
  submitLabel,
  saving,
  onSubmit,
  onClose,
}: NameDialogProps) {
  const [name, setName] = useState(initialValue);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(name);
  }

  return (
    <Dialog title={title} eyebrow={eyebrow} closeLabel="Fechar" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          autoFocus
          type="text"
          maxLength={80}
          placeholder={placeholder}
          aria-label={fieldLabel}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        {hint ? <p className="text-ink-soft text-[12px]">{hint}</p> : null}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || !name.trim()} className="flex-1">
            {saving ? "Salvando..." : submitLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
