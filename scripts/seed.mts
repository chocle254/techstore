// Adds the starting products and sizes. Safe to run more than once.
import { scriptDb } from "./db.mts";
import { products, variants } from "../src/db/schema.ts";

const PRODUCTS = [
  { name: "JonWin Liquid Soap", slug: "liquid-soap", description: "Thick multipurpose liquid soap for dishes, laundry and cleaning." },
  { name: "JonWin Bleach", slug: "bleach", description: "Strong bleach for whitening and disinfecting." },
  { name: "JonWin Antiseptic", slug: "antiseptic", description: "Antiseptic liquid for first aid, bathing and household hygiene." },
  { name: "JonWin Disinfectant", slug: "disinfectant", description: "Pine disinfectant for floors, toilets and drains." },
];
const SIZES_ML = [500, 1000, 2000, 5000, 10000, 20000];

const { db, close } = await scriptDb();
for (const p of PRODUCTS) {
  const [row] = await db
    .insert(products)
    .values(p)
    .onConflictDoUpdate({ target: products.slug, set: { name: p.name } })
    .returning({ id: products.id });
  for (const sizeMl of SIZES_ML) {
    // Price 0 means "not set yet": the boss sets real prices in Admin → Products.
    await db.insert(variants).values({ productId: row.id, sizeMl, price: 0, cost: 0 }).onConflictDoNothing();
  }
}
await close();
console.log(`Seeded ${PRODUCTS.length} products × ${SIZES_ML.length} sizes. Set prices in Admin → Products.`);
