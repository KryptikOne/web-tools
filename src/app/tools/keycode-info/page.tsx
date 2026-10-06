import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import KeycodeInfo from '@/features/keycode-info/KeycodeInfo';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("keycode-info");

export default function KeycodeInfoPage() {
	const tool = getToolById("keycode-info")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <KeycodeInfo />
    </ToolLayout>
  );
}
