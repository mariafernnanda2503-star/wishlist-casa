"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import { useFloatingMenu } from "@/shared/hooks/use-floating-menu";
import { cn } from "@/shared/lib/cn";
import { CheckIcon, ChevronDownIcon, PencilIcon, PlusIcon } from "@/ui/icons";
import { Button, Dialog, Input } from "@/ui/primitives";

import { useWorkspaces } from "../hooks";
import { type WorkspaceContext } from "../types";

type Editor = { mode: "create" } | { mode: "rename" } | null;

/** Cada workspace é uma "casa": participantes próprios e listas próprias. */
export function WorkspaceSwitcher({ context }: { context: WorkspaceContext }) {
  const router = useRouter();
  const { createWorkspace, renameWorkspace, saving } = useWorkspaces();

  const [open, setOpen] = useState(false);
  const [editor, setEditor] = useState<Editor>(null);
  const [name, setName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const floatingStyle = useFloatingMenu({ open, anchorRef: containerRef, matchAnchorWidth: false });

  const isOwner = context.role === "owner";

  function abrirEditor(mode: "create" | "rename") {
    setOpen(false);
    setName(mode === "rename" ? context.activeWorkspace.name : "");
    setEditor({ mode });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;

    if (editor.mode === "create") {
      const listId = await createWorkspace(name);
      if (!listId) return;
      setEditor(null);
      router.push(`/?lista=${listId}`);
      return;
    }

    if (await renameWorkspace(context.activeWorkspace.id, name)) {
      setEditor(null);
      router.refresh();
    }
  }

  return (
    <div ref={containerRef} className="relative min-w-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((atual) => !atual)}
        className="text-ink-soft hover:text-accent focus-visible:text-accent flex min-w-0 cursor-pointer items-center gap-1 focus-visible:outline-none"
      >
        <span className="truncate">{context.activeWorkspace.name}</span>
        <ChevronDownIcon
          className={cn("size-3 shrink-0 transition-transform duration-100", open && "rotate-180")}
        />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div role="menu" style={floatingStyle} className="popover fixed z-50 min-w-[220px]">
            {context.workspaces.map((workspace) => {
              const ativo = workspace.id === context.activeWorkspace.id;
              return (
                <button
                  key={workspace.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    // Sem lista no endereço: o servidor resolve a primeira do
                    // espaço, que pode ser qualquer uma.
                    if (!ativo) router.push(`/?espaco=${workspace.id}`);
                  }}
                  className={cn(
                    "popover-item inline-flex items-center gap-2",
                    ativo && "text-accent font-semibold",
                  )}
                >
                  <CheckIcon className={cn("size-3", !ativo && "opacity-0")} />
                  {workspace.name}
                </button>
              );
            })}

            <hr className="border-line my-1" />

            <button
              type="button"
              role="menuitem"
              onClick={() => abrirEditor("create")}
              className="popover-item text-accent inline-flex items-center gap-2 font-medium"
            >
              <PlusIcon className="size-3.5" />
              Novo espaço
            </button>
            {isOwner ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => abrirEditor("rename")}
                className="popover-item inline-flex items-center gap-2"
              >
                <PencilIcon className="size-3.5" />
                Renomear este espaço
              </button>
            ) : null}
          </div>
        </>
      ) : null}

      {editor ? (
        <Dialog
          title={editor.mode === "create" ? "Novo espaço" : "Renomear espaço"}
          closeLabel="Fechar"
          onClose={() => setEditor(null)}
        >
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <Input
              autoFocus
              type="text"
              maxLength={80}
              placeholder="Ex: Casa da praia, Família Oshan"
              aria-label="Nome do espaço"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            {editor.mode === "create" ? (
              <p className="text-ink-soft text-[12px]">
                Um espaço novo começa só com você e uma lista vazia. Convide gente depois pelo botão
                Participantes.
              </p>
            ) : null}
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
