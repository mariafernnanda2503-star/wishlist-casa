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

const quantityFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });

/**
 * Aceita "1,5" e "1.5" — ao contrário do preço, aqui o ponto é decimal e não
 * separador de milhar: ninguém compra mil e quinhentos quilos de tomate.
 * Cai em 1 quando o campo não dá um número positivo.
 */
export function parseQuantityInput(raw: string): number {
  const value = Number.parseFloat(raw.trim().replace(",", "."));
  return Number.isFinite(value) && value > 0 ? value : 1;
}

/** "1,5 kg", "6 un", "2" — a unidade só aparece quando existe. */
export function formatQuantity(quantity: number, unit: string | null): string {
  const amount = quantityFormatter.format(quantity);
  return unit ? `${amount} ${unit}` : amount;
}

/**
 * Como a quantidade aparece ao lado do nome, na tabela e na grade.
 *
 * Vazia quando não acrescenta nada: um item sem unidade e sem repetição já se
 * lê pelo nome. Com unidade ela sempre aparece — "1 kg" e "1 un" são coisas
 * diferentes, mesmo sendo os dois um.
 */
export function quantityBadge(quantity: number, unit: string | null): string {
  if (unit) return formatQuantity(quantity, unit);
  return quantity > 1 ? `×${quantityFormatter.format(quantity)}` : "";
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
