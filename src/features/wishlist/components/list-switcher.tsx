"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PencilIcon, PlusIcon, TrashIcon } from "@/ui/icons";
import { MenuButton, NameDialog } from "@/ui/primitives";

import { useLists } from "../hooks";
import { type WorkspaceContext } from "../types";

type Editor = "create" | "rename" | null;

/**
 * Troca de lista pela URL, não por estado do cliente: o endereço passa a
 * identificar o que está aberto, então recarregar ou mandar o link para a
 * outra pessoa cai no mesmo lugar.
 */
export function ListSwitcher({ context }: { context: WorkspaceContext }) {
  const router = useRouter();
  const { createList, renameList, archiveList, saving } = useLists(context.activeWorkspace.id);
  const [editor, setEditor] = useState<Editor>(null);

  const outras = context.lists.filter((list) => list.id !== context.activeList.id);
  // Arquivar a única lista deixaria o espaço sem para onde apontar.
  const podeArquivar = context.lists.length > 1;

  async function onSubmit(name: string) {
    if (editor === "create") {
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
    if (await archiveList(context.activeList.id)) {
      // A lista arquivada sai do contexto; sem alvo explícito o servidor
      // resolve para a primeira que sobrou.
      router.push("/");
    }
  }

  return (
    <>
      <MenuButton
        label={<h1 className="text-ink truncate font-semibold">{context.activeList.name}</h1>}
        triggerClassName="gap-1.5 hover:text-jade focus-visible:text-jade"
        chevronClassName="text-ink-soft size-3.5"
        menuClassName="min-w-[240px]"
      >
        {(close) => (
          <>
            {outras.map((list) => (
              <button
                key={list.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
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
              onClick={() => {
                close();
                setEditor("create");
              }}
              className="popover-item text-jade inline-flex items-center gap-2 font-medium"
            >
              <PlusIcon className="size-3.5" />
              Nova lista
            </button>
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
              Renomear esta lista
            </button>
            {podeArquivar ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  void onArchive();
                }}
                className="popover-item text-danger inline-flex items-center gap-2"
              >
                <TrashIcon className="size-3.5" />
                Arquivar esta lista
              </button>
            ) : null}
          </>
        )}
      </MenuButton>

      {editor ? (
        <NameDialog
          title={editor === "create" ? "Nova lista" : "Renomear lista"}
          eyebrow={context.activeWorkspace.name}
          placeholder="Ex: Presentes de Natal"
          fieldLabel="Nome da lista"
          initialValue={editor === "rename" ? context.activeList.name : ""}
          submitLabel={editor === "create" ? "Criar" : "Salvar"}
          saving={saving}
          onSubmit={onSubmit}
          onClose={() => setEditor(null)}
        />
      ) : null}
    </>
  );
}
