"use client";
import { label, type Locale } from "@/lib/i18n";
export function LoadError({ reset, locale }: { reset: () => void; locale: Locale }) {
  return <section className="section empty-state"><h1>{label(locale, "We couldn’t load this page.", "Halaman belum dapat dimuat.")}</h1><p>{label(locale, "Please try again in a moment.", "Silakan coba beberapa saat lagi.")}</p><button className="button button-primary" onClick={reset}>{label(locale, "Try again", "Coba lagi")}</button></section>;
}
