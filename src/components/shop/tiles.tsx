// Shared by server and browser code: the soft tile colour behind each product, and a bottle drawn to fill a card.
import { Bottle, liquidFor, scaleOf } from "./bottle";

const TILES: Record<string, string> = {
  "liquid-soap": "linear-gradient(160deg, #e3f6ec, #c9ecd9)",
  bleach: "linear-gradient(160deg, #eef4fb, #d6e6f7)",
  antiseptic: "linear-gradient(160deg, #fbeee3, #f4d9c2)",
  disinfectant: "linear-gradient(160deg, #e8f0e2, #cfe0c3)",
};
export const tileFor = (slug: string) => TILES[slug] ?? "linear-gradient(160deg, #e6f1f5, #cde3ec)";
export const short = (name: string) => name.replace(/^JonWin\s+/, "");

/** A bottle drawn to fill a card, whatever its real size. */
export function CardBottle({ slug, sizeMl, height }: { slug: string; sizeMl: number; height: number }) {
  return <Bottle sizeMl={sizeMl} liquid={liquidFor(slug)} fullHeight={height / scaleOf(sizeMl)} />;
}
