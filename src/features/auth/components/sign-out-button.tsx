"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/shared/lib/supabase/client";
import { LogOutIcon } from "@/ui/icons";
import { Button } from "@/ui/primitives";

export function SignOutButton() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function onSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      onClick={onSignOut}
      disabled={signingOut}
      variant="secondary"
      className="text-danger hover:text-danger inline-flex items-center gap-2 text-[13px]"
    >
      <LogOutIcon className="size-[15px]" />
      {signingOut ? "Saindo..." : "Sair"}
    </Button>
  );
}
