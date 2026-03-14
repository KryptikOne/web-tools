import Base64ImageEncoder from '@/features/base64-image-encoder/Base64ImageEncoder';
import ToolLayout from '@/components/ToolLayout/ToolLayout';
import { PhotoIcon } from '@heroicons/react/24/outline';

export const metadata = {
  title: 'Base64 Image Encoder - Web Tools',
  description: 'Convert images to Base64 strings or decode Base64 strings to preview and download images',
};

export default function Base64ImageEncoderPage() {
  return (
    <ToolLayout
      title="Base64 Image Encoder"
      description="Encode images to Base64 strings or decode Base64 to preview images"
      icon={<PhotoIcon />}
    >
      <Base64ImageEncoder />
    </ToolLayout>
  );
}
