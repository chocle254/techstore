import { requireUser } from "@/lib/auth/guard";
import { stockLevels } from "@/lib/queries";
import { SellScreen, type SellProduct } from "./sell-screen";

export const metadata = { title: "Sell" };

export default async function SellPage() {
  await requireUser("boss", "helper");
  const stock = (await stockLevels()).filter((s) => s.isActive);

  const products = new Map<string, SellProduct>();
  for (const s of stock) {
    const p = products.get(s.productId) ?? { id: s.productId, name: s.product, sizes: [] };
    p.sizes.push({ variantId: s.variantId, sizeMl: s.sizeMl, price: s.price, onHand: s.onHand });
    products.set(s.productId, p);
  }
  return <SellScreen products={[...products.values()]} />;
}
