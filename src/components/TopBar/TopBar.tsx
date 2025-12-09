'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  SunIcon,
  MoonIcon,
  LanguageIcon,
  SwatchIcon,
  ArrowTrendingUpIcon,
  EyeSlashIcon,
  ClockIcon,
  CalculatorIcon,
  Square2StackIcon,
  PaintBrushIcon,
  CubeIcon,
  FunnelIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { TOOLS_REGISTRY } from '@/config/tools-registry';
import styles from './TopBar.module.scss';

// Map tool IDs to their icons
const TOOL_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  'color-picker': SwatchIcon,
  'cubic-bezier': ArrowTrendingUpIcon,
  'invisible-character-remover': EyeSlashIcon,
  'palette-generator': PaintBrushIcon,
  'gradient-generator': Square2StackIcon,
  'box-shadow-generator': CubeIcon,
  'border-radius-generator': Squares2X2Icon,
  'css-filter-generator': FunnelIcon,
  'background-pattern-generator': Squares2X2Icon,
  'epoch-converter': ClockIcon,
  'px-rem-calculator': CalculatorIcon,
  'aspect-ratio-calculator': CalculatorIcon,
  'percentage-calculator': CalculatorIcon,
};

export default function TopBar() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [language, setLanguage] = useState('en');
  const pathname = usePathname();

  // Find the current tool based on pathname
  const currentTool = TOOLS_REGISTRY.find(tool => tool.route === pathname);
  const ToolIcon = currentTool ? TOOL_ICONS[currentTool.id] : null;

  useEffect(() => {
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleLanguage = () => {
    // For now, just toggle between en and es as an example
    const newLang = language === 'en' ? 'es' : 'en';
    setLanguage(newLang);
    // In a real app, you would integrate with i18n here
  };

  return (
    <header className={styles.topBar}>
      <div className={styles.leftSection}>
        {currentTool && (
          <>
            {ToolIcon && <ToolIcon className={styles.pageIcon} />}
            <h1 className={styles.pageTitle}>{currentTool.name}</h1>
          </>
        )}
      </div>

      <div className={styles.rightSection}>
        <button
          className={styles.iconButton}
          onClick={toggleLanguage}
          aria-label="Change language"
          title={`Language: ${language.toUpperCase()}`}
        >
          <LanguageIcon />
          <span className={styles.langText}>{language.toUpperCase()}</span>
        </button>

        <button
          className={styles.iconButton}
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  );
}
