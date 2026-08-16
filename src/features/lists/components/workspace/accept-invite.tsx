"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { feedback } from "@/shared/lib/feedback";
import { createClient } from "@/shared/lib/supabase/client";
import { Button } from "@/ui/primitives";

type AcceptInviteProps = {
  token: string;
  workspaceName: string | null;
  isValid: boolean;
  isSignedIn: boolean;
};

export function AcceptInvite({ token, workspaceName, isValid, isSignedIn }: AcceptInviteProps) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);

  async function onAccept() {
    setAccepting(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("accept_workspace_invite", { invite_token: token });

    if (error) {
      feedback.error("Esse convite não vale mais. Peça um novo.", {
        event: "invite.accept_failed",
        error,
      });
      setAccepting(false);
      return;
    }

    // `refresh` além do `push`: o servidor precisa recarregar o contexto, que
    // acabou de ganhar um workspace.
    router.push("/");
    router.refresh();
  }

  if (workspaceName === null || !isValid) {
    return (
      <div className="text-center">
        <h1 className="mb-1 text-xl font-semibold">Convite indisponível</h1>
        <p className="text-ink-soft mb-6 text-sm">
          Esse link já foi usado ou passou da validade. Peça um novo para quem te convidou.
        </p>
        <Link href="/" className="text-accent text-sm underline-offset-2 hover:underline">
          Ir para o início
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-accent mb-1 text-[11px] font-semibold tracking-[0.08em] uppercase">
        Convite
      </p>
      <h1 className="mb-1 text-xl font-semibold">Entrar em {workspaceName}</h1>
      <p className="text-ink-soft mb-6 text-sm">
        Você vai poder ver e editar todas as listas desse espaço.
      </p>

      {isSignedIn ? (
        <Button
          type="button"
          disabled={accepting}
          onClick={() => void onAccept()}
          className="w-full text-[15px]"
        >
          {accepting ? "Entrando..." : "Aceitar convite"}
        </Button>
      ) : (
        <>
          {/* O convite fica na URL de retorno para o fluxo continuar de onde
              parou depois do login. */}
          <Link
            href={`/login?next=${encodeURIComponent(`/convite/${token}`)}`}
            className="bg-accent text-on-accent shadow-control-accent hover:bg-accent-hover block w-full rounded-lg px-3 pt-2 pb-2.5 text-[15px] font-medium"
          >
            Entrar na minha conta
          </Link>
          <p className="text-ink-soft mt-3 text-[12px]">
            Ainda não tem conta? Peça para quem te convidou criar uma para você.
          </p>
        </>
      )}
    </div>
  );
}
