const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatPrice(value: number | null): string {
  if (value === null) return "—";
  return currencyFormatter.format(value);
}

/** Aceita "1.499,90" e "1499.90"; devolve null quando o campo fica em branco. */
export function parsePriceInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number.parseFloat(trimmed.replace(/\./g, "").replace(",", "."));
  return Number.isNaN(value) ? null : value;
}

/** Converte um preço do banco para o formato que o input de edição mostra. */
export function priceToInput(value: number | null): string {
  if (value === null) return "";
  return String(value).replace(".", ",");
}

/** Busca sem acento e sem caixa: "aca" encontra "Ação". */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
