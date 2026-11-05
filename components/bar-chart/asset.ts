/**
 * An imported image's URL. Vite hands an import over as a URL string; Next.js as
 * `{ src, width, height }`. Accepting both keeps the chart portable between the two.
 */
export const assetUrl = (asset: string | { src: string }) =>
  typeof asset === "string" ? asset : asset.src;
