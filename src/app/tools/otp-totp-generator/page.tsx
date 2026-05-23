import ToolLayout from '@/components/ToolLayout/ToolLayout';
import OtpTotpGenerator from '@/features/otp-totp-generator/OtpTotpGenerator';
import { getToolById } from "@/config/tools-registry";

export default function OtpTotpGeneratorPage() {
	const tool = getToolById("otp-totp-generator")!;
  return (
    <ToolLayout title={tool.name} description={tool.description}>
      <OtpTotpGenerator />
    </ToolLayout>
  );
}
