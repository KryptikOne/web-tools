import type { Metadata } from "next";
import { Geist, Michroma, Ubuntu_Mono } from "next/font/google";
import "@/styles/globals.css";
import ReduxProvider from "@/providers/ReduxProvider";
import AppLayout from "@/components/AppLayout/AppLayout";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

// const geistMono = Geist_Mono({
// 	variable: "--font-geist-mono",
// 	subsets: ["latin"],
// });

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
	title: "Web Tools - Developer Utilities",
	description: "A comprehensive collection of web development tools for developers and designers",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`${geistSans.variable} ${michroma.variable} ${ubuntuMono.variable} antialiased`}>
				<ReduxProvider>
					<AppLayout>{children}</AppLayout>
				</ReduxProvider>
			</body>
		</html>
	);
}
