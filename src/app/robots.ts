import type { MetadataRoute } from "next";

// The site is kept off search engines with "noindex" on every response (see next.config.ts).
// Crawlers must be allowed to fetch public pages to see that "noindex"; a robots.txt block alone can
// still let a bare link show up in results. Private areas are blocked outright.
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: ["/admin", "/rider", "/account", "/api"] }] };
}
