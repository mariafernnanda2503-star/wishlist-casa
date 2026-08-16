/**
 * Ler nome e preço de uma página de produto a partir da URL.
 *
 * Estava em `features/wishlist/lib`, mas nada aqui sabe o que é uma wishlist:
 * é busca de página com guarda de SSRF mais leitura de metadado estruturado.
 * Serve qualquer tela que receba um link de loja.
 */
export { fetchPublicPage, type SafeFetchFailure, type SafeFetchResult } from "./fetch-page";
export { parseProduct, type ProductPreview } from "./parse-product";
