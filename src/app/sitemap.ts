import type { MetadataRoute } from "next";
import { TOOLS_REGISTRY } from "@/config/tools-registry";
import { SITE } from "@/config/seo";
import { absoluteUrl } from "@/lib/seoUtils";

export default function sitemap(): MetadataRoute.Sitemap {
	const toolRoutes = TOOLS_REGISTRY.filter((tool) => tool.implemented).map((tool) => tool.route);
	return ["/", "/tools", ...toolRoutes].map((path) => ({ url: absoluteUrl(SITE, path) }));
}
