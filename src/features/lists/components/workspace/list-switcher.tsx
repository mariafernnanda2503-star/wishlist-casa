"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CartIcon, PencilIcon, PlusIcon, TrashIcon } from "@/ui/icons";
import { MenuButton, NameDialog } from "@/ui/primitives";

import { useLists } from "../../hooks";
import { type ListKind, type WorkspaceContext } from "../../types";

/** Criar carrega o tipo escolhido no menu; renomear não mexe nele. */
type Editor = { mode: "create"; kind: ListKind } | { mode: "rename" } | null;

const CREATE_COPY: Record<ListKind, { title: string; placeholder: string }> = {
  wishlist: { title: "Nova lista de desejos", placeholder: "Ex: Presentes de Natal" },
  shopping: { title: "Nova lista de compras", placeholder: "Ex: Mercado da semana" },
};

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
    if (editor?.mode === "create") {
      const id = await createList(name, editor.kind);
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
        label={
          <h1 className="text-ink inline-flex min-w-0 items-center gap-1.5 font-semibold">
            {context.activeList.kind === "shopping" ? (
              <CartIcon className="text-ink-soft size-3.5" />
            ) : null}
            <span className="truncate">{context.activeList.name}</span>
          </h1>
        }
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
                className="popover-item inline-flex items-center gap-2"
              >
                {/* O carrinho marca a lista de mercado; a de desejos fica sem
                    marca para o menu não virar uma coluna de ícones. */}
                {list.kind === "shopping" ? (
                  <CartIcon className="text-ink-soft size-3.5" />
                ) : (
                  <span aria-hidden="true" className="size-3.5" />
                )}
                <span className="truncate">{list.name}</span>
              </button>
            ))}

            {outras.length > 0 ? <hr className="border-line my-1" /> : null}

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                setEditor({ mode: "create", kind: "wishlist" });
              }}
              className="popover-item text-jade inline-flex items-center gap-2 font-medium"
            >
              <PlusIcon className="size-3.5" />
              Nova lista de desejos
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                setEditor({ mode: "create", kind: "shopping" });
              }}
              className="popover-item text-jade inline-flex items-center gap-2 font-medium"
            >
              <CartIcon className="size-3.5" />
              Nova lista de compras
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                setEditor({ mode: "rename" });
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
          title={editor.mode === "create" ? CREATE_COPY[editor.kind].title : "Renomear lista"}
          eyebrow={context.activeWorkspace.name}
          placeholder={
            editor.mode === "create" ? CREATE_COPY[editor.kind].placeholder : "Nome da lista"
          }
          fieldLabel="Nome da lista"
          initialValue={editor.mode === "rename" ? context.activeList.name : ""}
          hint={
            editor.mode === "create" && editor.kind === "shopping"
              ? "Na lista de compras, fechar a ida ao mercado guarda o total e reinicia a lista para a próxima vez."
              : undefined
          }
          submitLabel={editor.mode === "create" ? "Criar" : "Salvar"}
          saving={saving}
          onSubmit={onSubmit}
          onClose={() => setEditor(null)}
        />
      ) : null}
    </>
  );
}
