import { logger } from "@/shared/lib/logger";
import { createClient } from "@/shared/lib/supabase/server";

import { type WorkspaceContext } from "../types";

/**
 * Resolve onde a pessoa está antes de qualquer dado de item ser carregado.
 *
 * Os dois parâmetros vêm da URL para o endereço identificar o que está aberto:
 * recarregar ou mandar o link cai no mesmo lugar. `lista` ganha de `espaco` —
 * apontar para uma lista já diz de qual workspace ela é.
 *
 * Id que não pertence a nenhum workspace da pessoa é ignorado em silêncio: a
 * RLS já não devolveria a linha, e cair no padrão é melhor que uma tela de erro.
 */
export async function getWorkspaceContext(params: {
  listId?: string;
  workspaceId?: string;
}): Promise<WorkspaceContext | null> {
  const supabase = await createClient();

  const [membershipsRes, listsRes, profilesRes] = await Promise.all([
    supabase.from("workspace_members").select("role, workspaces(*)"),
    supabase.from("lists").select("*").is("archived_at", null).order("created_at"),
    // Vem com o contexto e não com os itens: nome de participante é do espaço,
    // não da lista aberta. A RLS já limita a quem divide workspace.
    supabase.from("profiles").select("*"),
  ]);

  if (membershipsRes.error || listsRes.error || profilesRes.error) {
    logger.error(
      "workspace.context_load_failed",
      membershipsRes.error ?? listsRes.error ?? profilesRes.error,
    );
    return null;
  }

  const memberships = membershipsRes.data.filter((entry) => entry.workspaces !== null);
  if (memberships.length === 0) return null;

  const requestedList = params.listId
    ? listsRes.data.find((list) => list.id === params.listId)
    : undefined;

  const requestedMembership = params.workspaceId
    ? memberships.find((entry) => entry.workspaces?.id === params.workspaceId)
    : undefined;

  // Ordem: lista pedida → workspace pedido → primeiro que existir.
  const membership =
    (requestedList
      ? memberships.find((entry) => entry.workspaces?.id === requestedList.workspace_id)
      : undefined) ??
    requestedMembership ??
    memberships[0];

  const workspace = membership?.workspaces;
  if (!workspace) return null;

  const lists = listsRes.data.filter((list) => list.workspace_id === workspace.id);
  const activeList = requestedList?.workspace_id === workspace.id ? requestedList : lists[0];

  // Um trigger garante que todo workspace nasce com uma lista; chegar aqui sem
  // nenhuma significa que as listas foram arquivadas por fora do app.
  if (!activeList) {
    logger.warn("workspace.without_lists", { workspaceId: workspace.id });
    return null;
  }

  return {
    workspaces: memberships.flatMap((entry) => (entry.workspaces ? [entry.workspaces] : [])),
    activeWorkspace: workspace,
    lists,
    activeList,
    profiles: profilesRes.data,
    role: membership.role === "owner" ? "owner" : "member",
  };
}
