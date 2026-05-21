import ToolLayout from '@/components/ToolLayout/ToolLayout';
import NatoPhoneticConverter from '@/features/nato-phonetic-converter/NatoPhoneticConverter';

export default function NatoPhoneticConverterPage() {
	return (
		<ToolLayout>
			<NatoPhoneticConverter />
		</ToolLayout>
	);
}
