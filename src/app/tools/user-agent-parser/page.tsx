import ToolLayout from '@/components/ToolLayout/ToolLayout';
import UserAgentParser from '@/features/user-agent-parser/UserAgentParser';
import { getToolById } from "@/config/tools-registry";

export default function UserAgentParserPage() {
	const tool = getToolById("user-agent-parser")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <UserAgentParser />
    </ToolLayout>
  );
}
