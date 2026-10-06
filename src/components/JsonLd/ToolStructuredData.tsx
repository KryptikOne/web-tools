"use client";

import { usePathname } from "next/navigation";
import { TOOLS_REGISTRY } from "@/config/tools-registry";
import { SITE } from "@/config/seo";
import { buildToolJsonLd } from "@/lib/seoUtils";
import JsonLd from "./JsonLd";

/** Tool-page JSON-LD, resolved from the route like TopBar. Server-rendered into the initial HTML. */
export default function ToolStructuredData() {
	const pathname = usePathname();
	const tool = TOOLS_REGISTRY.find((t) => t.route === pathname);
	if (!tool) return null;
	return <JsonLd data={buildToolJsonLd(tool, SITE)} />;
}
