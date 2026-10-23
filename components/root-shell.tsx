import type { ReactNode } from "react";
import { site } from "@/content/site";
import { jsonLd, siteUrl } from "@/lib/seo";
import { label, type Locale } from "@/lib/i18n";
import { Header } from "./header";
import { Footer } from "./footer";
import "@/app/globals.css";

export function RootShell({ children, locale }: { children: ReactNode; locale: Locale }) {
  return <html lang={locale}><body>
    <a className="skip-link" href="#main-content">{label(locale, "Skip to content", "Langsung ke konten")}</a>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({
      "@context": "https://schema.org", "@type": "NGO", name: site.name, legalName: site.legalName,
      url: siteUrl, logo: siteUrl + encodeURI(site.logo), email: site.email,
      telephone: "+6282247723858", sameAs: [site.instagram, site.youtube],
      address: { "@type": "PostalAddress", streetAddress: "Jl. Kemang Utara 33 No.3, Lantai 2", addressLocality: "Jakarta Selatan", postalCode: "12730", addressCountry: "ID" },
    }) }} />
    <Header locale={locale} /><main id="main-content">{children}</main><Footer locale={locale} />
  </body></html>;
}
