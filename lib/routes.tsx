import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "./i18n";
import { pageMetadata, postMetadata } from "./seo";
import { getPost, getPosts } from "./wordpress";
import { AboutPage, ArticlePage, BlogPage, ContactPage, HomePage, ProgramsPage } from "@/components/pages";

export type RouteProps = { params: Promise<{ path?: string[] }> };
export const staticPaths = ["", "about", "programs", "contact", "blog"];

export async function routeMetadata(props: RouteProps, locale: Locale): Promise<Metadata> {
  const path = (await props.params).path || [];
  if (path.length === 2 && path[0] === "blog-post") {
    const post = await getPost(path[1]);
    if (!post) notFound();
    return postMetadata(post);
  }
  const page = path.join("/");
  if (!staticPaths.includes(page)) notFound();
  return pageMetadata(locale, page || "home");
}

export async function renderRoute(props: RouteProps, locale: Locale) {
  const path = (await props.params).path || [];
  const page = path.join("/");
  if (!page) return <HomePage locale={locale} />;
  if (page === "about") return <AboutPage locale={locale} />;
  if (page === "programs") return <ProgramsPage locale={locale} />;
  if (page === "contact") return <ContactPage locale={locale} />;
  if (page === "blog") return <BlogPage locale={locale} posts={await getPosts()} />;
  if (path.length === 2 && path[0] === "blog-post") {
    const post = await getPost(path[1]);
    if (!post) notFound();
    return <ArticlePage locale={locale} post={post} />;
  }
  notFound();
}
