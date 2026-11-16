import { toolMetadata } from "@/config/seo";
import RoofShapes from "@/features/roof-shapes/RoofShapes";

export const metadata = toolMetadata("roof-shapes");

export default function RoofShapesPage() {
	return <RoofShapes />;
}
