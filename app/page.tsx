import { redirect } from "next/navigation";

import { ListPage } from "@/features/lists/components";
import { getListData, getWorkspaceContext } from "@/features/lists/queries";
import { parseShareTarget } from "@/shared/lib/share-target";
import { createClient } from "@/shared/lib/supabase/server";

type HomeProps = {
  searchParams: Promise<{
    /** Lista aberta. Fica na URL para o endereço ser compartilhável. */
    lista?: string;
    /** Espaço aberto, quando ainda não se sabe qual lista dele mostrar. */
    espaco?: string;
    /** Preenchidos pelo compartilhamento do Android (ver public/manifest.webmanifest). */
    title?: string;
    text?: string;
    url?: string;
  }>;
};

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-[920px] px-4 py-16">
      <p className="border-danger-line bg-danger-soft text-danger rounded-lg border px-3 py-2.5 text-[13px]">
        {children}
      </p>
    </main>
  );
}

export default async function Home({ searchParams }: HomeProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // O middleware já barra o anônimo; esta checagem é a defesa em profundidade
  // para o caso da rota ser atingida sem passar por ele.
  if (!user) redirect("/login");

  const params = await searchParams;
  const context = await getWorkspaceContext({
    listId: params.lista,
    workspaceId: params.espaco,
  });

  if (!context) {
    return <Aviso>Você ainda não participa de nenhuma lista. Peça um convite.</Aviso>;
  }

  const data = await getListData(context.activeList.id, context.activeWorkspace.id);

  if (!data) return <Aviso>Não consegui carregar os dados. Recarregue a página.</Aviso>;

  return (
    <ListPage
      // A chave força remontar ao trocar de lista. Sem ela, `useListData`
      // mantém o estado da lista anterior: `useState(initialData)` só usa o
      // valor inicial na primeira montagem, e a navegação é client-side.
      key={context.activeList.id}
      initialData={data}
      context={context}
      currentUserId={user.id}
      sharedDraft={parseShareTarget(params)}
    />
  );
}
