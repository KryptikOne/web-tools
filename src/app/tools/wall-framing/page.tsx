import { toolMetadata } from "@/config/seo";
import WallFraming from "@/features/wall-framing/WallFraming";

export const metadata = toolMetadata("wall-framing");

export default function WallFramingPage() {
	return <WallFraming />;
}
