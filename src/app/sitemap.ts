import { MetadataRoute } from "next";

const BASE = "https://opos.yemame.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  // Public, indexable pages only (auth + dashboard are private).
  return [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
