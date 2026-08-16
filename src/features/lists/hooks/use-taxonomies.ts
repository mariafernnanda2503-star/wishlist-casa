"use client";

import { type SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useState } from "react";

import { feedback } from "@/shared/lib/feedback";
import { type Database } from "@/shared/types/database";

import { normalizeText } from "../lib";
import { listQueries } from "../queries/list-queries";
import { type Group, type ItemType, type Wanter } from "../types";

type Client = SupabaseClient<Database>;

/**
 * Criar já existente devolve o existente em vez de duplicar: a busca é sem
 * acento e sem caixa, então "cozinha" encontra "Cozinha" e "mae" encontra "Mãe".
 */
function findByName<T extends { name: string }>(entries: T[], name: string): T | null {
  return entries.find((entry) => normalizeText(entry.name) === normalizeText(name)) ?? null;
}

function nextSortOrder(entries: { sort_order: number }[]): number {
  return entries.reduce((highest, entry) => Math.max(highest, entry.sort_order), 0) + 1;
}

/**
 * O que o espaço conhece: grupos, tipos e pessoas.
 *
 * Vivem no espaço, não na lista: "Cozinha" e "Mãe" servem a todas as listas da
 * mesma casa. São listas curtas e mudam raramente, então o realtime aqui
 * recarrega inteiro em vez de encaixar linha por linha — o custo é baixo e
 * evita duplicar a lógica de merge dos itens.
 */
export function useTaxonomies(
  initialGroups: Group[],
  initialTypes: ItemType[],
  initialWanters: Wanter[],
  workspaceId: string,
  supabase: Client,
) {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [types, setTypes] = useState<ItemType[]>(initialTypes);
  const [wanters, setWanters] = useState<Wanter[]>(initialWanters);

  const reload = useCallback(async () => {
    const [groupsRes, typesRes, wantersRes] = await Promise.all([
      listQueries.groups(supabase, workspaceId),
      listQueries.types(supabase, workspaceId),
      listQueries.wanters(supabase, workspaceId),
    ]);
    if (groupsRes.data) setGroups(groupsRes.data);
    if (typesRes.data) setTypes(typesRes.data);
    if (wantersRes.data) setWanters(wantersRes.data);
  }, [supabase, workspaceId]);

  const createGroup = useCallback(
    async (rawName: string) => {
      const name = rawName.trim();
      const existing = findByName(groups, name);
      if (existing) return existing.id;

      const { data, error } = await supabase
        .from("item_groups")
        .insert({ name, sort_order: nextSortOrder(groups), workspace_id: workspaceId })
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
      const existing = findByName(types, name);
      if (existing) return existing.id;

      const { data, error } = await supabase
        .from("item_types")
        .insert({ name, sort_order: nextSortOrder(types), workspace_id: workspaceId })
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

  /**
   * Pessoa criada aqui não tem conta: é "Mãe", "Sogro", "Afilhada". Quem
   * participa do espaço já entrou por trigger quando virou participante.
   */
  const createWanter = useCallback(
    async (rawName: string) => {
      const name = rawName.trim();
      const existing = findByName(wanters, name);
      if (existing) return existing.id;

      const { data, error } = await supabase
        .from("wanters")
        .insert({ name, sort_order: nextSortOrder(wanters), workspace_id: workspaceId })
        .select()
        .single();

      if (error) {
        feedback.error("Não consegui adicionar a pessoa.", {
          event: "list.wanter_add_failed",
          error,
        });
        return null;
      }

      setWanters((current) =>
        current.some((wanter) => wanter.id === data.id) ? current : [...current, data],
      );
      feedback.success("Pessoa adicionada.", {
        event: "list.wanter_add_succeeded",
        context: { wanterId: data.id },
      });
      return data.id;
    },
    [wanters, supabase, workspaceId],
  );

  return { groups, types, wanters, reload, createGroup, createType, createWanter };
}
