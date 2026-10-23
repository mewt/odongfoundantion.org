import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { href, label, type Locale } from "@/lib/i18n";
export function MissingPage({ locale }: { locale: Locale }) {
  return <section className="section empty-state"><span className="eyebrow">404</span><h1>{label(locale, "This page isn’t here.", "Halaman tidak ditemukan.")}</h1><p>{label(locale, "The link may have changed. Let’s get you back to the community.", "Tautan mungkin telah berubah. Mari kembali ke halaman utama.")}</p><Link className="button button-primary" href={href(locale)}><ArrowLeft size={18} />{label(locale, "Back to home", "Kembali ke beranda")}</Link></section>;
}
