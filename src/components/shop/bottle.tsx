// Bottles drawn to true relative scale: height grows with the cube root of the volume,
// so a 20 L jerrycan stands about 3.4 times taller than a 500 ml bottle, as in real life.

export type Liquid = { body: string; cap: string; label: string };

const LIQUIDS: Record<string, Liquid> = {
  "liquid-soap": { body: "#1f8f5f", cap: "#050f16", label: "#ffffff" },
  bleach: { body: "#eef3f6", cap: "#1d5fb8", label: "#1d5fb8" },
  antiseptic: { body: "#a8521a", cap: "#050f16", label: "#ffffff" },
  disinfectant: { body: "#2d4a22", cap: "#050f16", label: "#ffffff" },
};
const DEFAULT_LIQUID: Liquid = { body: "#1f6f8f", cap: "#050f16", label: "#ffffff" };

export function liquidFor(slug: string): Liquid {
  return LIQUIDS[slug] ?? DEFAULT_LIQUID;
}

type Kind = "bottle" | "jug" | "can";
const kindFor = (ml: number): Kind => (ml <= 1000 ? "bottle" : ml <= 5000 ? "jug" : "can");

// Each shape is drawn in a box 100 units tall; WIDTH is its own width in those units.
const WIDTH: Record<Kind, number> = { bottle: 40, jug: 66, can: 74 };

function Shape({ kind, liquid, muted }: { kind: Kind; liquid: Liquid; muted?: string }) {
  const body = muted ?? liquid.body;
  const cap = muted ? muted : liquid.cap;
  const label = muted ? "transparent" : liquid.label;
  if (kind === "bottle") {
    return (
      <>
        <rect x="13" y="0" width="14" height="11" rx="2" fill={cap} />
        <path d="M14 11h12v12q10 6 10 18v55q0 4-4 4H8q-4 0-4-4V41q0-12 10-18Z" fill={body} />
        <rect x="8" y="56" width="24" height="22" fill={label} opacity={muted ? 0 : 0.92} />
      </>
    );
  }
  if (kind === "jug") {
    return (
      <>
        <rect x="16" y="0" width="16" height="10" rx="2" fill={cap} />
        <path
          d="M18 10h12v10h18q14 0 14 14v62q0 4-4 4H8q-4 0-4-4V38q0-18 14-18Zm22 18v14h12V30q0-2-2-2Z"
          fill={body}
          fillRule="evenodd"
        />
        <rect x="10" y="58" width="42" height="24" fill={label} opacity={muted ? 0 : 0.92} />
      </>
    );
  }
  return (
    <>
      <rect x="6" y="2" width="14" height="12" rx="2" fill={cap} />
      <path d="M30 2h36q6 0 6 6v8H24V8q0-6 6-6Zm6 6v4h24V8Z" fill={body} fillRule="evenodd" />
      <path d="M4 22q0-8 8-8h54q6 0 6 6v76q0 4-4 4H8q-4 0-4-4Z" fill={body} />
      <rect x="14" y="44" width="48" height="30" fill={label} opacity={muted ? 0 : 0.92} />
    </>
  );
}

/** Relative height of a container, 1 = a 20 litre jerrycan. */
export const scaleOf = (ml: number) => Math.cbrt(ml / 20000);

/**
 * One container at its true scale. `fullHeight` is the height a 20 L jerrycan would have;
 * a parent can override it per screen size with the CSS variable --jw-full.
 */
export function Bottle({
  sizeMl,
  liquid,
  fullHeight,
  muted,
  title,
}: {
  sizeMl: number;
  liquid: Liquid;
  fullHeight: number;
  muted?: string;
  title?: string;
}) {
  const kind = kindFor(sizeMl);
  const s = scaleOf(sizeMl);
  const full = `var(--jw-full, ${fullHeight}px)`;
  return (
    <svg
      viewBox={`0 0 ${WIDTH[kind]} 100`}
      style={{ height: `calc(${full} * ${s.toFixed(4)})`, width: `calc(${full} * ${((s * WIDTH[kind]) / 100).toFixed(4)})` }}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className="block shrink-0"
    >
      <Shape kind={kind} liquid={liquid} muted={muted} />
    </svg>
  );
}

/** Several containers in one drawing that scales to fill its box, bottoms on one line. */
export function BottleGroup({ sizes, liquid, title }: { sizes: number[]; liquid: Liquid; title: string }) {
  const GAP = 8;
  const sized = sizes.map((ml) => {
    const kind = kindFor(ml);
    const h = 100 * scaleOf(ml);
    return { ml, kind, h, w: (h * WIDTH[kind]) / 100 };
  });
  const items = sized.map((it, i) => ({ ...it, x: sized.slice(0, i).reduce((s, p) => s + p.w + GAP, 0) }));
  const total = sized.reduce((s, p) => s + p.w, 0) + GAP * (sized.length - 1);
  return (
    <svg viewBox={`0 0 ${total} 100`} className="block h-full w-full" preserveAspectRatio="xMidYMax meet" role="img" aria-label={title}>
      {items.map((it) => (
        <g key={it.ml} transform={`translate(${it.x} ${100 - it.h}) scale(${it.h / 100})`}>
          <Shape kind={it.kind} liquid={liquid} />
        </g>
      ))}
    </svg>
  );
}
