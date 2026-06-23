import { MetadataRoute } from "next";

const BASE = "https://opos.yemame.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        // Private/auth surfaces and APIs shouldn't be indexed.
        disallow: ["/dashboard", "/dashboard/*", "/api", "/api/*", "/_next/*"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
