import { toolMetadata } from "@/config/seo";
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import OtpTotpGenerator from '@/features/otp-totp-generator/OtpTotpGenerator';
import { getToolById } from "@/config/tools-registry";

export const metadata = toolMetadata("otp-totp-generator");

export default function OtpTotpGeneratorPage() {
	const tool = getToolById("otp-totp-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <OtpTotpGenerator />
    </ToolLayout>
  );
}
