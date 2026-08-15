/**
 * Normaliza o que o Android entrega no compartilhamento.
 *
 * A Web Share Target API define `title`, `text` e `url` separados, mas na
 * prática quase nenhum app Android preenche `url`: o link vem grudado dentro
 * de `text`, às vezes junto com o nome do produto.
 */
export type SharedDraft = {
  name: string | null;
  link: string | null;
};

const URL_PATTERN = /https?:\/\/[^\s<>"']+/i;

export function parseSharedInput(params: {
  title?: string;
  text?: string;
  url?: string;
}): SharedDraft | null {
  const { title, text, url } = params;
  if (!title && !text && !url) return null;

  const fromText = text ? URL_PATTERN.exec(text)?.[0] : undefined;
  const link = url?.trim() || fromText || null;

  // Sobra do texto depois de tirar o link — costuma ser o nome do produto.
  const leftover = text && fromText ? text.replace(fromText, "").trim() : (text?.trim() ?? "");
  const name = title?.trim() || leftover || null;

  if (!link && !name) return null;
  return { name, link };
}
