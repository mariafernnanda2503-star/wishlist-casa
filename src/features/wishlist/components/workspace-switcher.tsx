"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/shared/lib/cn";
import { CheckIcon, PencilIcon, PlusIcon } from "@/ui/icons";
import { MenuButton, NameDialog } from "@/ui/primitives";

import { useWorkspaces } from "../hooks";
import { type WorkspaceContext } from "../types";

type Editor = "create" | "rename" | null;

/** Cada espaço é uma "casa": participantes próprios e listas próprias. */
export function WorkspaceSwitcher({ context }: { context: WorkspaceContext }) {
  const router = useRouter();
  const { createWorkspace, renameWorkspace, saving } = useWorkspaces();
  const [editor, setEditor] = useState<Editor>(null);

  const isOwner = context.role === "owner";

  async function onSubmit(name: string) {
    if (editor === "create") {
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
    <>
      <MenuButton
        label={<span className="truncate">{context.activeWorkspace.name}</span>}
        triggerClassName="text-ink-soft hover:text-jade focus-visible:text-jade gap-1"
        chevronClassName="size-3"
        menuClassName="min-w-[220px]"
      >
        {(close) => (
          <>
            {context.workspaces.map((workspace) => {
              const ativo = workspace.id === context.activeWorkspace.id;
              return (
                <button
                  key={workspace.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    close();
                    // Sem lista no endereço: o servidor resolve a primeira do
                    // espaço, que pode ser qualquer uma.
                    if (!ativo) router.push(`/?espaco=${workspace.id}`);
                  }}
                  className={cn(
                    "popover-item inline-flex items-center gap-2",
                    ativo && "text-jade font-semibold",
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
              onClick={() => {
                close();
                setEditor("create");
              }}
              className="popover-item text-jade inline-flex items-center gap-2 font-medium"
            >
              <PlusIcon className="size-3.5" />
              Novo espaço
            </button>
            {isOwner ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  setEditor("rename");
                }}
                className="popover-item inline-flex items-center gap-2"
              >
                <PencilIcon className="size-3.5" />
                Renomear este espaço
              </button>
            ) : null}
          </>
        )}
      </MenuButton>

      {editor ? (
        <NameDialog
          title={editor === "create" ? "Novo espaço" : "Renomear espaço"}
          placeholder="Ex: Casa da praia, Família Oshan"
          fieldLabel="Nome do espaço"
          initialValue={editor === "rename" ? context.activeWorkspace.name : ""}
          hint={
            editor === "create"
              ? "Um espaço novo começa só com você e uma lista vazia. Convide gente depois pelo botão Participantes."
              : undefined
          }
          submitLabel={editor === "create" ? "Criar" : "Salvar"}
          saving={saving}
          onSubmit={onSubmit}
          onClose={() => setEditor(null)}
        />
      ) : null}
    </>
  );
}
