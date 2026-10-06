import type { Metadata } from "next";
import { getToolById } from "@/config/tools-registry";
import { buildToolMetadata, type SiteInfo } from "@/lib/seoUtils";

export const SITE: SiteInfo = {
	name: "BittBott.dev",
	url: "https://bittbott.dev",
	title: "BittBott.dev: free tools that run in your browser",
	description:
		"Free developer and design tools: formatters, converters, encoders, generators and calculators. Everything runs in your browser, so nothing you paste leaves your machine.",
};

/** Route-page metadata for a registry tool. Throws at build time if the id is not registered. */
export function toolMetadata(id: string): Metadata {
	const tool = getToolById(id);
	if (!tool) throw new Error(`toolMetadata: unknown tool id "${id}"`);
	return buildToolMetadata(tool, SITE);
}
