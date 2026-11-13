import type { Metadata } from "next";
import ConstructionDemo from "./ConstructionDemo";

export const metadata: Metadata = {
	title: "Construction primitives",
	robots: { index: false, follow: false },
};

export default function ConstructionStyleguidePage() {
	return (
		<div className="max-w-5xl mx-auto px-4 py-8">
			<h1 className="text-2xl font-semibold mb-2">Construction primitives</h1>
			<p className="text-sm opacity-70 mb-6">Shared inputs, running lists, diagrams and print pieces that the Construction &amp; Trades tools are built from.</p>
			<ConstructionDemo />
		</div>
	);
}
