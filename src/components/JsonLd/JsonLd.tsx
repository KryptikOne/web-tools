import { serializeJsonLd } from "@/lib/seoUtils";

interface JsonLdProps {
	data: unknown;
}

export default function JsonLd({ data }: JsonLdProps) {
	return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
