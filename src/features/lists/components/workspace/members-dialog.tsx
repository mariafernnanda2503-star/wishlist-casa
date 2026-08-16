"use client";

import { useState } from "react";

import { feedback } from "@/shared/lib/feedback";
import { CheckIcon, LinkIcon, TrashIcon } from "@/ui/icons";
import { Button, Dialog, Input } from "@/ui/primitives";

import { useMembers } from "../../hooks";
import { type WorkspaceContext } from "../../types";

const LABEL = "text-ink-soft block text-[11px] font-semibold tracking-[0.06em] uppercase";

type MembersDialogProps = {
  context: WorkspaceContext;
  currentUserId: string;
  onClose: () => void;
};

export function MembersDialog({ context, currentUserId, onClose }: MembersDialogProps) {
  const { members, createInvite, removeMember, busy } = useMembers(context.activeWorkspace.id);
  const [invite, setInvite] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isOwner = context.role === "owner";

  async function onCreateInvite() {
    const link = await createInvite();
    if (link) {
      setInvite(link);
      setCopied(false);
    }
  }

  async function onCopy() {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(invite);
      setCopied(true);
    } catch {
      // Área de transferência bloqueada (contexto inseguro, permissão negada):
      // o link continua visível no campo para copiar à mão.
      feedback.info("Copie o link do campo acima.", { event: "invite.copy_unavailable" });
    }
  }

  return (
    <Dialog
      title="Participantes"
      eyebrow={context.activeWorkspace.name}
      closeLabel="Fechar participantes"
      onClose={onClose}
    >
      <div className="space-y-4">
        {members === null ? (
          <p className="text-ink-soft text-sm">Carregando...</p>
        ) : (
          <ul className="divide-line divide-y">
            {members.map((member) => (
              <li key={member.userId} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {member.name}
                    {member.userId === currentUserId ? (
                      <span className="text-ink-soft font-normal"> (você)</span>
                    ) : null}
                  </p>
                  {member.email ? (
                    <p className="text-ink-soft truncate text-[12px]">{member.email}</p>
                  ) : null}
                </div>

                <span className="text-ink-soft shrink-0 text-[12px]">
                  {member.role === "owner" ? "Dono" : "Participante"}
                </span>

                {/* O dono não pode se remover: o workspace ficaria sem ninguém
                    capaz de gerenciar participantes. */}
                {isOwner && member.userId !== currentUserId ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(`Remover ${member.name} de ${context.activeWorkspace.name}?`)
                      ) {
                        void removeMember(member.userId);
                      }
                    }}
                    aria-label={`Remover ${member.name}`}
                    className="text-ink-soft hover:text-danger focus-visible:outline-accent shrink-0 cursor-pointer rounded-sm p-1 transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <TrashIcon className="size-3.5" />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {isOwner ? (
          <section className="border-line space-y-2 border-t pt-4">
            <span className={LABEL}>Convidar alguém</span>

            {invite ? (
              <>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={invite}
                    aria-label="Link do convite"
                    className="min-w-0 flex-1"
                  />
                  <Button type="button" onClick={() => void onCopy()} className="shrink-0 px-3">
                    {copied ? <CheckIcon /> : <LinkIcon />}
                  </Button>
                </div>
                <p className="text-ink-soft text-[12px]">
                  Mande esse link para quem você quer que entre. Ele vale por 14 dias e serve para
                  uma pessoa só.
                </p>
              </>
            ) : (
              <>
                <Button type="button" disabled={busy} onClick={() => void onCreateInvite()}>
                  {busy ? "Gerando..." : "Gerar link de convite"}
                </Button>
                <p className="text-ink-soft text-[12px]">
                  Quem abrir o link entra em {context.activeWorkspace.name} e passa a ver todas as
                  listas do espaço.
                </p>
              </>
            )}
          </section>
        ) : null}
      </div>
    </Dialog>
  );
}
