import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Clock, Gamepad2, GraduationCap, HeartHandshake, Mail, MapPin, MessageCircle, Users } from "lucide-react";
import { gallery, programs, site } from "@/content/site";
import { href, label, t, type Locale } from "@/lib/i18n";
import { getLatestPosts, type Post } from "@/lib/wordpress";
import { jsonLd, siteUrl } from "@/lib/seo";
import { BankAccounts, ContactForm } from "./contact-form";
import { CallToAction, formatDate, PageHero, Partners, PostCard, ProgramCards, SectionHeading } from "./ui";
import { BlogList } from "./blog-list";
import { HeroBackground } from "./hero-background";

export async function HomePage({ locale }: { locale: Locale }) {
  const posts = await getLatestPosts();
  const heroLines = t(locale, "hero.title").split("\n");
  return <>
    <section className="home-hero">
      <HeroBackground locale={locale} />
      <div className="hero-shade" />
      <div className="container hero-content">
        <span className="hero-tag"><span />{label(locale, "YOUNG PEOPLE. SHARED POSSIBILITIES.", "ANAK MUDA. KESEMPATAN BERSAMA.")}</span>
        <h1>{heroLines[0]}<br /><span>{heroLines[1]}</span></h1>
        <p>{t(locale, "hero.desc")}</p>
        <div className="hero-buttons"><Link href={href(locale, "programs")} className="button button-primary">{t(locale, "hero.btn.programs")}<ArrowUpRight size={20} /></Link><Link href={href(locale, "contact#donate")} className="button button-glass">{t(locale, "hero.btn.support")}<HeartHandshake size={20} /></Link></div>
      </div>
      <div className="container hero-bottom"><span>{label(locale, "SPORTS · ESPORTS · LEADERSHIP", "OLAHRAGA · ESPORTS · KEPEMIMPINAN")}</span><a href="#our-purpose">{label(locale, "Discover our purpose", "Kenali tujuan kami")}<ArrowRight size={16} /></a></div>
    </section>
    <section className="purpose-section section" id="our-purpose"><div className="container">
      <div className="purpose-top"><SectionHeading eyebrow={t(locale, "home.about.tag")} title={t(locale, "home.about.title")} /><div><p className="lead">{t(locale, "home.about.desc")}</p><Link href={href(locale, "about")} className="text-link">{label(locale, "Meet the foundation", "Kenali yayasan kami")}<ArrowUpRight size={19} /></Link></div></div>
      <div className="values-grid">{[["mission", Gamepad2], ["vision", Users], ["values", HeartHandshake]].map(([key, Icon]) => {
        const IconComponent = Icon as typeof Gamepad2;
        return <div className="value-item" key={String(key)}><div className="icon-disc"><IconComponent size={27} /></div><h3>{t(locale, "home.about." + key + ".title")}</h3><p>{t(locale, "home.about." + key + ".desc")}</p></div>;
      })}</div>
    </div></section>
    <section className="section programs-section"><div className="container">
      <div className="section-row"><SectionHeading eyebrow={t(locale, "home.programs.tag")} title={t(locale, "home.programs.title")} description={t(locale, "home.programs.desc")} /><Link href={href(locale, "programs")} className="text-link">{t(locale, "btn.viewAllPrograms")}<ArrowUpRight size={19} /></Link></div>
      <ProgramCards locale={locale} />
    </div></section>
    <section className="section community-section"><div className="container split-section">
      <div className="community-images"><div className="community-main"><Image src="/img/foto2/Dok mini turney/1 kegiatan mei.png" alt={label(locale, "ODONG esports community gathered at @america", "Komunitas esports ODONG berkumpul di @america")} fill sizes="(max-width: 800px) 90vw, 45vw" /></div><div className="community-inset"><Image src="/img/foto2/Dok Odong League/20240810_165017434_iOS.webp" alt={label(locale, "Odong League community", "Komunitas Odong League")} fill sizes="250px" /></div><div className="photo-sticker">{label(locale, "Together, we grow.", "Tumbuh bersama.")}</div></div>
      <div className="split-copy"><span className="eyebrow">{label(locale, "Connection comes first", "Dimulai dari kebersamaan")}</span><h2>{t(locale, "about.story.title")}</h2><p>{t(locale, "about.story.p1")}</p><p>{t(locale, "about.story.p2")}</p><Link href={href(locale, "about")} className="button button-outline">{label(locale, "Read our story", "Baca kisah kami")}<ArrowRight size={18} /></Link></div>
    </div></section>
    <section className="section gallery-section"><div className="container"><SectionHeading eyebrow={label(locale, "Life at ODONG", "Kegiatan ODONG")} title={t(locale, "home.gallery.title")} description={t(locale, "home.gallery.desc")} /><div className="gallery-grid">{gallery.slice(0, 4).map((item) => <figure key={item.key}><Image src={item.image} alt={t(locale, "home.gallery." + item.key + ".desc")} fill sizes="(max-width: 600px) 50vw, 25vw" /><figcaption>{t(locale, "home.gallery." + item.key + ".title")}</figcaption></figure>)}</div></div></section>
    {posts.length > 0 && <section className="section"><div className="container"><div className="section-row"><SectionHeading eyebrow={label(locale, "From the community", "Dari komunitas")} title={label(locale, "Stories worth sharing.", "Cerita yang layak dibagikan.")} /><Link href={href(locale, "blog")} className="text-link">{label(locale, "All stories", "Semua cerita")}<ArrowUpRight size={19} /></Link></div><div className="post-grid">{posts.map((post) => <PostCard key={post.id} post={post} locale={locale} />)}</div></div></section>}
    <div className="container"><Partners locale={locale} /></div>
    <CallToAction locale={locale} />
  </>;
}

export function ProgramsPage({ locale }: { locale: Locale }) {
  const icons = [Gamepad2, GraduationCap, HeartHandshake];
  return <><PageHero locale={locale} title={t(locale, "programs.header.title")} description={t(locale, "programs.header.desc")} eyebrow={t(locale, "nav.programs")} />
    <nav className="program-jump-nav container" aria-label={label(locale, "Programs", "Program")}>{programs.map((p) => <a href={"#" + p.id} key={p.id}>{p.title}<ArrowUpRight size={17} /></a>)}</nav>
    {programs.map((program, index) => {
      const Icon = icons[index];
      return <section key={program.id} id={program.id} className={"program-detail section" + (index % 2 ? " alternate" : "")}><div className="container">
        <div className="split-section"><div className="detail-image"><Image src={program.image} alt={program.title} fill sizes="(max-width: 800px) 100vw, 45vw" /><span className="image-index">0{index + 1}</span></div>
          <div className="split-copy"><div className="icon-disc"><Icon size={27} /></div><span className="eyebrow">{t(locale, "programs." + program.key + ".subtitle")}</span><h2>{program.title}</h2><p>{t(locale, "programs." + program.key + ".p1")}</p><p>{t(locale, "programs." + program.key + ".p2")}</p>
            <ul className="check-list">{[1, 2, 3, 4, 5].map((n) => <li key={n}><Check size={18} />{t(locale, "programs." + program.key + ".f" + n)}</li>)}</ul>
            <Link href={href(locale, "contact?subject=programs")} className="button button-primary">{program.key === "academy" ? t(locale, "btn.applyNow") : t(locale, "programs." + program.key + ".btn")}<ArrowUpRight size={18} /></Link>
          </div>
        </div><Partners locale={locale} names={program.partners} />
      </div></section>;
    })}<CallToAction locale={locale} /></>;
}

export function AboutPage({ locale }: { locale: Locale }) {
  return <><PageHero locale={locale} title={t(locale, "about.header.title")} description={t(locale, "about.header.desc")} eyebrow={t(locale, "nav.about")} />
    <section className="section"><div className="container split-section"><div className="split-copy"><span className="eyebrow">{label(locale, "Our story", "Kisah kami")}</span><h2>{t(locale, "about.story.title")}</h2>{[1, 2, 3].map((n) => <p key={n}>{t(locale, "about.story.p" + n)}</p>)}</div><div className="about-image"><Image src="/img/foto2/Dok mini turney/2 kegiatan mei.png" alt={label(locale, "ODONG Foundation community activities", "Kegiatan komunitas Yayasan ODONG")} fill sizes="(max-width: 800px) 100vw, 45vw" /></div></div></section>
    <section className="section programs-section"><div className="container"><SectionHeading title={label(locale, "What guides us.", "Yang menjadi pegangan kami.")} centered /><div className="values-grid">{[["mission", Gamepad2], ["vision", Users], ["values", HeartHandshake]].map(([key, Icon]) => { const C = Icon as typeof Users; return <div className="value-item" key={String(key)}><div className="icon-disc"><C /></div><h3>{t(locale, "home.about." + key + ".title")}</h3><p>{t(locale, "home.about." + key + ".desc")}</p></div>; })}</div></div></section>
    <section className="section"><div className="container"><SectionHeading eyebrow={label(locale, "People make it possible", "Bergerak bersama")} title={t(locale, "about.team.title")} description={t(locale, "about.team.desc")} /><div className="team-grid">{["board", "directors", "coaches", "volunteers"].map((role, index) => <div className="team-role" key={role}><span>0{index + 1}</span><h3>{t(locale, "about.team." + role)}</h3><p>{t(locale, "about.team." + role + ".role")}</p></div>)}</div><Partners locale={locale} /></div></section>
    <section className="legal-section"><div className="container legal-grid"><div><span className="eyebrow">{label(locale, "The foundation", "Yayasan kami")}</span><h2>{site.legalName}</h2></div><p>{site.address}</p><a className="text-link" href={"mailto:" + site.email}>{label(locale, "Get in touch", "Hubungi kami")}<ArrowUpRight size={19} /></a></div></section>
    <CallToAction locale={locale} /></>;
}

export function ContactPage({ locale }: { locale: Locale }) {
  const details = [
    { icon: MapPin, label: t(locale, "contact.address.label"), content: site.address, link: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(site.address) },
    { icon: MessageCircle, label: "WhatsApp", content: site.phone, link: "https://wa.me/" + site.whatsapp },
    { icon: Mail, label: t(locale, "contact.email.label"), content: site.email, link: "mailto:" + site.email },
    { icon: Clock, label: t(locale, "contact.hours.label"), content: t(locale, "contact.hours.weekday") + "\n" + t(locale, "contact.hours.weekend"), link: "" },
  ];
  return <><PageHero locale={locale} title={t(locale, "contact.header.title")} description={t(locale, "contact.header.desc")} eyebrow={t(locale, "nav.contact")} />
    <section className="section"><div className="container contact-grid"><div className="contact-info"><h2>{t(locale, "contact.info.title")}</h2><p>{t(locale, "contact.info.desc")}</p><div className="contact-details">{details.map(({ icon: Icon, label: title, content, link }) => <div className="contact-detail" key={title}><div className="icon-disc"><Icon size={22} /></div><div><h3>{title}</h3>{link ? <a href={link} target={link.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">{content}</a> : <p>{content}</p>}</div></div>)}</div></div><ContactForm locale={locale} /></div></section>
    <section className="section donation-section" id="donate"><div className="container donation-grid"><div><SectionHeading eyebrow={label(locale, "Give with purpose", "Dukungan yang berarti")} title={t(locale, "contact.donate.title")} description={t(locale, "contact.donate.desc")} /><p>{label(locale, "After your transfer, email us your name, donation amount, and transfer date so we can acknowledge your support.", "Setelah transfer, kirim nama, jumlah donasi, dan tanggal transfer melalui email agar kami dapat mengonfirmasi dukungan Anda.")}</p><a className="text-link" href={"mailto:" + site.email + "?subject=" + encodeURIComponent("Donation confirmation")}>{label(locale, "Confirm your donation", "Konfirmasi donasi")}<ArrowUpRight size={19} /></a></div><BankAccounts locale={locale} /></div></section>
  </>;
}

export function BlogPage({ locale, posts }: { locale: Locale; posts: Post[] }) {
  return <><PageHero locale={locale} eyebrow={t(locale, "nav.blog")} title={label(locale, "Good things happen together.", "Cerita baik lahir dari kebersamaan.")} description={label(locale, "News, perspectives, and moments from our programs and the communities shaping them.", "Berita, pandangan, dan momen dari program kami serta komunitas yang menggerakkannya.")} /><section className="section"><div className="container"><BlogList locale={locale} posts={posts.map((post) => ({ ...post, content: "" }))} /></div></section><CallToAction locale={locale} /></>;
}

export function ArticlePage({ locale, post }: { locale: Locale; post: Post }) {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({
      "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title,
      description: post.excerpt, datePublished: post.date, dateModified: post.modified,
      author: { "@type": "Person", name: post.author },
      publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: siteUrl + encodeURI(site.logo) } },
      image: post.image || new URL(site.hero, siteUrl).href,
      mainEntityOfPage: siteUrl + "/blog-post/" + post.slug,
    }) }} />
    <article className="article-page" lang="id">
      <header className="container article-heading"><div className="breadcrumb"><Link href={href(locale)}>{t(locale, "nav.home")}</Link><span>/</span><Link href={href(locale, "blog")}>{t(locale, "nav.blog")}</Link></div>
        <div className="article-categories">{post.categories.map((category) => <span className="card-category" key={category}>{category}</span>)}</div><h1>{post.title}</h1>
        <div className="article-byline"><div className="author-avatar">{post.author.split(" ").slice(0, 2).map((word) => word[0]).join("")}</div><div><strong>{post.author}</strong><div className="post-meta"><time dateTime={post.date}>{formatDate(post.date, locale)}</time><span>·</span><span>{post.minutes} {label(locale, "min read", "menit baca")}</span></div></div></div>
      </header>
      {post.image && <div className="container"><div className="article-cover"><Image src={post.image} alt={post.imageAlt} fill sizes="(max-width: 1200px) 100vw, 1200px" preload /></div></div>}
      <div className="article-body" dangerouslySetInnerHTML={{ __html: post.content }} />
      <div className="article-end"><span>{label(locale, "Thanks for being part of our story.", "Terima kasih telah menjadi bagian dari cerita kami.")}</span><Link className="text-link" href={href(locale, "blog")}>{label(locale, "Explore more stories", "Jelajahi cerita lainnya")}<ArrowRight size={19} /></Link></div>
    </article><CallToAction locale={locale} />
  </>;
}
