import type { Metadata } from "next";
import { Geist, Michroma, Ubuntu_Mono } from "next/font/google";
import "@/styles/globals.css";
import ReduxProvider from "@/providers/ReduxProvider";
import { Analytics } from "@vercel/analytics/next";
import { SITE } from "@/config/seo";
import { buildWebsiteJsonLd } from "@/lib/seoUtils";
import JsonLd from "@/components/JsonLd/JsonLd";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const ubuntuMono = Ubuntu_Mono({
	variable: "--font-ubuntu-mono",
	display: "swap",
	subsets: ["latin"],
	weight: ["400", "700"],
});

const michroma = Michroma({
	variable: "--font-michroma",
	display: "swap",
	subsets: ["latin"],
	weight: ["400"],
});

export const metadata: Metadata = {
	metadataBase: new URL(SITE.url),
	title: { default: SITE.title, template: `%s | ${SITE.name}` },
	description: SITE.description,
	// No openGraph.url here: pages without their own openGraph would inherit og:url "/".
	openGraph: { siteName: SITE.name, type: "website", locale: "en_US" },
	twitter: { card: "summary" },
	robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	const isProduction = process.env.NODE_ENV === "production";
	return (
		<html lang="en">
			<body className={`${geistSans.variable} ${michroma.variable} ${ubuntuMono.variable} antialiased`}>
				<JsonLd data={buildWebsiteJsonLd(SITE)} />
				<ReduxProvider>{children}</ReduxProvider>
				{isProduction && (
					<>
						<Analytics />
					</>
				)}
			</body>
		</html>
	);
}
