import { redirect } from "next/navigation";

import { AuthShell, NewPasswordForm } from "@/features/auth/components";
import { createClient } from "@/shared/lib/supabase/server";

export default async function NewPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Só chega aqui quem veio pelo link do e-mail — a rota do callback já trocou
  // o código por uma sessão. Sem sessão, não há o que redefinir.
  if (!user) redirect("/login?erro=link");

  return (
    <AuthShell title="Nova senha" subtitle="Escolha a senha que você vai usar a partir de agora.">
      <NewPasswordForm />
    </AuthShell>
  );
}
