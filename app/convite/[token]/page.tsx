import { AcceptInvite } from "@/features/wishlist/components";
import { createClient } from "@/shared/lib/supabase/server";
import { BrandLogo } from "@/ui/brand-logo";

type ConvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function ConvitePage({ params }: ConvitePageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // `peek` roda antes do login de propósito: quem recebeu o link precisa saber
  // de quem é o convite para decidir se cria conta.
  const [{ data: preview }, { data: auth }] = await Promise.all([
    supabase.rpc("peek_workspace_invite", { invite_token: token }).maybeSingle(),
    supabase.auth.getUser(),
  ]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-[380px] flex-col justify-center px-5 py-10">
      <BrandLogo priority className="mx-auto mb-7 size-20" />
      <AcceptInvite
        token={token}
        workspaceName={preview?.workspace_name ?? null}
        isValid={preview?.is_valid ?? false}
        isSignedIn={auth.user !== null}
      />
    </main>
  );
}
