import type { Metadata } from "next";
import AppLayout from "@/components/AppLayout/AppLayout";

export const metadata: Metadata = {
	title: "Styleguide",
	robots: { index: false, follow: false },
};

export default function StyleguideLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return <AppLayout>{children}</AppLayout>;
}
