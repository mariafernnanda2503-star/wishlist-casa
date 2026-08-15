"use client";

import { useCallback, useMemo, useState } from "react";

import { feedback } from "@/shared/lib/feedback";
import { createClient } from "@/shared/lib/supabase/client";

/** Criar, renomear e arquivar listas de um workspace. */
export function useLists(workspaceId: string) {
  const supabase = useMemo(() => createClient(), []);
  const [saving, setSaving] = useState(false);

  const createList = useCallback(
    async (rawName: string) => {
      const name = rawName.trim();
      if (!name || saving) return null;

      setSaving(true);
      const { data, error } = await supabase
        .from("lists")
        .insert({ name, workspace_id: workspaceId })
        .select("id")
        .single();
      setSaving(false);

      if (error) {
        feedback.error("Não consegui criar a lista.", {
          event: "list.create_failed",
          error,
          context: { workspaceId },
        });
        return null;
      }

      feedback.success("Lista criada.", {
        event: "list.create_succeeded",
        context: { listId: data.id },
      });
      return data.id;
    },
    [supabase, workspaceId, saving],
  );

  const renameList = useCallback(
    async (listId: string, rawName: string) => {
      const name = rawName.trim();
      if (!name || saving) return false;

      setSaving(true);
      const { error } = await supabase.from("lists").update({ name }).eq("id", listId);
      setSaving(false);

      if (error) {
        feedback.error("Não consegui renomear a lista.", {
          event: "list.rename_failed",
          error,
          context: { listId },
        });
        return false;
      }

      feedback.success("Lista renomeada.", {
        event: "list.rename_succeeded",
        context: { listId },
      });
      return true;
    },
    [supabase, saving],
  );

  /**
   * Arquivar em vez de apagar: os itens continuam existindo e o histórico de
   * preço junto. Apagar levaria tudo pelo `on delete cascade`.
   */
  const archiveList = useCallback(
    async (listId: string) => {
      if (saving) return false;

      setSaving(true);
      const { error } = await supabase
        .from("lists")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", listId);
      setSaving(false);

      if (error) {
        feedback.error("Não consegui arquivar a lista.", {
          event: "list.archive_failed",
          error,
          context: { listId },
        });
        return false;
      }

      feedback.success("Lista arquivada.", {
        event: "list.archive_succeeded",
        context: { listId },
      });
      return true;
    },
    [supabase, saving],
  );

  return { createList, renameList, archiveList, saving };
}
