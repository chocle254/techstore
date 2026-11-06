// Shared by server and browser code: the soft tile colour behind each product, and a bottle drawn to fill a card.
import { Bottle, liquidFor, scaleOf } from "./bottle";

const TILES: Record<string, string> = {
  "liquid-soap": "linear-gradient(160deg, #e3f6e6, #c6ecce)",
  bleach: "linear-gradient(160deg, #eef4fb, #d6e6f7)",
  antiseptic: "linear-gradient(160deg, #fbeee3, #f4d9c2)",
  disinfectant: "linear-gradient(160deg, #e8f0e2, #cfe0c3)",
};
export const tileFor = (slug: string) => TILES[slug] ?? "linear-gradient(160deg, #e6f1f5, #cde3ec)";

/** The name people use in Kenya, shown in brackets after ours. */
const NICKNAMES: [RegExp, string][] = [[/^bleach$/i, "Jik"]];
/** Extra words a shopper might search for, by product slug. */
export const SEARCH_ALIASES: Record<string, string> = { bleach: "jik", antiseptic: "dettol", "liquid-soap": "sabuni" };

/** "Bleach" → "Bleach (Jik)", unless the name already has brackets. */
export function nick(name: string) {
  if (name.includes("(")) return name;
  const bare = name.replace(/^JonWin\s+/, "");
  const hit = NICKNAMES.find(([re]) => re.test(bare));
  return hit ? `${name} (${hit[1]})` : name;
}
export const short = (name: string) => nick(name).replace(/^JonWin\s+/, "");

/** A bottle drawn to fill a card, whatever its real size. */
export function CardBottle({ slug, sizeMl, height }: { slug: string; sizeMl: number; height: number }) {
  return <Bottle sizeMl={sizeMl} liquid={liquidFor(slug)} fullHeight={height / scaleOf(sizeMl)} />;
}

/** The product's photo filling its (relative) box, or the drawn bottle when there's no photo yet. */
export function ProductPic({ slug, sizeMl, height, image, alt = "" }: { slug: string; sizeMl: number; height: number; image?: string | null; alt?: string }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element -- already resized on upload
    return <img src={image} alt={alt} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />;
  }
  return <CardBottle slug={slug} sizeMl={sizeMl} height={height} />;
}
