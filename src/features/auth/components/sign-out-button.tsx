"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { feedback } from "@/shared/lib/feedback";
import { createClient } from "@/shared/lib/supabase/client";
import { LogOutIcon } from "@/ui/icons";
import { Button } from "@/ui/primitives";

export function SignOutButton() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function onSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      feedback.error("Não consegui encerrar a sessão.", {
        event: "auth.sign_out_failed",
        error: signOutError,
      });
      setSigningOut(false);
      return;
    }

    feedback.success("Sessão encerrada.", { event: "auth.sign_out_succeeded" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      onClick={onSignOut}
      disabled={signingOut}
      variant="secondary"
      className="text-danger hover:text-danger inline-flex shrink-0 items-center gap-2 text-[13px] max-sm:min-h-10"
    >
      <LogOutIcon className="size-[15px]" />
      {signingOut ? "Saindo..." : "Sair"}
    </Button>
  );
}
