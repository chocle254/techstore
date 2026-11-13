import type { MetadataRoute } from "next";

// Private business app: keep crawlers out entirely.
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", disallow: "/" }] };
}
