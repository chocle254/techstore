import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireUser } from "@/lib/auth/guard";
import { batchesPossible, chemicalStock, qty, recipes } from "@/lib/kitchen";
import { AddChemicalForm, EditChemicalForm, RecipeRow, StockForm } from "./forms";

export const metadata = { title: "Chemicals" };
export const dynamic = "force-dynamic";

const short = (name: string) => name.replace(/^JonWin\s+/, "");

export default async function ChemicalsPage() {
  await requireUser("boss", "helper");
  const db = await getDb();
  const [chems, recipeMap, products] = await Promise.all([
    chemicalStock(),
    recipes(),
    db.select({ id: schema.products.id, name: schema.products.name, batchSizeMl: schema.products.batchSizeMl }).from(schema.products).where(eq(schema.products.isActive, true)).orderBy(asc(schema.products.name)),
  ]);
  const inUse = chems.filter((c) => c.isActive);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Chemicals</h1>
        <p className="mt-1 text-sm text-muted">
          What&apos;s in the store, and what one batch of each product uses. When a cook saves a batch, its chemicals are taken off by themselves.
        </p>
      </div>

      <section aria-labelledby="store-title" className="card space-y-1">
        <h2 id="store-title" className="text-lg font-semibold">
          In the store
        </h2>
        <p className="text-xs text-muted">
          <b>+ Bought</b> adds what you bought. <b>Counted</b> sets the number to what&apos;s really there.
        </p>
        {chems.length === 0 && <p className="py-2 text-sm text-muted">Nothing yet. Add your first chemical below.</p>}
        <ul className="divide-y divide-line">
          {inUse.map((c) => (
            <li key={c.id} className="space-y-2 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{c.name}</span>
                <span className={`tabular-nums ${c.onHand <= 0 ? "font-semibold text-red-700" : ""}`}>
                  <b className="text-lg">{qty(c.onHand)}</b> <span className="text-sm text-muted">{c.unit}</span>
                </span>
              </div>
              <StockForm chemicalId={c.id} unit={c.unit} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="recipe-title" className="space-y-3">
        <h2 id="recipe-title" className="text-lg font-semibold">
          Recipes: what one batch uses
        </h2>
        <p className="text-sm text-muted">Type how much of each chemical goes into one batch. Leave it empty or 0 if that product doesn&apos;t use it.</p>
        {products.map((p) => {
          const recipe = recipeMap.get(p.id) ?? [];
          const amounts = new Map(recipe.map((r) => [r.chemicalId, r.amount]));
          const can = batchesPossible(recipe, chems);
          return (
            <article key={p.id} className="card">
              <header className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold">
                  {short(p.name)} <span className="text-sm font-normal text-muted">· one batch = {p.batchSizeMl / 1000} L</span>
                </h3>
                {can !== null && (
                  <span className={`text-sm ${can === 0 ? "font-semibold text-red-700" : "text-muted"}`}>
                    Store has enough for {can} batch{can === 1 ? "" : "es"}
                  </span>
                )}
              </header>
              {inUse.length === 0 ? (
                <p className="text-sm text-muted">Add chemicals first.</p>
              ) : (
                <div className="divide-y divide-line">
                  {inUse.map((c) => (
                    <RecipeRow key={c.id} productId={p.id} chemicalId={c.id} name={c.name} unit={c.unit} amount={amounts.get(c.id) ?? 0} />
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </section>

      <section aria-labelledby="add-title" className="card space-y-3">
        <h2 id="add-title" className="text-lg font-semibold">
          Add a chemical
        </h2>
        <AddChemicalForm />
      </section>

      {chems.length > 0 && (
        <details className="card">
          <summary className="cursor-pointer font-semibold">Rename or stop using a chemical</summary>
          <div className="mt-3 space-y-3">
            {chems.map((c) => (
              <EditChemicalForm key={c.id} c={c} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
