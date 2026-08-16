"use client";

import { type SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useState } from "react";

import { feedback } from "@/shared/lib/feedback";
import { type Database } from "@/shared/types/database";

import { normalizeText } from "../lib";
import { listQueries } from "../queries/list-queries";
import { type Group, type ItemType } from "../types";

type Client = SupabaseClient<Database>;

/**
 * Grupos e tipos do workspace.
 *
 * Vivem no espaço, não na lista: "Cozinha" serve a todas as listas da mesma
 * casa. São listas curtas e mudam raramente, então o realtime aqui recarrega
 * inteiro em vez de encaixar linha por linha — o custo é baixo e evita duplicar
 * a lógica de merge dos itens.
 */
export function useTaxonomies(
  initialGroups: Group[],
  initialTypes: ItemType[],
  workspaceId: string,
  supabase: Client,
) {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [types, setTypes] = useState<ItemType[]>(initialTypes);

  const reload = useCallback(async () => {
    const [groupsRes, typesRes] = await Promise.all([
      listQueries.groups(supabase, workspaceId),
      listQueries.types(supabase, workspaceId),
    ]);
    if (groupsRes.data) setGroups(groupsRes.data);
    if (typesRes.data) setTypes(typesRes.data);
  }, [supabase, workspaceId]);

  /**
   * Criar já existente devolve o id do existente em vez de duplicar: a busca é
   * sem acento e sem caixa, então "cozinha" encontra "Cozinha".
   */
  const createGroup = useCallback(
    async (rawName: string) => {
      const name = rawName.trim();
      const existing = groups.find((group) => normalizeText(group.name) === normalizeText(name));
      if (existing) return existing.id;

      const sortOrder =
        groups.reduce((highest, group) => Math.max(highest, group.sort_order), 0) + 1;
      const { data, error } = await supabase
        .from("item_groups")
        .insert({ name, sort_order: sortOrder, workspace_id: workspaceId })
        .select()
        .single();

      if (error) {
        feedback.error("Não consegui adicionar o grupo.", {
          event: "list.group_add_failed",
          error,
        });
        return null;
      }

      setGroups((current) =>
        current.some((group) => group.id === data.id) ? current : [...current, data],
      );
      feedback.success("Grupo adicionado.", {
        event: "list.group_add_succeeded",
        context: { groupId: data.id },
      });
      return data.id;
    },
    [groups, supabase, workspaceId],
  );

  const createType = useCallback(
    async (rawName: string) => {
      const name = rawName.trim();
      const existing = types.find((type) => normalizeText(type.name) === normalizeText(name));
      if (existing) return existing.id;

      const sortOrder = types.reduce((highest, type) => Math.max(highest, type.sort_order), 0) + 1;
      const { data, error } = await supabase
        .from("item_types")
        .insert({ name, sort_order: sortOrder, workspace_id: workspaceId })
        .select()
        .single();

      if (error) {
        feedback.error("Não consegui adicionar o tipo.", {
          event: "list.type_add_failed",
          error,
        });
        return null;
      }

      setTypes((current) =>
        current.some((type) => type.id === data.id) ? current : [...current, data],
      );
      feedback.success("Tipo adicionado.", {
        event: "list.type_add_succeeded",
        context: { typeId: data.id },
      });
      return data.id;
    },
    [types, supabase, workspaceId],
  );

  return { groups, types, reload, createGroup, createType };
}
