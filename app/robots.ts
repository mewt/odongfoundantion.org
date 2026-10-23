import type { MetadataRoute } from "next";
import { allowIndexing, siteUrl } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  // The wildcard welcomes all crawlers, including search and AI bots.
  return { rules: { userAgent: "*", ...(allowIndexing ? { allow: "/" } : { disallow: "/" }) }, sitemap: siteUrl + "/sitemap.xml" };
}
