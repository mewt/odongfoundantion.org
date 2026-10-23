import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Camera, Play } from "lucide-react";
import { site } from "@/content/site";
import { href, label, t, type Locale } from "@/lib/i18n";

export function Footer({ locale }: { locale: Locale }) {
  return <footer className="site-footer">
    <div className="container footer-grid">
      <div className="footer-intro">
        <Link href={href(locale)} className="brand footer-brand"><Image src={site.logo} alt="" width={58} height={58} /><span>ODONG<span className="brand-subtitle">FOUNDATION</span></span></Link>
        <p>{t(locale, "footer.desc")}</p>
        <div className="social-links">
          <a href={site.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Camera size={20} /></a>
          <a href={site.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"><Play size={22} /></a>
        </div>
      </div>
      <div><h2>{label(locale, "Explore", "Jelajahi")}</h2><ul>{["programs", "about", "blog", "contact"].map((p) => <li key={p}><Link href={href(locale, p)}>{t(locale, "nav." + p)}</Link></li>)}</ul></div>
      <div><h2>{label(locale, "Get involved", "Ambil bagian")}</h2><ul>
        <li><Link href={href(locale, "contact#donate")}>{t(locale, "nav.donate")}</Link></li>
        <li><Link href={href(locale, "contact?subject=volunteer")}>{t(locale, "btn.volunteer")}</Link></li>
        <li><Link href={href(locale, "contact?subject=partnership")}>{label(locale, "Partner with us", "Bermitra dengan kami")}</Link></li>
      </ul></div>
      <div className="footer-contact"><h2>{t(locale, "nav.contact")}</h2><p>{site.address}</p>
        <a href={"mailto:" + site.email}>{site.email}<ArrowUpRight size={15} /></a>
        <a href={"https://wa.me/" + site.whatsapp} target="_blank" rel="noopener noreferrer">{site.phone}<ArrowUpRight size={15} /></a>
      </div>
    </div>
    <div className="container footer-bottom"><span>© {new Date().getFullYear()} {site.legalName}.</span><span>{label(locale, "Growing together. Going further.", "Tumbuh bersama. Melangkah lebih jauh.")}</span></div>
  </footer>;
}
