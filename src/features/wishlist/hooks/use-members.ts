"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { feedback } from "@/shared/lib/feedback";
import { createClient } from "@/shared/lib/supabase/client";

export type Member = {
  userId: string;
  role: "owner" | "member";
  name: string;
  email: string | null;
};

type Client = ReturnType<typeof createClient>;

function fetchMembers(supabase: Client, workspaceId: string) {
  return supabase
    .from("workspace_members")
    .select("user_id, role, profiles(display_name, email)")
    .eq("workspace_id", workspaceId);
}

export function useMembers(workspaceId: string) {
  const supabase = useMemo(() => createClient(), []);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await fetchMembers(supabase, workspaceId);
    if (error) {
      feedback.error("Não consegui carregar os participantes.", {
        event: "members.load_failed",
        error,
      });
      return;
    }
    setMembers(
      data.map((row) => ({
        userId: row.user_id,
        role: row.role === "owner" ? "owner" : "member",
        name: row.profiles?.display_name ?? "Sem nome",
        email: row.profiles?.email ?? null,
      })),
    );
  }, [supabase, workspaceId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await fetchMembers(supabase, workspaceId);
      if (cancelled || !data) return;
      setMembers(
        data.map((row) => ({
          userId: row.user_id,
          role: row.role === "owner" ? "owner" : "member",
          name: row.profiles?.display_name ?? "Sem nome",
          email: row.profiles?.email ?? null,
        })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, workspaceId]);

  /** Devolve o link pronto para colar no WhatsApp, não só o token. */
  const createInvite = useCallback(async () => {
    if (busy) return null;
    setBusy(true);
    const { data, error } = await supabase
      .from("workspace_invites")
      .insert({ workspace_id: workspaceId })
      .select("token")
      .single();
    setBusy(false);

    if (error) {
      feedback.error("Não consegui gerar o convite.", { event: "invite.create_failed", error });
      return null;
    }

    return `${window.location.origin}/convite/${data.token}`;
  }, [supabase, workspaceId, busy]);

  const removeMember = useCallback(
    async (userId: string) => {
      if (busy) return false;
      setBusy(true);
      const { error } = await supabase
        .from("workspace_members")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId);
      setBusy(false);

      if (error) {
        feedback.error("Não consegui remover o participante.", {
          event: "members.remove_failed",
          error,
        });
        return false;
      }

      await load();
      feedback.success("Participante removido.", { event: "members.remove_succeeded" });
      return true;
    },
    [supabase, workspaceId, busy, load],
  );

  return { members, createInvite, removeMember, busy };
}
