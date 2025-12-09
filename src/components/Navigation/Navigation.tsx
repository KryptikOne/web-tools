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
      <div className={styles.container}>
        <div className={styles.navContent}>
          <Link href="/" className={styles.logo} onClick={() => setMobileMenuOpen(false)}>
            <WrenchScrewdriverIcon />
            <span>Web Tools</span>
          </Link>

          {/* Desktop Navigation */}
          <div className={styles.desktopNav}>
            {Object.values(CATEGORIES).map((category) => (
              <div key={category.id} style={{ position: 'relative' }}>
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
                      className={`${styles.dropdownItem} ${!tool.implemented ? styles.notImplemented : ''}`}
                      onClick={closeDropdown}
                    >
                      <div className={styles.dropdownItemContent}>
                        <div className={styles.dropdownItemTitle}>
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
          <button className={styles.mobileMenuButton} onClick={toggleMobileMenu}>
            {mobileMenuOpen ? <XMarkIcon /> : <Bars3Icon />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.open : ''}`}>
        {Object.values(CATEGORIES).map((category) => (
          <div key={category.id} className={styles.mobileCategory}>
            <h3 className={styles.mobileCategoryTitle}>{category.name}</h3>
            <div className={styles.mobileToolsList}>
              {getToolsByCategory(category.id).map((tool) => (
                <Link
                  key={tool.id}
                  href={tool.implemented ? tool.route : '#'}
                  className={`${styles.dropdownItem} ${!tool.implemented ? styles.notImplemented : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className={styles.dropdownItemContent}>
                    <div className={styles.dropdownItemTitle}>
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
