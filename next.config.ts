import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  images: {
    qualities: [75, 85],
    remotePatterns: [
      { protocol: "https", hostname: "blog.odongfoundation.org", pathname: "/wp-content/uploads/**" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      ...["about", "programs", "contact", "blog"].map((page) => ({
        source: "/" + page + ".html", destination: "/" + page, permanent: true,
      })),
      { source: "/blog/:slug", destination: "/blog-post/:slug", permanent: true },
    ];
  },
};
export default config;
