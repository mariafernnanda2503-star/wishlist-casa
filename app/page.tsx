import { redirect } from "next/navigation";

import { WishlistPage } from "@/features/wishlist/components";
import { getWishlistData } from "@/features/wishlist/queries";
import { createClient } from "@/shared/lib/supabase/server";

export default async function Home() {
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

  return <WishlistPage initialData={data} />;
}
