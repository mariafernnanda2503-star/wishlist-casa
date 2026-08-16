/**
 * Normaliza o que o Android entrega no compartilhamento.
 *
 * A Web Share Target API define `title`, `text` e `url` separados, mas na
 * prática quase nenhum app Android preenche `url`: o link vem grudado dentro
 * de `text`, às vezes junto com o nome do produto.
 *
 * Devolve `title`/`url` e não `name`/`link` de propósito — isto é a API da
 * plataforma, não o formulário de item. Quem recebe é que traduz para os
 * campos da sua tela.
 */
export type SharedTarget = {
  title: string | null;
  url: string | null;
};

const URL_PATTERN = /https?:\/\/[^\s<>"']+/i;

export function parseShareTarget(params: {
  title?: string;
  text?: string;
  url?: string;
}): SharedTarget | null {
  const { title, text, url } = params;
  if (!title && !text && !url) return null;

  const fromText = text ? URL_PATTERN.exec(text)?.[0] : undefined;
  const link = url?.trim() || fromText || null;

  // Sobra do texto depois de tirar o link — costuma ser o nome do produto.
  const leftover = text && fromText ? text.replace(fromText, "").trim() : (text?.trim() ?? "");
  const name = title?.trim() || leftover || null;

  if (!link && !name) return null;
  return { title: name, url: link };
}
