import en from "@/content/en.json";
import id from "@/content/id.json";

export type Locale = "en" | "id";
const dictionaries: Record<Locale, Record<string, string>> = { en, id };

export function t(locale: Locale, key: string): string {
  return dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
}

export function label(locale: Locale, english: string, indonesian: string): string {
  return locale === "id" ? indonesian : english;
}

export function href(locale: Locale, path = ""): string {
  return (locale === "id" ? "/id" : "") + (path ? "/" + path : locale === "id" ? "" : "/");
}
