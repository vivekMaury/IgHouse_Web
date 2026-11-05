import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/api/", "/callback"],
      },
    ],
    sitemap: "https://iginbox.com/sitemap.xml",
  };
}
