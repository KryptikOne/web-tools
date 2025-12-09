import Link from 'next/link';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { Tool } from '@/types/tools';
import { CATEGORIES } from '@/config/tools-registry';
import styles from './ToolCard.module.scss';

interface ToolCardProps {
  tool: Tool;
}

export default function ToolCard({ tool }: ToolCardProps) {
  const category = CATEGORIES[tool.category];

  const CardContent = (
    <>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <WrenchScrewdriverIcon />
        </div>
        {tool.implemented ? (
          <span className={styles.badge}>Ready</span>
        ) : (
          <span className={`${styles.badge} ${styles.comingSoonBadge}`}>Soon</span>
        )}
      </div>
      <h3 className={styles.title}>{tool.name}</h3>
      <p className={styles.description}>{tool.description}</p>
      <div className={styles.category}>{category.name}</div>
    </>
  );

  if (!tool.implemented) {
    return (
      <div className={`${styles.card} ${styles.notImplemented}`}>
        {CardContent}
      </div>
    );
  }

  return (
    <Link href={tool.route} className={styles.card}>
      {CardContent}
    </Link>
  );
}
