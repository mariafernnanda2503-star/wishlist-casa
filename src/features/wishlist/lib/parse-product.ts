/**
 * Extrai nome e preço de uma página de produto.
 *
 * A ordem é JSON-LD primeiro, Open Graph depois. O JSON-LD `schema.org/Product`
 * é o que as lojas publicam para o Google Shopping ler — é dado estruturado,
 * mantido de propósito, não raspagem de layout. Open Graph é o plano B, e o
 * `<title>` o último recurso.
 */

export type ProductPreview = {
  name: string | null;
  price: number | null;
};

function decodeEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

/** Aceita "1499.90", "1.499,90" e 1499.9 — formatos que aparecem em JSON-LD real. */
function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  // Se tem vírgula e ponto, o último separador é o decimal.
  const normalized =
    trimmed.includes(",") && trimmed.lastIndexOf(",") > trimmed.lastIndexOf(".")
      ? trimmed.replace(/\./g, "").replace(",", ".")
      : trimmed.replace(/,/g, "");

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

type JsonValue = { [key: string]: unknown };

function isProduct(node: JsonValue): boolean {
  const type = node["@type"];
  if (typeof type === "string") return type.toLowerCase().includes("product");
  if (Array.isArray(type)) {
    return type.some(
      (entry) => typeof entry === "string" && entry.toLowerCase().includes("product"),
    );
  }
  return false;
}

/** JSON-LD vem embrulhado de formas variadas: array, @graph, ou objeto solto. */
function flatten(value: unknown, depth = 0): JsonValue[] {
  if (depth > 4 || value === null || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap((entry) => flatten(entry, depth + 1));

  const node = value as JsonValue;
  const nested = Array.isArray(node["@graph"]) ? flatten(node["@graph"], depth + 1) : [];
  return [node, ...nested];
}

function priceFromOffers(offers: unknown): number | null {
  for (const offer of flatten(offers)) {
    const direct = toNumber(offer.price);
    if (direct !== null) return direct;

    const spec = offer.priceSpecification;
    if (spec) {
      for (const entry of flatten(spec)) {
        const value = toNumber(entry.price);
        if (value !== null) return value;
      }
    }

    const low = toNumber(offer.lowPrice);
    if (low !== null) return low;
  }
  return null;
}

function fromJsonLd(html: string): ProductPreview | null {
  const blocks = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  for (const block of blocks) {
    const raw = block[1];
    if (!raw) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.trim());
    } catch {
      // JSON-LD quebrado em uma loja não impede tentar as outras fontes.
      continue;
    }

    for (const node of flatten(parsed)) {
      if (!isProduct(node)) continue;
      const name = typeof node.name === "string" ? decodeEntities(node.name) : null;
      const price = priceFromOffers(node.offers);
      if (name || price !== null) return { name, price };
    }
  }

  return null;
}

function metaContent(html: string, keys: string[]): string | null {
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // A ordem de `property`/`name` e `content` varia entre lojas.
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']*)["']`,
        "i",
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${escaped}["']`,
        "i",
      ),
    ];
    for (const pattern of patterns) {
      const match = pattern.exec(html);
      if (match?.[1]) return decodeEntities(match[1]);
    }
  }
  return null;
}

/** Microdata (`itemprop`) — o schema.org da era pré-JSON-LD, ainda comum. */
function fromMicrodata(html: string): ProductPreview {
  const attr = (prop: string) =>
    new RegExp(`<[^>]+itemprop=["']${prop}["'][^>]*content=["']([^"']+)["']`, "i").exec(
      html,
    )?.[1] ??
    new RegExp(`<[^>]+content=["']([^"']+)["'][^>]*itemprop=["']${prop}["']`, "i").exec(
      html,
    )?.[1] ??
    null;

  const raw = attr("name");
  return { name: raw ? decodeEntities(raw) : null, price: toNumber(attr("price")) };
}

function fromOpenGraph(html: string): ProductPreview {
  const name = metaContent(html, ["og:title", "twitter:title"]);
  const price = toNumber(
    metaContent(html, [
      "product:price:amount",
      "og:price:amount",
      "product:sale_price:amount",
      "twitter:data1",
    ]),
  );
  return { name, price };
}

/**
 * A Amazon não publica JSON-LD nem Open Graph nas páginas de produto — o nome
 * vive em `#productTitle` e o preço no span `a-offscreen`, que existe para
 * leitores de tela e por isso traz o valor já formatado por extenso.
 */
function fromAmazon(html: string): ProductPreview {
  const name = /id=["']productTitle["'][^>]*>([^<]{1,300})</i.exec(html)?.[1];

  // `a-offscreen` aparece em vários lugares da página; o que vale é o de
  // dentro de `a-price`. Pegar o primeiro da página trazia outro elemento.
  const rawPrice =
    /class=["'][^"']*\ba-price\b[^"']*["'][\s\S]{0,240}?class=["'][^"']*\ba-offscreen\b[^"']*["'][^>]*>([^<]{1,40})</i.exec(
      html,
    )?.[1] ??
    /id=["']attach-base-product-price["'][^>]*value=["']([^"']{1,30})["']/i.exec(html)?.[1];

  return {
    name: name ? decodeEntities(name) : null,
    price: toNumber(stripCurrency(rawPrice)),
  };
}

/** Tira símbolo de moeda, espaços e entidades, deixando só o número. */
function stripCurrency(value: string | undefined): string | null {
  if (!value) return null;
  const cleaned = decodeEntities(value)
    .replace(/ /g, " ")
    .replace(/[^\d.,]/g, "")
    .trim();
  return cleaned || null;
}

/** Último recurso. Tira o sufixo da loja: "Produto | Loja" vira "Produto". */
function fromTitle(html: string): ProductPreview {
  const raw = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1];
  if (!raw) return { name: null, price: null };

  const cleaned = decodeEntities(raw)
    .replace(/\s*[|–—-]\s*[^|–—-]{1,40}$/, "")
    .trim();
  return { name: cleaned || null, price: null };
}

// Da fonte mais confiável para a menos: dado estruturado, depois marcação
// semântica, depois específico de loja, e o título só no fim.
const EXTRACTORS = [fromJsonLd, fromMicrodata, fromOpenGraph, fromAmazon, fromTitle];

export function parseProduct(html: string): ProductPreview {
  let name: string | null = null;
  let price: number | null = null;

  for (const extract of EXTRACTORS) {
    if (name !== null && price !== null) break;
    const found = extract(html);
    name ??= found?.name ?? null;
    price ??= found?.price ?? null;
  }

  return { name, price };
}
