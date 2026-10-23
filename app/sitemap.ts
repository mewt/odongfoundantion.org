import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
import { href } from "@/lib/i18n";
import { getPosts } from "@/lib/wordpress";
export const revalidate = 60;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = ["", "about", "programs", "contact", "blog"].flatMap((path) =>
    (["en", "id"] as const).map((locale) => ({
      url: siteUrl + href(locale, path),
      alternates: { languages: { en: siteUrl + href("en", path), id: siteUrl + href("id", path) } },
    }))
  );
  const posts = await getPosts();
  return pages.concat(posts.map((post) => ({ url: siteUrl + "/blog-post/" + post.slug, lastModified: post.modified })));
}
