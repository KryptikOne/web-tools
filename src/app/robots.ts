import type { MetadataRoute } from "next";
import { SITE } from "@/config/seo";
import { absoluteUrl } from "@/lib/seoUtils";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [{ userAgent: "*", allow: "/" }],
		sitemap: absoluteUrl(SITE, "/sitemap.xml"),
	};
}
