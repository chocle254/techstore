import { getCurrentUser } from "@/lib/auth/session";
import { BottomNav, CartToast } from "@/components/shop/client-bits";
import { SHOP_ON } from "@/lib/features";

export default async function ShopLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  return (
    <div className="shop flex min-h-dvh flex-col">
      {children}
      {SHOP_ON && (
        <>
          <CartToast />
          <BottomNav signedIn={!!user} />
        </>
      )}
    </div>
  );
}
