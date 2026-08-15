"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import { useFloatingMenu } from "@/shared/hooks/use-floating-menu";
import { cn } from "@/shared/lib/cn";
import { ChevronDownIcon, PencilIcon, PlusIcon, TrashIcon } from "@/ui/icons";
import { Button, Dialog, Input } from "@/ui/primitives";

import { useLists } from "../hooks";
import { type WorkspaceContext } from "../types";

type Editor = { mode: "create" } | { mode: "rename" } | null;

/**
 * Troca de lista pela URL, não por estado do cliente: o endereço passa a
 * identificar o que está aberto, então recarregar ou mandar o link para a
 * outra pessoa cai no mesmo lugar.
 */
export function ListSwitcher({ context }: { context: WorkspaceContext }) {
  const router = useRouter();
  const { createList, renameList, archiveList, saving } = useLists(context.activeWorkspace.id);

  const [open, setOpen] = useState(false);
  const [editor, setEditor] = useState<Editor>(null);
  const [name, setName] = useState("");
  // `useRef` e não `useState`: um objeto `{ current }` recriado a cada render
  // faria o efeito do hook rodar sem parar — setStyle, render, objeto novo.
  const containerRef = useRef<HTMLDivElement>(null);
  const floatingStyle = useFloatingMenu({ open, anchorRef: containerRef, matchAnchorWidth: false });

  const outras = context.lists.filter((list) => list.id !== context.activeList.id);
  const podeArquivar = context.lists.length > 1;

  function abrirEditor(mode: "create" | "rename") {
    setOpen(false);
    setName(mode === "rename" ? context.activeList.name : "");
    setEditor({ mode });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;

    if (editor.mode === "create") {
      const id = await createList(name);
      if (!id) return;
      setEditor(null);
      router.push(`/?lista=${id}`);
      return;
    }

    if (await renameList(context.activeList.id, name)) {
      setEditor(null);
      router.refresh();
    }
  }

  async function onArchive() {
    if (!window.confirm(`Arquivar "${context.activeList.name}"? Os itens continuam guardados.`)) {
      return;
    }
    setOpen(false);
    if (await archiveList(context.activeList.id)) {
      // A lista arquivada sai do contexto; sem alvo explícito o servidor
      // resolve para a primeira que sobrou.
      router.push("/");
    }
  }

  return (
    <div ref={containerRef} className="relative min-w-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((atual) => !atual)}
        className="hover:text-accent focus-visible:text-accent flex min-w-0 cursor-pointer items-center gap-1.5 focus-visible:outline-none"
      >
        <h1 className="text-ink truncate font-semibold">{context.activeList.name}</h1>
        <ChevronDownIcon
          className={cn(
            "text-ink-soft size-3.5 shrink-0 transition-transform duration-100",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <>
          {/* Clique fora fecha. Um irmão invisível evita ouvinte no document. */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div role="menu" style={floatingStyle} className="popover fixed z-50 min-w-[240px]">
            {outras.map((list) => (
              <button
                key={list.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  router.push(`/?lista=${list.id}`);
                }}
                className="popover-item"
              >
                {list.name}
              </button>
            ))}

            {outras.length > 0 ? <hr className="border-line my-1" /> : null}

            <button
              type="button"
              role="menuitem"
              onClick={() => abrirEditor("create")}
              className="popover-item text-accent inline-flex items-center gap-2 font-medium"
            >
              <PlusIcon className="size-3.5" />
              Nova lista
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => abrirEditor("rename")}
              className="popover-item inline-flex items-center gap-2"
            >
              <PencilIcon className="size-3.5" />
              Renomear esta lista
            </button>
            {podeArquivar ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => void onArchive()}
                className="popover-item text-danger inline-flex items-center gap-2"
              >
                <TrashIcon className="size-3.5" />
                Arquivar esta lista
              </button>
            ) : null}
          </div>
        </>
      ) : null}

      {editor ? (
        <Dialog
          title={editor.mode === "create" ? "Nova lista" : "Renomear lista"}
          eyebrow={context.activeWorkspace.name}
          closeLabel="Fechar"
          onClose={() => setEditor(null)}
        >
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <Input
              autoFocus
              type="text"
              maxLength={80}
              placeholder="Ex: Presentes de Natal"
              aria-label="Nome da lista"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setEditor(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || !name.trim()} className="flex-1">
                {saving ? "Salvando..." : editor.mode === "create" ? "Criar" : "Salvar"}
              </Button>
            </div>
          </form>
        </Dialog>
      ) : null}
    </div>
  );
}
