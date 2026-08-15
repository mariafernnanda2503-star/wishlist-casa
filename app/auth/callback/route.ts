import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/shared/lib/supabase/server";

/**
 * Destino do link enviado por e-mail na recuperação de senha. Troca o código
 * de uso único por uma sessão e leva para a tela de definir a nova senha.
 *
 * O destino é fixo de propósito: aceitar um `?next=` da query transformaria
 * esta rota num redirecionador aberto.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/nova-senha`);
    }
  }

  return NextResponse.redirect(`${origin}/login?erro=link`);
}
