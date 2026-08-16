import { NextResponse, type NextRequest } from "next/server";

import { fetchPublicPage, parseProduct } from "@/shared/lib/link-preview";
import { logger } from "@/shared/lib/logger";
import { createClient } from "@/shared/lib/supabase/server";

// `node:dns` na guarda de SSRF não existe no runtime edge.
export const runtime = "nodejs";

/**
 * Lê nome e preço de uma página de produto.
 *
 * Exige sessão: sem isso qualquer um usaria o servidor de vocês como proxy
 * anônimo para buscar páginas alheias.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const target = request.nextUrl.searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "missing_url" }, { status: 400 });
  }

  const page = await fetchPublicPage(target);

  if (!page.ok) {
    logger.info("link_preview.failed", { reason: page.reason });
    // 200 de propósito: a loja não responder não é erro do app, e o
    // formulário só precisa saber que deve seguir com preenchimento manual.
    return NextResponse.json({ name: null, price: null, reason: page.reason });
  }

  const preview = parseProduct(page.html);
  logger.info("link_preview.succeeded", {
    foundName: preview.name !== null,
    foundPrice: preview.price !== null,
  });

  return NextResponse.json(preview);
}
