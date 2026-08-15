import { logger } from "@/shared/lib/logger";
import { createClient } from "@/shared/lib/supabase/server";

import { type WorkspaceContext } from "../types";

/**
 * Resolve onde a pessoa está antes de qualquer dado de item ser carregado.
 *
 * A lista ativa vem da URL para o endereço ser compartilhável e sobreviver a
 * recarga; sem parâmetro, cai na primeira lista do primeiro workspace. Um id
 * que não pertence a nenhum workspace dela é ignorado em silêncio — a RLS já
 * não devolveria a linha, e cair na lista padrão é melhor que uma tela de erro.
 */
export async function getWorkspaceContext(listId?: string): Promise<WorkspaceContext | null> {
  const supabase = await createClient();

  const [membershipsRes, listsRes] = await Promise.all([
    supabase.from("workspace_members").select("role, workspaces(*)"),
    supabase.from("lists").select("*").is("archived_at", null).order("created_at"),
  ]);

  if (membershipsRes.error || listsRes.error) {
    logger.error("workspace.context_load_failed", membershipsRes.error ?? listsRes.error);
    return null;
  }

  const memberships = membershipsRes.data.filter((entry) => entry.workspaces !== null);
  if (memberships.length === 0 || listsRes.data.length === 0) return null;

  const requested = listId ? listsRes.data.find((list) => list.id === listId) : undefined;
  const activeList = requested ?? listsRes.data[0];
  if (!activeList) return null;

  const activeMembership =
    memberships.find((entry) => entry.workspaces?.id === activeList.workspace_id) ?? memberships[0];
  if (!activeMembership?.workspaces) return null;

  return {
    workspaces: memberships.flatMap((entry) => (entry.workspaces ? [entry.workspaces] : [])),
    activeWorkspace: activeMembership.workspaces,
    // Só as listas do workspace ativo; as outras aparecem ao trocar de workspace.
    lists: listsRes.data.filter((list) => list.workspace_id === activeMembership.workspaces?.id),
    activeList,
    role: activeMembership.role === "owner" ? "owner" : "member",
  };
}
