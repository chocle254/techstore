import localFont from "next/font/local";
import { Reveal } from "@/components/shop/client-bits";

// Literata (SIL Open Font License), variable weight 400–600, Latin subset. Kept in the repo so builds never depend on a font download.
const literata = localFont({
  src: "../../fonts/literata-latin.woff2",
  weight: "400 600",
  style: "normal",
  variable: "--font-literata",
  display: "swap",
});

export default function ShopLayout({ children }: LayoutProps<"/">) {
  return (
    <div className={`shop ${literata.variable} flex min-h-dvh flex-col`}>
      {children}
      <Reveal />
    </div>
  );
}
