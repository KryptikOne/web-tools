import type { Metadata } from "next";
import LandingPage from "@/features/landing/LandingPage";
import { LANDING_TOOLS } from "@/features/landing/terminalCommands";

export const metadata: Metadata = {
	title: "BittBott.dev: free tools that run in your browser",
	description: `${LANDING_TOOLS.length} free developer and design tools: formatters, converters, encoders, generators and calculators. Nothing you paste leaves your machine.`,
};

export default function HomePage() {
	return <LandingPage />;
}
