import type { Metadata } from "next";
import LandingPage from "@/features/landing/LandingPage";
import { LANDING_TOOLS } from "@/features/landing/terminalCommands";
import { SITE } from "@/config/seo";
import { buildPageMetadata } from "@/lib/seoUtils";

export const metadata: Metadata = buildPageMetadata(
	{
		title: SITE.title,
		description: `${LANDING_TOOLS.length} free developer and design tools: formatters, converters, encoders, generators and calculators. Nothing you paste leaves your machine.`,
		path: "/",
		absoluteTitle: true,
	},
	SITE,
);

export default function HomePage() {
	return <LandingPage />;
}
