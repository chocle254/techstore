import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "JonWin Clean", template: "%s · JonWin Clean" },
  description: "Liquid soap, bleach, antiseptic and disinfectant from 500ml to 20 litres. Delivered to your door.",
  // Kept off search engines on purpose; links shared on WhatsApp still show a preview.
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  openGraph: {
    type: "website",
    siteName: "JonWin Clean",
    title: "JonWin Clean",
    description: "Cleaning products from 500ml to 20 litres, delivered.",
  },
  applicationName: "JonWin Clean",
  appleWebApp: { capable: true, title: "JonWin", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0b8a6b" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1412" },
  ],
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Light, dark, or "system" to follow the phone. Set by the appearance switch.
  const saved = (await cookies()).get("theme")?.value;
  const theme = saved === "light" || saved === "dark" ? saved : "system";
  return (
    <html lang="en" className="h-full antialiased" data-theme={theme}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
