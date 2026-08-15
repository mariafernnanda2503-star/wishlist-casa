import { redirect } from "next/navigation";

import { WishlistPage } from "@/features/wishlist/components";
import { parseSharedInput } from "@/features/wishlist/lib";
import { getWishlistData } from "@/features/wishlist/queries";
import { createClient } from "@/shared/lib/supabase/server";

type HomeProps = {
  /** Preenchidos pelo compartilhamento do Android (ver public/manifest.webmanifest). */
  searchParams: Promise<{ title?: string; text?: string; url?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // O middleware já barra o anônimo; esta checagem é a defesa em profundidade
  // para o caso da rota ser atingida sem passar por ele.
  if (!user) redirect("/login");

  const data = await getWishlistData();

  if (!data) {
    return (
      <main className="mx-auto max-w-[920px] px-4 py-16">
        <p className="border-danger-line bg-danger-soft text-danger rounded-lg border px-3 py-2.5 text-[13px]">
          Não consegui carregar os dados. Recarregue a página.
        </p>
      </main>
    );
  }

  const sharedDraft = parseSharedInput(await searchParams);

  return <WishlistPage initialData={data} currentUserId={user.id} sharedDraft={sharedDraft} />;
}
