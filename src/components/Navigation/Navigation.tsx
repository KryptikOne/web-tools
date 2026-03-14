'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bars3Icon, XMarkIcon, WrenchScrewdriverIcon, CheckIcon } from '@heroicons/react/24/outline';
import { CATEGORIES, TOOLS_REGISTRY, getToolsByCategory } from '@/config/tools-registry';
import { ToolCategory } from '@/types/tools';
import styles from './Navigation.module.scss';

export default function Navigation() {
  const [activeDropdown, setActiveDropdown] = useState<ToolCategory | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleDropdown = (category: ToolCategory) => {
    setActiveDropdown(activeDropdown === category ? null : category);
  };

  const closeDropdown = () => {
    setActiveDropdown(null);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className={styles.nav}>
      <div className="max-w-360 mx-auto px-6">
        <div className="flex justify-between items-center min-h-16">
          <Link href="/" className={`flex items-center gap-4 no-underline ${styles.logo}`} onClick={() => setMobileMenuOpen(false)}>
            <WrenchScrewdriverIcon />
            <span>Web Tools</span>
          </Link>

          {/* Desktop Navigation */}
          <div className={`hidden md:flex gap-2 ${styles.desktopNav}`}>
            {Object.values(CATEGORIES).map((category) => (
              <div key={category.id} className="relative">
                <button
                  className={`${styles.categoryButton} ${activeDropdown === category.id ? styles.active : ''}`}
                  onClick={() => toggleDropdown(category.id)}
                  onMouseEnter={() => setActiveDropdown(category.id)}
                >
                  {category.name}
                </button>

                <div
                  className={`${styles.dropdown} ${activeDropdown === category.id ? styles.open : ''}`}
                  onMouseLeave={closeDropdown}
                >
                  {getToolsByCategory(category.id).map((tool) => (
                    <Link
                      key={tool.id}
                      href={tool.implemented ? tool.route : '#'}
                      className={`flex items-start gap-4 p-4 rounded-lg no-underline ${styles.dropdownItem} ${!tool.implemented ? styles.notImplemented : ''}`}
                      onClick={closeDropdown}
                    >
                      <div className="flex-1">
                        <div className={`text-sm font-medium mb-0.5 ${styles.dropdownItemTitle}`}>
                          {tool.name}
                          {tool.implemented && <span className={styles.badge}>Ready</span>}
                        </div>
                        <div className={styles.dropdownItemDesc}>{tool.description}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button className={`flex p-2 md:hidden ${styles.mobileMenuButton}`} onClick={toggleMobileMenu}>
            {mobileMenuOpen ? <XMarkIcon /> : <Bars3Icon />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.open : ''}`}>
        {Object.values(CATEGORIES).map((category) => (
          <div key={category.id} className="mb-6">
            <h3 className={styles.mobileCategoryTitle}>{category.name}</h3>
            <div className="flex flex-col gap-2">
              {getToolsByCategory(category.id).map((tool) => (
                <Link
                  key={tool.id}
                  href={tool.implemented ? tool.route : '#'}
                  className={`flex items-start gap-4 p-4 rounded-lg no-underline ${styles.dropdownItem} ${!tool.implemented ? styles.notImplemented : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex-1">
                    <div className={`text-sm font-medium mb-0.5 ${styles.dropdownItemTitle}`}>
                      {tool.name}
                      {tool.implemented && <span className={styles.badge}>Ready</span>}
                    </div>
                    <div className={styles.dropdownItemDesc}>{tool.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
