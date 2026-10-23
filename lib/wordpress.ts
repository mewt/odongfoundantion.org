import "server-only";
import { cache } from "react";
import sanitizeHtml from "sanitize-html";

const wordpressUrl = (process.env.WORDPRESS_URL || "https://blog.odongfoundation.org").replace(/\/$/, "");

type WordPressPost = {
  id: number; slug: string; date: string; date_gmt: string; modified_gmt: string;
  title: { rendered: string }; excerpt: { rendered: string }; content: { rendered: string };
  _embedded?: {
    author?: { name: string }[];
    "wp:featuredmedia"?: { source_url: string; alt_text: string }[];
    "wp:term"?: { name: string; taxonomy: string }[][];
  };
};

export type Post = {
  id: number; slug: string; title: string; excerpt: string; content: string;
  date: string; modified: string; author: string; image: string;
  imageAlt: string; categories: string[]; minutes: number;
};

export function textOnly(html: string): string {
  // Decode common entities without allowing HTML to survive in text/metadata.
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0*39;|&apos;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, n: string) => {
      const point = n.startsWith("x") ? parseInt(n.slice(1), 16) : parseInt(n, 10);
      return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : "";
    }).replace(/\s+/g, " ").trim();
}

function normalize(post: WordPressPost): Post {
  const image = post._embedded?.["wp:featuredmedia"]?.[0];
  const content = sanitizeHtml(post.content.rendered, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "figure", "figcaption"]),
    allowedAttributes: {
      a: ["href", "title", "rel"], img: ["src", "alt", "width", "height", "loading"],
      "*": ["id"], th: ["colspan", "rowspan"], td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: (tagName, attribs) => {
        const target = attribs.href || "";
        // Keep links to known CMS articles on the public frontend.
        if (target.startsWith(wordpressUrl + "/") && !target.includes("/wp-content/")) {
          const path = new URL(target).pathname.split("/").filter(Boolean);
          if (path.length === 1) attribs.href = "/blog-post/" + path[0];
        }
        return { tagName, attribs: { ...attribs, rel: "noopener noreferrer" } };
      },
      img: sanitizeHtml.simpleTransform("img", { loading: "lazy" }),
    },
  });
  return {
    id: post.id, slug: post.slug, title: textOnly(post.title.rendered),
    excerpt: textOnly(post.excerpt.rendered), content,
    date: post.date_gmt + "Z", modified: post.modified_gmt + "Z",
    author: post._embedded?.author?.[0]?.name || "ODONG Foundation",
    image: image?.source_url || "", imageAlt: textOnly(image?.alt_text || post.title.rendered),
    categories: (post._embedded?.["wp:term"]?.flat() || [])
      .filter((term) => term.taxonomy === "category" && term.name !== "Uncategorized")
      .map((term) => textOnly(term.name)),
    minutes: Math.max(1, Math.ceil(textOnly(post.content.rendered).split(/\s+/).length / 220)),
  };
}

async function request(query: string): Promise<{ posts: Post[]; totalPages: number }> {
  const response = await fetch(wordpressUrl + "/wp-json/wp/v2/posts?" + query, {
    next: { revalidate: 60, tags: ["wordpress-posts"] },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("WordPress returned HTTP " + response.status);
  const data: WordPressPost[] = await response.json();
  if (!Array.isArray(data)) throw new Error("Invalid WordPress response");
  return { posts: data.map(normalize), totalPages: Number(response.headers.get("x-wp-totalpages") || 1) };
}

export const getPosts = cache(async (): Promise<Post[]> => {
  const first = await request("per_page=100&_embed&status=publish");
  const posts = [...first.posts];
  for (let page = 2; page <= first.totalPages; page++) {
    posts.push(...(await request("per_page=100&_embed&status=publish&page=" + page)).posts);
  }
  return posts;
});

export const getPost = cache(async (slug: string): Promise<Post | undefined> => {
  return (await request("slug=" + encodeURIComponent(slug) + "&_embed&status=publish")).posts[0];
});

export async function getLatestPosts(): Promise<Post[]> {
  try { return (await getPosts()).slice(0, 3); }
  catch (error) { console.error("Latest articles unavailable:", error); return []; }
}
