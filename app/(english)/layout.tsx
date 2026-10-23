import type { Metadata } from "next";
import { RootShell } from "@/components/root-shell";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/content/site";
export const metadata: Metadata = { ...pageMetadata("en", "home"), icons: { icon: site.logo } };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootShell locale="en">{children}</RootShell>;
}
