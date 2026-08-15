import { type PriceCheck } from "../types";

/**
 * Linha do histórico, do mais antigo para o mais recente. Sem eixos nem
 * rótulos: o número exato está na lista logo abaixo — aqui só interessa a
 * direção. Menos de dois pontos não formam tendência, então nem desenha.
 */
export function PriceSparkline({ checks }: { checks: PriceCheck[] }) {
  if (checks.length < 2) return null;

  const points = [...checks].reverse().map((check) => check.price);
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;

  const width = 100;
  const height = 24;
  const padding = 2;

  const coords = points.map((price, index) => {
    const x = (index / (points.length - 1)) * width;
    // SVG cresce para baixo, então o preço maior fica no topo invertendo o eixo.
    const y = padding + (1 - (price - min) / span) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const last = points[points.length - 1] ?? 0;
  const first = points[0] ?? 0;
  const falling = last <= first;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={falling ? "text-accent h-6 w-full" : "text-danger h-6 w-full"}
      role="img"
      aria-label={falling ? "Preço em queda no período" : "Preço em alta no período"}
    >
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
