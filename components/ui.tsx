import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { partners, programs, site } from "@/content/site";
import { href, label, t, type Locale } from "@/lib/i18n";
import type { Post } from "@/lib/wordpress";
export { PhotoCredit } from "./photo-credit";

export function SectionHeading({ eyebrow, title, description, centered = false }: { eyebrow?: string; title: string; description?: string; centered?: boolean }) {
  return <div className={centered ? "section-heading centered" : "section-heading"}>
    {eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{description && <p>{description}</p>}
  </div>;
}

export function PageHero({ locale, title, description, eyebrow }: { locale: Locale; title: string; description: string; eyebrow?: string }) {
  return <section className="page-hero"><div className="container">
    <div className="breadcrumb"><Link href={href(locale)}>{t(locale, "nav.home")}</Link><span>/</span><span>{eyebrow || title}</span></div>
    <span className="eyebrow">{eyebrow || "ODONG FOUNDATION"}</span><h1>{title}</h1><p>{description}</p>
  </div><span className="hero-outline" aria-hidden="true">ODONG</span></section>;
}

export function ProgramCards({ locale }: { locale: Locale }) {
  return <div className="program-grid">{programs.map((program, index) => {
    const copyKey = program.key === "academy" ? "leadership" : program.key;
    return <article className="program-card" key={program.id}>
      <Link href={href(locale, "programs#" + program.id)} className="card-image"><Image src={program.image} alt={program.title} fill sizes="(max-width: 700px) 100vw, 33vw" /><span className="program-number">0{index + 1}</span></Link>
      <div className="card-content"><span className="card-category">{t(locale, "home.programs." + copyKey + ".badge")}</span><h3><Link href={href(locale, "programs#" + program.id)}>{program.title}</Link></h3><p>{t(locale, "home.programs." + copyKey + ".desc")}</p><Link className="text-link" href={href(locale, "programs#" + program.id)}>{t(locale, "btn.learnMore")}<ArrowUpRight size={19} /></Link></div>
    </article>;
  })}</div>;
}

export function Partners({ locale, names }: { locale: Locale; names?: readonly string[] }) {
  const selected = names ? partners.filter((partner) => names.includes(partner.name)) : partners;
  return <div className="partners">
    <p className="eyebrow">{t(locale, "programs.partners.title")}</p>
    <div className="partner-logos">{selected.map((partner) => {
      const logo = <Image src={partner.image} alt={partner.label} width={150} height={65} />;
      return partner.url
        ? <a key={partner.name} className="partner-logo" href={partner.url} target="_blank" rel="noopener noreferrer" aria-label={partner.label}>{logo}</a>
        : <div key={partner.name} className="partner-logo">{logo}</div>;
    })}</div>
  </div>;
}

export function CallToAction({ locale }: { locale: Locale }) {
  return <section className="cta-section"><div className="container cta-inner">
    <div><span className="eyebrow">{t(locale, "home.donate.tag")}</span><h2>{t(locale, "home.donate.title")}</h2><p>{t(locale, "home.donate.desc")}</p></div>
    <div className="cta-buttons"><Link className="button button-white" href={href(locale, "contact#donate")}>{t(locale, "btn.donateNow")}<ArrowUpRight size={19} /></Link><Link className="text-link" href={href(locale, "contact?subject=volunteer")}>{t(locale, "btn.volunteer")}<ArrowRight size={19} /></Link></div>
  </div></section>;
}

export function PostCard({ post, locale }: { post: Post; locale: Locale }) {
  const url = href(locale, "blog-post/" + post.slug);
  return <article className="post-card">
    <Link href={url} className="post-image"><Image src={post.image || site.hero} alt={post.imageAlt || post.title} fill unoptimized={!post.image} sizes="(max-width: 700px) 100vw, 33vw" /></Link>
    <div className="post-card-body"><div className="post-meta"><time dateTime={post.date}>{formatDate(post.date, locale)}</time><span>·</span><span>{post.minutes} {label(locale, "min read", "menit baca")}</span></div>
      <h3><Link href={url}>{post.title}</Link></h3><p>{post.excerpt}</p><Link className="text-link" href={url}>{label(locale, "Read story", "Baca cerita")}<ArrowUpRight size={18} /></Link>
    </div>
  </article>;
}

export function formatDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(date));
}

