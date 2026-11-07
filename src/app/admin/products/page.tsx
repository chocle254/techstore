import { asc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hasRole, requireUser } from "@/lib/auth/guard";
import { stockLevels } from "@/lib/queries";
import { AddSizeForm, ProductForm, ProductPhotoForm, RateForm, VariantRow } from "./forms";

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  const user = await requireUser("boss", "helper");
  const canEdit = hasRole(user, "boss");
  const db = await getDb();
  const products = await db.select().from(schema.products).orderBy(asc(schema.products.name));
  const stock = await stockLevels();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Products & prices</h1>
      {canEdit ? (
        <p className="text-sm text-muted">
          Prices are in shillings. <b>Cost</b> is what one bottle costs you to make or buy, so the dashboard can work out profit.
          A size with price 0 can&apos;t be sold yet.
        </p>
      ) : (
        <p className="text-sm text-muted">Only the boss can change prices.</p>
      )}

      {products.map((p) => {
        const sizes = stock.filter((s) => s.productId === p.id);
        return (
          <section key={p.id} className={`card space-y-3 ${p.isActive ? "" : "opacity-60"}`}>
            <h2 className="text-lg font-semibold">
              {p.name} {!p.isActive && <span className="badge bg-surface text-muted">Hidden</span>}
            </h2>
            {canEdit && (
              <RateForm
                productId={p.id}
                current={(() => {
                  const half = sizes.find((s) => s.sizeMl === 500);
                  return half && half.price > 0 ? half.price : null;
                })()}
              />
            )}
            <table className="table">
              {!canEdit && (
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Price (KSh)</th>
                    <th>In stock</th>
                  </tr>
                </thead>
              )}
              <tbody>
                {sizes.map((v) => (
                  <VariantRow key={v.variantId} v={v} canEdit={canEdit} />
                ))}
              </tbody>
            </table>
            {canEdit && (
              <>
                <ProductPhotoForm
                  productId={p.id}
                  name={p.name}
                  current={p.imageUrl?.startsWith("data:") ? `/shop-img/${p.id}?v=${p.imageUrl.length}` : p.imageUrl}
                />
                <AddSizeForm productId={p.id} existing={sizes.map((s) => s.sizeMl)} />
                <details>
                  <summary className="cursor-pointer text-sm text-brand-700 underline">Edit name, description, batch size</summary>
                  <div className="mt-2">
                    <ProductForm product={p} />
                  </div>
                </details>
              </>
            )}
          </section>
        );
      })}

      {canEdit && (
        <section className="card space-y-2">
          <h2 className="font-semibold">Add a new product</h2>
          <ProductForm />
        </section>
      )}
    </div>
  );
}
