import type { Metadata, Viewport } from "next";
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
  themeColor: "#0b8a6b",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
