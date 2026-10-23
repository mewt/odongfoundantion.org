"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Heart, Menu, X } from "lucide-react";
import { site } from "@/content/site";
import { href, label, t, type Locale } from "@/lib/i18n";

export function Header({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const cleanPath = pathname.replace(/^\/id(?=\/|$)/, "") || "/";
  const otherLanguage = locale === "en" ? "/id" + (cleanPath === "/" ? "" : cleanPath) : cleanPath;
  const links = ["home", "programs", "about", "blog", "contact"];

  return <header className="site-header">
    <div className="container header-inner">
      <Link href={href(locale)} className="brand" aria-label={site.name + " home"}>
        <Image src={site.logo} alt="" width={54} height={54} preload />
        <span>ODONG<span className="brand-subtitle">FOUNDATION</span></span>
      </Link>
      <nav aria-label={label(locale, "Main navigation", "Navigasi utama")} className={open ? "main-nav is-open" : "main-nav"} id="main-navigation">
        {links.map((page) => {
          const path = page === "home" ? "/" : "/" + page;
          const active = cleanPath === path || (page === "blog" && cleanPath.startsWith("/blog-post/"));
          return <Link key={page} href={href(locale, page === "home" ? "" : page)} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}>{t(locale, "nav." + page)}</Link>;
        })}
        <Link href={href(locale, "contact#donate")} className="button button-primary mobile-donate" onClick={() => setOpen(false)}>{t(locale, "nav.donate")}</Link>
      </nav>
      <div className="header-actions">
        <Link href={otherLanguage} className="language-switch" hrefLang={locale === "en" ? "id" : "en"} aria-label={locale === "en" ? "Beralih ke Bahasa Indonesia" : "Switch to English"}>
          <span className={locale === "en" ? "selected" : ""}>EN</span><span className="language-divider">/</span><span className={locale === "id" ? "selected" : ""}>ID</span>
        </Link>
        <Link href={href(locale, "contact#donate")} className="button button-primary desktop-donate"><Heart size={16} />{t(locale, "nav.donate")}</Link>
        <button className="menu-toggle" aria-controls="main-navigation" aria-expanded={open} aria-label={label(locale, open ? "Close menu" : "Open menu", open ? "Tutup menu" : "Buka menu")} onClick={() => setOpen(!open)} onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </div>
  </header>;
}
