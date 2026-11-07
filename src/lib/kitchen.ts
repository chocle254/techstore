import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";

const { chemicals, chemicalMovements, recipeItems } = schema;

export type Chemical = { id: string; name: string; unit: string; isActive: boolean; onHand: number };
export type RecipeLine = { chemicalId: string; name: string; unit: string; amount: number };

/** Every chemical with how much is left (bought, minus used by batches, plus corrections). */
export async function chemicalStock(): Promise<Chemical[]> {
  const db = await getDb();
  const rows = await db
    .select({
      id: chemicals.id,
      name: chemicals.name,
      unit: chemicals.unit,
      isActive: chemicals.isActive,
      onHand: sql<string>`coalesce(sum(${chemicalMovements.delta}), 0)`,
    })
    .from(chemicals)
    .leftJoin(chemicalMovements, eq(chemicalMovements.chemicalId, chemicals.id))
    .groupBy(chemicals.id)
    .orderBy(asc(chemicals.name));
  return rows.map((r) => ({ ...r, onHand: Number(r.onHand) }));
}

/** What one batch of each product uses, by product id. */
export async function recipes(): Promise<Map<string, RecipeLine[]>> {
  const db = await getDb();
  const rows = await db
    .select({ productId: recipeItems.productId, chemicalId: chemicals.id, name: chemicals.name, unit: chemicals.unit, amount: recipeItems.amount })
    .from(recipeItems)
    .innerJoin(chemicals, eq(chemicals.id, recipeItems.chemicalId))
    .orderBy(asc(chemicals.name));
  const map = new Map<string, RecipeLine[]>();
  for (const r of rows) {
    const list = map.get(r.productId) ?? [];
    list.push({ chemicalId: r.chemicalId, name: r.name, unit: r.unit, amount: Number(r.amount) });
    map.set(r.productId, list);
  }
  return map;
}

/** How many whole batches the chemicals on hand are enough for. null when the product has no recipe yet. */
export function batchesPossible(recipe: RecipeLine[] | undefined, stock: Chemical[]): number | null {
  if (!recipe?.length) return null;
  const left = new Map(stock.map((c) => [c.id, c.onHand]));
  return Math.max(0, Math.min(...recipe.map((r) => Math.floor((left.get(r.chemicalId) ?? 0) / r.amount + 1e-9))));
}

/** Show 1.5 as "1.5" and 2 as "2". */
export const qty = (n: number) => n.toLocaleString("en-KE", { maximumFractionDigits: 2 });
