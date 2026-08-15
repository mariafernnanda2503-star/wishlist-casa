"use client";

import { useCallback, useMemo, useState } from "react";

import { feedback } from "@/shared/lib/feedback";
import { createClient } from "@/shared/lib/supabase/client";

/** Criar e renomear workspaces — cada um é uma "casa" com seus participantes. */
export function useWorkspaces() {
  const supabase = useMemo(() => createClient(), []);
  const [saving, setSaving] = useState(false);

  /**
   * Devolve a primeira lista do workspace novo, não o workspace: é para lá que
   * a navegação vai. Dois triggers cuidam do resto — um inscreve quem criou
   * como dono, outro cria a lista inicial.
   */
  const createWorkspace = useCallback(
    async (rawName: string) => {
      const name = rawName.trim();
      if (!name || saving) return null;

      setSaving(true);
      const { data: workspace, error } = await supabase
        .from("workspaces")
        .insert({ name })
        .select("id")
        .single();

      if (error || !workspace) {
        setSaving(false);
        feedback.error("Não consegui criar o espaço.", { event: "workspace.create_failed", error });
        return null;
      }

      const { data: list, error: listError } = await supabase
        .from("lists")
        .select("id")
        .eq("workspace_id", workspace.id)
        .order("created_at")
        .limit(1)
        .maybeSingle();
      setSaving(false);

      if (listError || !list) {
        feedback.error("Espaço criado, mas não achei a lista inicial. Recarregue a página.", {
          event: "workspace.default_list_missing",
          error: listError,
          context: { workspaceId: workspace.id },
        });
        return null;
      }

      feedback.success("Espaço criado.", {
        event: "workspace.create_succeeded",
        context: { workspaceId: workspace.id },
      });
      return list.id;
    },
    [supabase, saving],
  );

  const renameWorkspace = useCallback(
    async (workspaceId: string, rawName: string) => {
      const name = rawName.trim();
      if (!name || saving) return false;

      setSaving(true);
      const { error } = await supabase.from("workspaces").update({ name }).eq("id", workspaceId);
      setSaving(false);

      if (error) {
        feedback.error("Não consegui renomear o espaço.", {
          event: "workspace.rename_failed",
          error,
          context: { workspaceId },
        });
        return false;
      }

      feedback.success("Espaço renomeado.", { event: "workspace.rename_succeeded" });
      return true;
    },
    [supabase, saving],
  );

  return { createWorkspace, renameWorkspace, saving };
}
