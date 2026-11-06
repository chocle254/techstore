import { NextResponse, type NextRequest } from "next/server";

// Sets a per-request Content Security Policy with a nonce for Next.js scripts.
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const blobHost = process.env.BLOB_PUBLIC_HOST ?? "https://*.public.blob.vercel-storage.com";

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Charts and maps set inline style attributes, so styles need 'unsafe-inline'. Scripts stay strict.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' blob: data: https://*.tile.openstreetmap.org https://tile.openstreetmap.org ${blobHost}`,
    "font-src 'self'",
    "connect-src 'self' https://router.project-osrm.org",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "worker-src 'self'",
    "manifest-src 'self'",
    isDev ? "" : "upgrade-insecure-requests",
  ]
    .filter(Boolean)
    .join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Pages only. Pictures and other files (anything with an extension, and /shop/) skip this, so they come straight from the CDN.
      source: "/((?!api|_next/static|_next/image|shop/|favicon.ico|icon|manifest.webmanifest|robots.txt|.*\\.(?:webp|jpg|jpeg|png|svg|ico|gif|woff2?|txt)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
