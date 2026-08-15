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
      className="text-ink-soft hover:text-ink focus-visible:outline-accent cursor-pointer rounded-sm text-[13px] underline-offset-2 transition-colors duration-100 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      Sair
    </button>
  );
}
