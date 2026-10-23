"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { label, type Locale } from "@/lib/i18n";
import type { Post } from "@/lib/wordpress";
import { PostCard } from "./ui";

export function BlogList({ posts, locale }: { posts: Post[]; locale: Locale }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const categories = [...new Set(posts.flatMap((post) => post.categories))];
  const filtered = useMemo(() => posts.filter((post) =>
    (!category || post.categories.includes(category)) &&
    (post.title + " " + post.excerpt).toLocaleLowerCase().includes(query.toLocaleLowerCase().trim())
  ), [posts, category, query]);
  const pages = Math.max(1, Math.ceil(filtered.length / 6));
  const visible = filtered.slice((page - 1) * 6, page * 6);
  return <>
    <div className="blog-toolbar">
      <div className="blog-filters"><button className={!category ? "filter-chip selected" : "filter-chip"} onClick={() => { setCategory(""); setPage(1); }} aria-pressed={!category}>{label(locale, "All stories", "Semua cerita")}</button>
        {categories.map((cat) => <button key={cat} className={category === cat ? "filter-chip selected" : "filter-chip"} aria-pressed={category === cat} onClick={() => { setCategory(cat); setPage(1); }}>{cat}</button>)}</div>
      <label className="search-field"><Search size={18} /><span className="sr-only">{label(locale, "Search stories", "Cari cerita")}</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={label(locale, "Search stories…", "Cari cerita…")} /></label>
    </div>
    <p className="results-count" aria-live="polite">{filtered.length} {label(locale, "stories", "cerita")}</p>
    {visible.length ? <div className="post-grid">{visible.map((post) => <PostCard key={post.id} post={post} locale={locale} />)}</div> :
      <div className="empty-state"><h2>{label(locale, "No stories found", "Cerita tidak ditemukan")}</h2><p>{label(locale, "Try another search or category.", "Coba kata kunci atau kategori lain.")}</p><button className="button button-outline" onClick={() => { setQuery(""); setCategory(""); setPage(1); }}>{label(locale, "Clear filters", "Hapus filter")}</button></div>}
    {pages > 1 && <nav className="pagination" aria-label={label(locale, "Blog pagination", "Halaman blog")}>
      <button className="button button-outline" disabled={page === 1} onClick={() => setPage(page - 1)}><ArrowLeft size={17} />{label(locale, "Previous", "Sebelumnya")}</button>
      <span>{page} / {pages}</span>
      <button className="button button-outline" disabled={page === pages} onClick={() => setPage(page + 1)}>{label(locale, "Next", "Selanjutnya")}<ArrowRight size={17} /></button>
    </nav>}
  </>;
}
