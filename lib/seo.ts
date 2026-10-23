import type { Metadata } from "next";
import { site } from "@/content/site";
import { href, t, type Locale } from "./i18n";
import type { Post } from "./wordpress";

export const siteUrl = (process.env.SITE_URL || "https://odongfoundation.org").replace(/\/$/, "");
// Public by default; private staging builds can explicitly opt out.
export const allowIndexing = process.env.ALLOW_INDEXING !== "false";
export const pageKeys = ["home", "programs", "about", "contact", "blog"] as const;

export function pageMetadata(locale: Locale, page: string): Metadata {
  const title = t(locale, "meta." + page + ".title");
  const description = t(locale, "meta." + page + ".desc");
  const path = page === "home" ? "" : page;
  return {
    metadataBase: new URL(siteUrl), title, description,
    alternates: {
      canonical: href(locale, path),
      languages: { en: href("en", path), id: href("id", path), "x-default": href("en", path) },
    },
    robots: { index: allowIndexing, follow: allowIndexing },
    openGraph: { title, description, type: "website", siteName: site.name,
      url: href(locale, path), locale: locale === "id" ? "id_ID" : "en_US",
      images: [{ url: site.hero, alt: site.name }] },
    twitter: { card: "summary_large_image", title, description, images: [site.hero] },
  };
}

export function postMetadata(post: Post): Metadata {
  const description = post.excerpt.slice(0, 160);
  const path = "/blog-post/" + post.slug;
  return {
    metadataBase: new URL(siteUrl), title: post.title + " | " + site.name, description,
    alternates: { canonical: path },
    robots: { index: allowIndexing, follow: allowIndexing },
    openGraph: { title: post.title, description, type: "article", url: path,
      publishedTime: post.date, modifiedTime: post.modified, authors: [post.author],
      images: post.image ? [{ url: post.image, alt: post.imageAlt }] : [site.hero] },
    twitter: { card: "summary_large_image", title: post.title, description,
      images: [post.image || site.hero] },
  };
}

export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
