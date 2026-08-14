"use client";

import { useRouter } from "next/navigation";

import { createClient } from "@/shared/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function onSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onSignOut}
      className="text-ink-soft cursor-pointer text-[13px] underline-offset-2 hover:underline"
    >
      Sair
    </button>
  );
}
