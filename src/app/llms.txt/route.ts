import { TOOLS_REGISTRY, getAllCategories } from "@/config/tools-registry";
import { SITE } from "@/config/seo";
import { buildLlmsTxt } from "@/lib/seoUtils";

export const dynamic = "force-static";

export function GET() {
	return new Response(buildLlmsTxt(TOOLS_REGISTRY, getAllCategories(), SITE), {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
}
