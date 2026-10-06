import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import EmojiPicker from '@/features/emoji-picker/EmojiPicker';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("emoji-picker");

export default function EmojiPickerPage() {
	const tool = getToolById("emoji-picker")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <EmojiPicker />
    </ToolLayout>
  );
}
