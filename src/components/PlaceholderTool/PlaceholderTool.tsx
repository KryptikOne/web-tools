import Link from 'next/link';
import { WrenchIcon } from '@heroicons/react/24/outline';
import styles from './PlaceholderTool.module.scss';

interface PlaceholderToolProps {
  toolName: string;
}

export default function PlaceholderTool({ toolName }: PlaceholderToolProps) {
  return (
    <div className={styles.placeholder}>
      <WrenchIcon className={styles.icon} />
      <span className={styles.badge}>Coming Soon</span>
      <h2 className={styles.title}>{toolName}</h2>
      <p className={styles.message}>
        This tool is currently under development. Check back soon for updates, or feel free to browse our other available tools.
      </p>
      <Link href="/" className={styles.backButton}>
        Back to Home
      </Link>
    </div>
  );
}
