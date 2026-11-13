import type { NextConfig } from "next";

// The app is plain files in /public (no inline scripts), so the policy can be strict.
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  // Bar heights and product colours are set per element.
  "style-src-attr 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
];

// App files must always be checked for a newer copy; the service worker keeps them for offline use.
const noCache = [{ key: "Cache-Control", value: "no-cache" }];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // PGlite (local test database) loads its own WebAssembly files and must not be bundled.
  serverExternalPackages: ["@electric-sql/pglite"],
  async rewrites() {
    return { beforeFiles: [{ source: "/", destination: "/index.html" }], afterFiles: [], fallback: [] };
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/", headers: noCache },
      { source: "/index.html", headers: noCache },
      { source: "/sw.js", headers: [...noCache, { key: "Service-Worker-Allowed", value: "/" }] },
      { source: "/app/:path*", headers: noCache },
    ];
  },
};

export default nextConfig;
