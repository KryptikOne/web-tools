import ToolLayout from '@/components/ToolLayout/ToolLayout';
import AsciiTextDrawer from '@/features/ascii-text-drawer/AsciiTextDrawer';
import { getToolById } from "@/config/tools-registry";

export default function AsciiTextDrawerPage() {
	const tool = getToolById("ascii-text-drawer")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <AsciiTextDrawer />
    </ToolLayout>
  );
}
