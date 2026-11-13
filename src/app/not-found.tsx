import type { Metadata } from "next";
import NotFoundPage from "@/features/not-found/NotFoundPage";

// Next adds `robots: noindex` to not-found responses itself.
export const metadata: Metadata = { title: "404 · Not found" };

export default function NotFound() {
	return <NotFoundPage />;
}
