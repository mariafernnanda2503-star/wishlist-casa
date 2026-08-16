import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { gotScraping } from "got-scraping";

/**
 * Busca uma página a partir de URL fornecida por quem usa o app.
 *
 * Sem as guardas abaixo isto seria um SSRF: o servidor faria requisições para
 * onde o cliente mandasse, inclusive para a rede interna da hospedagem e para
 * endpoints de metadados de nuvem (169.254.169.254), que costumam devolver
 * credenciais.
 */

const MAX_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;

/**
 * Cabeçalho de navegador não basta: a Amazon identifica automação pelo
 * *fingerprint de TLS/HTTP2* (JA3), não pelo user-agent. Medido — com os
 * mesmos cabeçalhos, o `fetch` do Node recebe 3,9 KB de página de robô e o
 * `got-scraping` recebe 1 MB da página real.
 *
 * `got-scraping` (Apify) monta a assinatura TLS e o conjunto de cabeçalhos de
 * forma coerente entre si. É a mesma escolha do `cmintey/wishlist`, o projeto
 * de wishlist self-hosted mais usado.
 *
 * Isto é uma requisição por colagem, disparada por pessoa, para uma página que
 * ela ia abrir de qualquer jeito — não é varredura. Ainda assim, os termos de
 * uso da Amazon proíbem acesso automatizado: uso intenso é motivo legítimo
 * para eles bloquearem o IP.
 */
const HEADER_GENERATOR = {
  devices: ["desktop"],
  locales: ["pt-BR", "pt"],
  operatingSystems: ["windows"],
} as const;

const PRIVATE_V4 = [
  /^0\./, // "este host"
  /^10\./, // privada
  /^127\./, // loopback
  /^169\.254\./, // link-local, inclui o metadata das nuvens
  /^172\.(1[6-9]|2\d|3[01])\./, // privada
  /^192\.168\./, // privada
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // CGNAT
];

function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) return PRIVATE_V4.some((range) => range.test(address));

  const normalized = address.toLowerCase().replace(/^\[|\]$/g, "");
  if (normalized === "::1" || normalized === "::") return true;
  // fc00::/7 (único local) e fe80::/10 (link-local)
  if (/^f[cd]/.test(normalized)) return true;
  if (/^fe[89ab]/.test(normalized)) return true;
  // IPv4 mapeado em IPv6 volta para a checagem v4.
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(normalized);
  if (mapped?.[1]) return PRIVATE_V4.some((range) => range.test(mapped[1] as string));
  return false;
}

export type SafeFetchFailure =
  | "invalid_url"
  | "blocked_host"
  | "too_many_redirects"
  // Separados de propósito: "a loja barrou" e "a página não existe" pedem
  // reações diferentes, e juntos me fizeram ler URL errada como bloqueio.
  | "not_found"
  | "blocked_by_site"
  | "unreachable"
  | "not_html";

export type SafeFetchResult =
  { ok: true; html: string; finalUrl: string } | { ok: false; reason: SafeFetchFailure };

async function assertPublicHost(url: URL): Promise<boolean> {
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  const host = url.hostname.replace(/^\[|\]$/g, "");
  // Endereço literal não passa por DNS — checa direto.
  if (isIP(host)) return !isPrivateAddress(host);

  try {
    // `all: true` porque um nome pode resolver para vários endereços e basta
    // um privado para o pedido ser perigoso.
    const records = await lookup(host, { all: true });
    if (records.length === 0) return false;
    return records.every((record) => !isPrivateAddress(record.address));
  } catch {
    return false;
  }
}

export async function fetchPublicPage(rawUrl: string): Promise<SafeFetchResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (!(await assertPublicHost(url))) return { ok: false, reason: "blocked_host" };

    let status: number;
    let headers: Record<string, string | string[] | undefined>;
    let body: string;

    try {
      const response = await gotScraping({
        url: url.toString(),
        // Redirect manual para revalidar o destino a cada salto — seguir
        // automático deixaria um host público redirecionar para 127.0.0.1.
        followRedirect: false,
        throwHttpErrors: false,
        timeout: { request: TIMEOUT_MS },
        retry: { limit: 0 },
        headerGeneratorOptions: HEADER_GENERATOR,
      });
      status = response.statusCode;
      headers = response.headers;
      body = response.body;
    } catch {
      return { ok: false, reason: "unreachable" };
    }

    if (status >= 300 && status < 400) {
      const location = headers.location;
      const target = Array.isArray(location) ? location[0] : location;
      if (!target) return { ok: false, reason: "unreachable" };
      try {
        url = new URL(target, url);
      } catch {
        return { ok: false, reason: "invalid_url" };
      }
      continue;
    }

    if (status === 404 || status === 410) return { ok: false, reason: "not_found" };
    if (status === 401 || status === 403 || status === 429) {
      return { ok: false, reason: "blocked_by_site" };
    }
    if (status < 200 || status >= 300) return { ok: false, reason: "unreachable" };

    const contentType = String(headers["content-type"] ?? "");
    if (!contentType.includes("html")) return { ok: false, reason: "not_html" };

    // O corpo já veio inteiro; o teto aqui é para o parser não varrer um
    // documento absurdo. O que limita a transferência é o timeout.
    return { ok: true, html: body.slice(0, MAX_BYTES), finalUrl: url.toString() };
  }

  return { ok: false, reason: "too_many_redirects" };
}
