"use client";

import { useState } from "react";
import { SwatchIcon, DocumentTextIcon, PhotoIcon, CodeBracketIcon, CalculatorIcon, ClipboardDocumentIcon, CheckIcon, ArrowPathIcon, TrashIcon, PlusIcon, SunIcon, MoonIcon, Bars3Icon, XMarkIcon, LinkIcon, ClockIcon, EyeIcon, BookmarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import styles from "./styleguide.module.scss";

export default function StyleguidePage() {
	const [copiedItem, setCopiedItem] = useState<string | null>(null);

	const copyToClipboard = async (text: string, id: string) => {
		await navigator.clipboard.writeText(text);
		setCopiedItem(id);
		setTimeout(() => setCopiedItem(null), 2000);
	};

	return (
		<div className={styles.container}>
			{/* Header */}
			<header className={styles.header}>
				<h1 className={styles.title}>Styleguide</h1>
				<p className={styles.subtitle}>Design system documentation for BittBott.dev</p>
			</header>

			{/* Table of Contents */}
			<nav className={styles.toc}>
				<h2 className={styles.tocTitle}>Contents</h2>
				<ul className={styles.tocList}>
					<li>
						<a href="#color-system">Color System</a>
					</li>
					<li>
						<a href="#colors">Current Colors</a>
					</li>
					<li>
						<a href="#typography">Typography</a>
					</li>
					<li>
						<a href="#spacing">Spacing</a>
					</li>
					<li>
						<a href="#borders">Border Radius</a>
					</li>
					<li>
						<a href="#shadows">Shadows</a>
					</li>
					<li>
						<a href="#buttons">Buttons</a>
					</li>
					<li>
						<a href="#inputs">Inputs</a>
					</li>
					<li>
						<a href="#cards">Cards</a>
					</li>
					<li>
						<a href="#badges">Badges</a>
					</li>
					<li>
						<a href="#icons">Icons</a>
					</li>
					<li>
						<a href="#code">Code Blocks</a>
					</li>
					<li>
						<a href="#patterns">Common Patterns</a>
					</li>
				</ul>
			</nav>

			{/* Color System Proposal */}
			<section id="color-system" className={styles.section}>
				<h2 className={styles.sectionTitle}>Color System</h2>
				<p className={styles.sectionDescription}>Our color system is built around a vibrant lime green primary color. The accent colors have been carefully selected using color theory to complement the primary while maintaining excellent contrast and accessibility.</p>

				{/* Color Philosophy */}
				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Color Philosophy</h3>
					<div className={styles.philosophyGrid}>
						<div className={styles.philosophyCard}>
							<div className={styles.philosophyIcon} style={{ background: "oklch(91.9% 0.196 131.1)" }} />
							<h4>Primary - Lime Green</h4>
							<p>The foundation of our brand. A vibrant, energetic lime green that represents growth, technology, and innovation. Used for primary actions, highlights, and key UI elements.</p>
							<code>oklch(91.9% 0.196 131.1)</code>
						</div>
						<div className={styles.philosophyCard}>
							<div className={styles.philosophyIcon} style={{ background: "oklch(75% 0.15 180)" }} />
							<h4>Accent - Teal</h4>
							<p>An analogous teal that harmonizes with the primary green. Used for secondary actions, links, and interactive elements. Creates visual cohesion while providing contrast.</p>
							<code>oklch(75% 0.15 180)</code>
						</div>
						<div className={styles.philosophyCard}>
							<div className={styles.philosophyIcon} style={{ background: "oklch(85% 0.18 85)" }} />
							<h4>Accent Secondary - Amber</h4>
							<p>A warm amber/gold that provides complementary warmth against the cool greens. Used for warnings, highlights, and drawing attention to important elements.</p>
							<code>oklch(85% 0.18 85)</code>
						</div>
					</div>
				</div>

				{/* Dark Theme Palette */}
				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Dark Theme Palette</h3>
					<div className={styles.paletteShowcase}>
						<div className={styles.palettePreview} style={{ background: "oklch(25.2% 0 89.9)" }}>
							<div className={styles.paletteSwatches}>
								<div className={styles.paletteSwatch} style={{ background: "oklch(91.9% 0.196 131.1)" }} title="Primary" />
								<div className={styles.paletteSwatch} style={{ background: "oklch(75% 0.15 180)" }} title="Accent" />
								<div className={styles.paletteSwatch} style={{ background: "oklch(85% 0.18 85)" }} title="Accent Secondary" />
								<div className={styles.paletteSwatch} style={{ background: "oklch(65% 0.12 160)" }} title="Muted Green" />
							</div>
							<span className={styles.paletteLabel}>Dark Theme</span>
						</div>
						<div className={styles.paletteDetails}>
							<div className={styles.paletteColor}>
								<div className={styles.paletteColorSwatch} style={{ background: "oklch(91.9% 0.196 131.1)" }} />
								<div className={styles.paletteColorInfo}>
									<span>Primary</span>
									<code>oklch(91.9% 0.196 131.1)</code>
								</div>
							</div>
							<div className={styles.paletteColor}>
								<div className={styles.paletteColorSwatch} style={{ background: "oklch(75% 0.15 180)" }} />
								<div className={styles.paletteColorInfo}>
									<span>Accent (Teal)</span>
									<code>oklch(75% 0.15 180)</code>
								</div>
							</div>
							<div className={styles.paletteColor}>
								<div className={styles.paletteColorSwatch} style={{ background: "oklch(85% 0.18 85)" }} />
								<div className={styles.paletteColorInfo}>
									<span>Accent Secondary (Amber)</span>
									<code>oklch(85% 0.18 85)</code>
								</div>
							</div>
							<div className={styles.paletteColor}>
								<div className={styles.paletteColorSwatch} style={{ background: "oklch(65% 0.12 160)" }} />
								<div className={styles.paletteColorInfo}>
									<span>Muted Green</span>
									<code>oklch(65% 0.12 160)</code>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Light Theme Palette */}
				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Light Theme Palette</h3>
					<div className={styles.paletteShowcase}>
						<div className={styles.palettePreview} style={{ background: "oklch(0.98 0.005 150.4)" }}>
							<div className={styles.paletteSwatches}>
								<div className={styles.paletteSwatch} style={{ background: "oklch(55% 0.2 145)" }} title="Primary Dark" />
								<div className={styles.paletteSwatch} style={{ background: "oklch(50% 0.12 180)" }} title="Accent Dark" />
								<div className={styles.paletteSwatch} style={{ background: "oklch(55% 0.15 85)" }} title="Accent Secondary Dark" />
								<div className={styles.paletteSwatch} style={{ background: "oklch(45% 0.1 160)" }} title="Muted Dark" />
							</div>
							<span className={styles.paletteLabelDark}>Light Theme</span>
						</div>
						<div className={styles.paletteDetails}>
							<div className={styles.paletteColor}>
								<div className={styles.paletteColorSwatch} style={{ background: "oklch(55% 0.2 145)" }} />
								<div className={styles.paletteColorInfo}>
									<span>Primary (Darker)</span>
									<code>oklch(55% 0.2 145)</code>
								</div>
							</div>
							<div className={styles.paletteColor}>
								<div className={styles.paletteColorSwatch} style={{ background: "oklch(50% 0.12 180)" }} />
								<div className={styles.paletteColorInfo}>
									<span>Accent (Teal Dark)</span>
									<code>oklch(50% 0.12 180)</code>
								</div>
							</div>
							<div className={styles.paletteColor}>
								<div className={styles.paletteColorSwatch} style={{ background: "oklch(55% 0.15 85)" }} />
								<div className={styles.paletteColorInfo}>
									<span>Accent Secondary (Amber Dark)</span>
									<code>oklch(55% 0.15 85)</code>
								</div>
							</div>
							<div className={styles.paletteColor}>
								<div className={styles.paletteColorSwatch} style={{ background: "oklch(45% 0.1 160)" }} />
								<div className={styles.paletteColorInfo}>
									<span>Muted (Dark Green)</span>
									<code>oklch(45% 0.1 160)</code>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Semantic Colors */}
				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Semantic Colors</h3>
					<div className={styles.semanticGrid}>
						<div className={styles.semanticCard}>
							<div className={styles.semanticSwatch} style={{ background: "oklch(70% 0.18 145)" }} />
							<span className={styles.semanticName}>Success</span>
							<code>oklch(70% 0.18 145)</code>
						</div>
						<div className={styles.semanticCard}>
							<div className={styles.semanticSwatch} style={{ background: "oklch(75% 0.15 85)" }} />
							<span className={styles.semanticName}>Warning</span>
							<code>oklch(75% 0.15 85)</code>
						</div>
						<div className={styles.semanticCard}>
							<div className={styles.semanticSwatch} style={{ background: "oklch(65% 0.2 25)" }} />
							<span className={styles.semanticName}>Error</span>
							<code>oklch(65% 0.2 25)</code>
						</div>
						<div className={styles.semanticCard}>
							<div className={styles.semanticSwatch} style={{ background: "oklch(70% 0.12 230)" }} />
							<span className={styles.semanticName}>Info</span>
							<code>oklch(70% 0.12 230)</code>
						</div>
					</div>
				</div>

				{/* Color Harmony Explanation */}
				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Color Harmony</h3>
					<div className={styles.harmonyNote}>
						<p>
							<strong>Why these colors work together:</strong>
						</p>
						<ul>
							<li>
								<strong>Primary (Lime Green - Hue 131):</strong> Our anchor color, vibrant and distinctive
							</li>
							<li>
								<strong>Teal (Hue 180):</strong> Analogous to green, creates smooth visual flow
							</li>
							<li>
								<strong>Amber (Hue 85):</strong> Split-complementary, provides warm contrast without clashing
							</li>
							<li>All colors use OKLCH for perceptually uniform lightness and saturation</li>
						</ul>
					</div>
				</div>

				{/* Interactive Demo */}
				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>In Context</h3>
					<div className={styles.contextDemo}>
						<div className={styles.demoCard}>
							<div className={styles.demoHeader}>
								<div className={styles.demoIcon} style={{ color: "oklch(91.9% 0.196 131.1)" }}>
									<SwatchIcon />
								</div>
								<span className={styles.demoBadge} style={{ background: "oklch(75% 0.15 180 / 0.2)", color: "oklch(75% 0.15 180)" }}>
									Active
								</span>
							</div>
							<h4 className={styles.demoTitle}>Example Tool Card</h4>
							<p className={styles.demoDescription}>This demonstrates how the new color system works in context with our UI components.</p>
							<div className={styles.demoActions}>
								<button className={styles.demoBtnPrimary}>Primary Action</button>
								<button className={styles.demoBtnSecondary}>Secondary</button>
							</div>
						</div>
						<div className={styles.demoCard}>
							<div className={styles.demoSliders}>
								<div className={styles.demoSlider}>
									<span>Hue</span>
									<div className={styles.demoSliderTrack} style={{ background: "linear-gradient(to right, oklch(75% 0.15 180) 0%, oklch(91.9% 0.196 131.1) 100%)" }} />
								</div>
								<div className={styles.demoSlider}>
									<span>Saturation</span>
									<div className={styles.demoSliderTrack} style={{ background: "linear-gradient(to right, oklch(75% 0 131.1) 0%, oklch(91.9% 0.196 131.1) 100%)" }} />
								</div>
							</div>
							<div className={styles.demoCode}>
								<code style={{ color: "oklch(75% 0.15 180)" }}>background: linear-gradient(135deg, #b5fe67 0%, #00ccad 100%);</code>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Colors Section */}
			<section id="colors" className={styles.section}>
				<h2 className={styles.sectionTitle}>Current Colors</h2>

				{/* Brand Colors */}
				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Brand Colors (Static)</h3>
					<div className={styles.colorGrid}>
						<div className={styles.colorCard}>
							<div className={styles.colorSwatch} style={{ background: "oklch(91.9% 0.196 131.1)" }} />
							<div className={styles.colorInfo}>
								<span className={styles.colorName}>$color-primary</span>
								<code className={styles.colorValue}>oklch(91.9% 0.196 131.1)</code>
							</div>
						</div>
						<div className={styles.colorCard}>
							<div className={styles.colorSwatch} style={{ background: "oklch(91.9% 0.196 131.1 / 0.5)" }} />
							<div className={styles.colorInfo}>
								<span className={styles.colorName}>$color-primary-50</span>
								<code className={styles.colorValue}>oklch(91.9% 0.196 131.1 / .50)</code>
							</div>
						</div>
						<div className={styles.colorCard}>
							<div className={styles.colorSwatch} style={{ background: "#667eea" }} />
							<div className={styles.colorInfo}>
								<span className={styles.colorName}>$color-accent</span>
								<code className={styles.colorValue}>#667eea</code>
							</div>
						</div>
						<div className={styles.colorCard}>
							<div className={styles.colorSwatch} style={{ background: "#764ba2" }} />
							<div className={styles.colorInfo}>
								<span className={styles.colorName}>$color-accent-secondary</span>
								<code className={styles.colorValue}>#764ba2</code>
							</div>
						</div>
						<div className={styles.colorCard}>
							<div className={styles.colorSwatch} style={{ background: "oklch(0.70 0.18 150)" }} />
							<div className={styles.colorInfo}>
								<span className={styles.colorName}>$color-green-base</span>
								<code className={styles.colorValue}>oklch(0.70 0.18 150)</code>
							</div>
						</div>
					</div>
				</div>

				{/* Theme-Aware Text Colors */}
				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Text Colors (Theme-Aware)</h3>
					<div className={styles.colorGrid}>
						<div className={styles.colorCard}>
							<div className={styles.colorSwatch} style={{ background: "var(--text-primary)" }} />
							<div className={styles.colorInfo}>
								<span className={styles.colorName}>$text-primary</span>
								<code className={styles.colorValue}>var(--text-primary)</code>
							</div>
						</div>
						<div className={styles.colorCard}>
							<div className={styles.colorSwatch} style={{ background: "var(--text-secondary)" }} />
							<div className={styles.colorInfo}>
								<span className={styles.colorName}>$text-secondary</span>
								<code className={styles.colorValue}>var(--text-secondary)</code>
							</div>
						</div>
						<div className={styles.colorCard}>
							<div className={styles.colorSwatch} style={{ background: "var(--text-tertiary)" }} />
							<div className={styles.colorInfo}>
								<span className={styles.colorName}>$text-tertiary</span>
								<code className={styles.colorValue}>var(--text-tertiary)</code>
							</div>
						</div>
						<div className={styles.colorCard}>
							<div className={styles.colorSwatch} style={{ background: "var(--text-muted)" }} />
							<div className={styles.colorInfo}>
								<span className={styles.colorName}>$text-muted</span>
								<code className={styles.colorValue}>var(--text-muted)</code>
							</div>
						</div>
						<div className={styles.colorCard}>
							<div className={styles.colorSwatch} style={{ background: "var(--text-code)" }} />
							<div className={styles.colorInfo}>
								<span className={styles.colorName}>$text-code</span>
								<code className={styles.colorValue}>var(--text-code)</code>
							</div>
						</div>
					</div>
				</div>

				{/* Background Colors */}
				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Background Colors (Theme-Aware)</h3>
					<div className={styles.colorGrid}>
						<div className={styles.colorCard}>
							<div className={styles.colorSwatch} style={{ background: "var(--bg-primary)" }} />
							<div className={styles.colorInfo}>
								<span className={styles.colorName}>$bg-primary</span>
								<code className={styles.colorValue}>var(--bg-primary)</code>
							</div>
						</div>
						<div className={styles.colorCard}>
							<div className={styles.colorSwatch} style={{ background: "var(--bg-secondary)" }} />
							<div className={styles.colorInfo}>
								<span className={styles.colorName}>$bg-secondary</span>
								<code className={styles.colorValue}>var(--bg-secondary)</code>
							</div>
						</div>
						<div className={styles.colorCard}>
							<div className={styles.colorSwatch} style={{ background: "var(--bg-tertiary)" }} />
							<div className={styles.colorInfo}>
								<span className={styles.colorName}>$bg-tertiary</span>
								<code className={styles.colorValue}>var(--bg-tertiary)</code>
							</div>
						</div>
						<div className={styles.colorCard}>
							<div className={`${styles.colorSwatch} ${styles.glassSwatch}`} style={{ background: "var(--bg-glass)" }} />
							<div className={styles.colorInfo}>
								<span className={styles.colorName}>$bg-glass</span>
								<code className={styles.colorValue}>var(--bg-glass)</code>
							</div>
						</div>
						<div className={styles.colorCard}>
							<div className={`${styles.colorSwatch} ${styles.glassSwatch}`} style={{ background: "var(--bg-glass-hover)" }} />
							<div className={styles.colorInfo}>
								<span className={styles.colorName}>$bg-glass-hover</span>
								<code className={styles.colorValue}>var(--bg-glass-hover)</code>
							</div>
						</div>
						<div className={styles.colorCard}>
							<div className={`${styles.colorSwatch} ${styles.glassSwatch}`} style={{ background: "var(--bg-overlay)" }} />
							<div className={styles.colorInfo}>
								<span className={styles.colorName}>$bg-overlay</span>
								<code className={styles.colorValue}>var(--bg-overlay)</code>
							</div>
						</div>
					</div>
				</div>

				{/* Border Colors */}
				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Border Colors (Theme-Aware)</h3>
					<div className={styles.colorGrid}>
						<div className={styles.colorCard}>
							<div className={`${styles.colorSwatch} ${styles.borderSwatch}`} style={{ borderColor: "var(--border-subtle)" }} />
							<div className={styles.colorInfo}>
								<span className={styles.colorName}>$border-subtle</span>
								<code className={styles.colorValue}>var(--border-subtle)</code>
							</div>
						</div>
						<div className={styles.colorCard}>
							<div className={`${styles.colorSwatch} ${styles.borderSwatch}`} style={{ borderColor: "var(--border-medium)" }} />
							<div className={styles.colorInfo}>
								<span className={styles.colorName}>$border-medium</span>
								<code className={styles.colorValue}>var(--border-medium)</code>
							</div>
						</div>
						<div className={styles.colorCard}>
							<div className={`${styles.colorSwatch} ${styles.borderSwatch}`} style={{ borderColor: "var(--border-strong)" }} />
							<div className={styles.colorInfo}>
								<span className={styles.colorName}>$border-strong</span>
								<code className={styles.colorValue}>var(--border-strong)</code>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Typography Section */}
			<section id="typography" className={styles.section}>
				<h2 className={styles.sectionTitle}>Typography</h2>

				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Font Families</h3>
					<div className={styles.typographyGrid}>
						<div className={styles.fontCard}>
							<p className={styles.fontDisplay}>Michroma Display Font</p>
							<code>$font-family-display</code>
							<span className={styles.fontUsage}>Used for: Headings, titles, branding</span>
						</div>
						<div className={styles.fontCard}>
							<p className={styles.fontSans}>Geist Sans Body Font</p>
							<code>$font-family-sans</code>
							<span className={styles.fontUsage}>Used for: Body text, labels, UI elements</span>
						</div>
						<div className={styles.fontCard}>
							<p className={styles.fontMono}>Ubuntu Mono Code Font</p>
							<code>$font-family-mono</code>
							<span className={styles.fontUsage}>Used for: Code, values, hex colors</span>
						</div>
					</div>
				</div>

				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Type Scale</h3>
					<div className={styles.typeScale}>
						<div className={styles.typeScaleItem}>
							<span className={styles.typeHero}>Hero Title</span>
							<code>2.5rem / 3.5rem (desktop)</code>
						</div>
						<div className={styles.typeScaleItem}>
							<span className={styles.typeH1}>Page Title (H1)</span>
							<code>2rem</code>
						</div>
						<div className={styles.typeScaleItem}>
							<span className={styles.typeH2}>Section Title (H2)</span>
							<code>1.5rem</code>
						</div>
						<div className={styles.typeScaleItem}>
							<span className={styles.typeH3}>Subsection (H3)</span>
							<code>1.125rem</code>
						</div>
						<div className={styles.typeScaleItem}>
							<span className={styles.typeBody}>Body Text</span>
							<code>1rem (16px)</code>
						</div>
						<div className={styles.typeScaleItem}>
							<span className={styles.typeSmall}>Small Text</span>
							<code>0.875rem (14px)</code>
						</div>
						<div className={styles.typeScaleItem}>
							<span className={styles.typeXSmall}>Extra Small / Labels</span>
							<code>0.75rem (12px)</code>
						</div>
					</div>
				</div>
			</section>

			{/* Spacing Section */}
			<section id="spacing" className={styles.section}>
				<h2 className={styles.sectionTitle}>Spacing</h2>
				<div className={styles.spacingGrid}>
					<div className={styles.spacingItem}>
						<div className={styles.spacingVisual} style={{ width: "0.25rem", height: "0.25rem" }} />
						<code>$spacing-xs</code>
						<span>0.25rem (4px)</span>
					</div>
					<div className={styles.spacingItem}>
						<div className={styles.spacingVisual} style={{ width: "0.5rem", height: "0.5rem" }} />
						<code>$spacing-sm</code>
						<span>0.5rem (8px)</span>
					</div>
					<div className={styles.spacingItem}>
						<div className={styles.spacingVisual} style={{ width: "1rem", height: "1rem" }} />
						<code>$spacing-md</code>
						<span>1rem (16px)</span>
					</div>
					<div className={styles.spacingItem}>
						<div className={styles.spacingVisual} style={{ width: "1.5rem", height: "1.5rem" }} />
						<code>$spacing-lg</code>
						<span>1.5rem (24px)</span>
					</div>
					<div className={styles.spacingItem}>
						<div className={styles.spacingVisual} style={{ width: "2rem", height: "2rem" }} />
						<code>$spacing-xl</code>
						<span>2rem (32px)</span>
					</div>
					<div className={styles.spacingItem}>
						<div className={styles.spacingVisual} style={{ width: "3rem", height: "3rem" }} />
						<code>$spacing-2xl</code>
						<span>3rem (48px)</span>
					</div>
				</div>
			</section>

			{/* Border Radius Section */}
			<section id="borders" className={styles.section}>
				<h2 className={styles.sectionTitle}>Border Radius</h2>
				<div className={styles.radiusGrid}>
					<div className={styles.radiusItem}>
						<div className={styles.radiusVisual} style={{ borderRadius: "0.375rem" }} />
						<code>$radius-sm</code>
						<span>0.375rem (6px)</span>
					</div>
					<div className={styles.radiusItem}>
						<div className={styles.radiusVisual} style={{ borderRadius: "0.5rem" }} />
						<code>$radius-md</code>
						<span>0.5rem (8px)</span>
					</div>
					<div className={styles.radiusItem}>
						<div className={styles.radiusVisual} style={{ borderRadius: "0.75rem" }} />
						<code>$radius-lg</code>
						<span>0.75rem (12px)</span>
					</div>
					<div className={styles.radiusItem}>
						<div className={styles.radiusVisual} style={{ borderRadius: "1rem" }} />
						<code>$radius-xl</code>
						<span>1rem (16px)</span>
					</div>
					<div className={styles.radiusItem}>
						<div className={styles.radiusVisual} style={{ borderRadius: "1.5rem" }} />
						<code>$radius-2xl</code>
						<span>1.5rem (24px)</span>
					</div>
				</div>
			</section>

			{/* Shadows Section */}
			<section id="shadows" className={styles.section}>
				<h2 className={styles.sectionTitle}>Shadows</h2>
				<div className={styles.shadowGrid}>
					<div className={styles.shadowItem}>
						<div className={styles.shadowVisual} style={{ boxShadow: "var(--shadow-sm)" }} />
						<code>$shadow-sm</code>
						<span>0 1px 2px 0 rgba(0,0,0,0.3)</span>
					</div>
					<div className={styles.shadowItem}>
						<div className={styles.shadowVisual} style={{ boxShadow: "var(--shadow-md)" }} />
						<code>$shadow-md</code>
						<span>0 4px 6px -1px rgba(0,0,0,0.4)</span>
					</div>
					<div className={styles.shadowItem}>
						<div className={styles.shadowVisual} style={{ boxShadow: "var(--shadow-lg)" }} />
						<code>$shadow-lg</code>
						<span>0 10px 15px -3px rgba(0,0,0,0.5)</span>
					</div>
					<div className={styles.shadowItem}>
						<div className={styles.shadowVisual} style={{ boxShadow: "var(--shadow-xl)" }} />
						<code>$shadow-xl</code>
						<span>0 20px 25px -5px rgba(0,0,0,0.5)</span>
					</div>
				</div>
			</section>

			{/* Buttons Section */}
			<section id="buttons" className={styles.section}>
				<h2 className={styles.sectionTitle}>Buttons</h2>

				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Button Component</h3>
					<p className={styles.componentPath}>
						<code>src/components/ui/button.tsx</code>
					</p>
					<div className={styles.buttonGrid}>
						<div className={styles.buttonExample}>
							<Button>Default Button</Button>
							<code>{`<Button>Default Button</Button>`}</code>
						</div>
						<div className={styles.buttonExample}>
							<Button className={styles.btnPrimary}>Primary Button</Button>
							<code>{`<Button className={styles.btnPrimary}>`}</code>
						</div>
						<div className={styles.buttonExample}>
							<Button className={styles.btnSecondary}>Secondary Button</Button>
							<code>{`<Button className={styles.btnSecondary}>`}</code>
						</div>
						<div className={styles.buttonExample}>
							<Button disabled>Disabled Button</Button>
							<code>{`<Button disabled>`}</code>
						</div>
					</div>
				</div>

				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Button with Icons</h3>
					<div className={styles.buttonGrid}>
						<div className={styles.buttonExample}>
							<Button className={styles.btnPrimary}>
								<PlusIcon className={styles.btnIcon} />
								Add Item
							</Button>
							<code>{`<PlusIcon /> Add Item`}</code>
						</div>
						<div className={styles.buttonExample}>
							<Button className={styles.btnSecondary}>
								<ArrowPathIcon className={styles.btnIcon} />
								Refresh
							</Button>
							<code>{`<ArrowPathIcon /> Refresh`}</code>
						</div>
						<div className={styles.buttonExample}>
							<button className={styles.iconButton}>
								<ClipboardDocumentIcon className={styles.btnIcon} />
							</button>
							<code>Icon-only button</code>
						</div>
						<div className={styles.buttonExample}>
							<button className={`${styles.iconButton} ${styles.iconButtonCopied}`}>
								<CheckIcon className={styles.btnIcon} />
							</button>
							<code>Copied state</code>
						</div>
					</div>
				</div>

				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Toggle Button Group</h3>
					<div className={styles.toggleGroup}>
						<button className={`${styles.toggleBtn} ${styles.active}`}>Linear</button>
						<button className={styles.toggleBtn}>Radial</button>
					</div>
					<code className={styles.codeNote}>Used for: Gradient type, color format, unit selectors</code>
				</div>
			</section>

			{/* Inputs Section */}
			<section id="inputs" className={styles.section}>
				<h2 className={styles.sectionTitle}>Inputs</h2>

				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Text Input</h3>
					<div className={styles.inputGrid}>
						<div className={styles.inputExample}>
							<label className={styles.inputLabel}>Label</label>
							<input type="text" className={styles.textInput} placeholder="Placeholder text..." />
							<code>@include input-field</code>
						</div>
						<div className={styles.inputExample}>
							<label className={styles.inputLabel}>Hex Color Input</label>
							<input type="text" className={styles.hexInput} defaultValue="#667eea" />
							<code>.hexInput (mono font, uppercase)</code>
						</div>
					</div>
				</div>

				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Number Input</h3>
					<div className={styles.inputGrid}>
						<div className={styles.inputExample}>
							<label className={styles.inputLabel}>Position</label>
							<div className={styles.numberInputWrapper}>
								<input type="number" className={styles.numberInput} defaultValue={50} />
								<span className={styles.unitLabel}>%</span>
							</div>
							<code>.numberInput (centered, no spinners)</code>
						</div>
						<div className={styles.inputExample}>
							<label className={styles.inputLabel}>Pixel Value</label>
							<div className={styles.numberInputWrapper}>
								<input type="number" className={styles.numberInput} defaultValue={16} />
								<span className={styles.unitLabel}>px</span>
							</div>
						</div>
					</div>
				</div>

				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Color Input</h3>
					<div className={styles.inputGrid}>
						<div className={styles.inputExample}>
							<label className={styles.inputLabel}>Color Picker</label>
							<input type="color" className={styles.colorInput} defaultValue="#667eea" />
							<code>.colorInput (40x40)</code>
						</div>
						<div className={styles.inputExample}>
							<label className={styles.inputLabel}>Small Color Picker</label>
							<input type="color" className={styles.colorInputSmall} defaultValue="#22c55e" />
							<code>.colorInputSmall (36x24)</code>
						</div>
					</div>
				</div>

				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Range Slider</h3>
					<div className={styles.sliderExample}>
						<div className={styles.sliderHeader}>
							<label className={styles.inputLabel}>Angle</label>
							<span className={styles.sliderValue}>135°</span>
						</div>
						<input type="range" className={styles.slider} defaultValue={135} min={0} max={360} />
						<code>Custom styled range input with gradient track</code>
					</div>
				</div>

				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Select Dropdown</h3>
					<div className={styles.inputExample}>
						<label className={styles.inputLabel}>Timezone</label>
						<select className={styles.selectInput}>
							<option>UTC</option>
							<option>America/New_York</option>
							<option>Europe/London</option>
							<option>Asia/Tokyo</option>
						</select>
						<code>.selectInput</code>
					</div>
				</div>
			</section>

			{/* Cards Section */}
			<section id="cards" className={styles.section}>
				<h2 className={styles.sectionTitle}>Cards</h2>

				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Glass Card</h3>
					<p className={styles.componentPath}>
						<code>@include glass-card</code>
					</p>
					<div className={styles.cardGrid}>
						<div className={styles.glassCard}>
							<h4 className={styles.cardTitle}>Glass Card</h4>
							<p className={styles.cardDescription}>The primary card style used throughout the application. Features a translucent background with backdrop blur.</p>
						</div>
						<div className={`${styles.glassCard} ${styles.cardHover}`}>
							<h4 className={styles.cardTitle}>Hover State</h4>
							<p className={styles.cardDescription}>Cards can have hover states with increased background opacity and lifted shadow effect.</p>
						</div>
					</div>
				</div>

				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Tool Card</h3>
					<p className={styles.componentPath}>
						<code>src/components/ToolCard/ToolCard.tsx</code>
					</p>
					<div className={styles.cardGrid}>
						<div className={styles.toolCard}>
							<div className={styles.toolCardHeader}>
								<div className={styles.toolCardIcon}>
									<SwatchIcon />
								</div>
								<span className={styles.badgeReady}>Ready</span>
							</div>
							<h4 className={styles.toolCardTitle}>Color Picker</h4>
							<p className={styles.toolCardDescription}>Advanced OKLCH-based color picker with multi-format conversion</p>
							<span className={styles.toolCardCategory}>Color & Design</span>
						</div>
						<div className={`${styles.toolCard} ${styles.toolCardDisabled}`}>
							<div className={styles.toolCardHeader}>
								<div className={styles.toolCardIcon}>
									<PhotoIcon />
								</div>
								<span className={styles.badgeSoon}>Soon</span>
							</div>
							<h4 className={styles.toolCardTitle}>Image Resizer</h4>
							<p className={styles.toolCardDescription}>Resize images to specific dimensions</p>
							<span className={styles.toolCardCategory}>Image & Visual</span>
						</div>
					</div>
				</div>
			</section>

			{/* Badges Section */}
			<section id="badges" className={styles.section}>
				<h2 className={styles.sectionTitle}>Badges</h2>
				<div className={styles.badgeGrid}>
					<div className={styles.badgeExample}>
						<span className={styles.badgeReady}>Ready</span>
						<code>.badgeReady (green)</code>
					</div>
					<div className={styles.badgeExample}>
						<span className={styles.badgeSoon}>Soon</span>
						<code>.badgeSoon (yellow)</code>
					</div>
					<div className={styles.badgeExample}>
						<span className={styles.badgeWcagPass}>AAA</span>
						<code>WCAG Pass (green)</code>
					</div>
					<div className={styles.badgeExample}>
						<span className={styles.badgeWcagFail}>Fail</span>
						<code>WCAG Fail (red)</code>
					</div>
					<div className={styles.badgeExample}>
						<span className={styles.badgeCategory}>Color & Design</span>
						<code>Category badge</code>
					</div>
				</div>
			</section>

			{/* Icons Section */}
			<section id="icons" className={styles.section}>
				<h2 className={styles.sectionTitle}>Icons</h2>
				<p className={styles.componentPath}>
					<code>@heroicons/react/24/outline</code>
				</p>
				<div className={styles.iconGrid}>
					<div className={styles.iconItem}>
						<SwatchIcon />
						<span>SwatchIcon</span>
					</div>
					<div className={styles.iconItem}>
						<DocumentTextIcon />
						<span>DocumentTextIcon</span>
					</div>
					<div className={styles.iconItem}>
						<PhotoIcon />
						<span>PhotoIcon</span>
					</div>
					<div className={styles.iconItem}>
						<CodeBracketIcon />
						<span>CodeBracketIcon</span>
					</div>
					<div className={styles.iconItem}>
						<CalculatorIcon />
						<span>CalculatorIcon</span>
					</div>
					<div className={styles.iconItem}>
						<ClipboardDocumentIcon />
						<span>ClipboardDocumentIcon</span>
					</div>
					<div className={styles.iconItem}>
						<CheckIcon />
						<span>CheckIcon</span>
					</div>
					<div className={styles.iconItem}>
						<ArrowPathIcon />
						<span>ArrowPathIcon</span>
					</div>
					<div className={styles.iconItem}>
						<TrashIcon />
						<span>TrashIcon</span>
					</div>
					<div className={styles.iconItem}>
						<PlusIcon />
						<span>PlusIcon</span>
					</div>
					<div className={styles.iconItem}>
						<SunIcon />
						<span>SunIcon</span>
					</div>
					<div className={styles.iconItem}>
						<MoonIcon />
						<span>MoonIcon</span>
					</div>
					<div className={styles.iconItem}>
						<Bars3Icon />
						<span>Bars3Icon</span>
					</div>
					<div className={styles.iconItem}>
						<XMarkIcon />
						<span>XMarkIcon</span>
					</div>
					<div className={styles.iconItem}>
						<LinkIcon />
						<span>LinkIcon</span>
					</div>
					<div className={styles.iconItem}>
						<ClockIcon />
						<span>ClockIcon</span>
					</div>
					<div className={styles.iconItem}>
						<EyeIcon />
						<span>EyeIcon</span>
					</div>
					<div className={styles.iconItem}>
						<BookmarkIcon />
						<span>BookmarkIcon</span>
					</div>
				</div>
			</section>

			{/* Code Blocks Section */}
			<section id="code" className={styles.section}>
				<h2 className={styles.sectionTitle}>Code Blocks</h2>

				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Code Output Block</h3>
					<div className={styles.codeBlock}>
						<code>background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);</code>
						<button className={styles.copyBtn} onClick={() => copyToClipboard("background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);", "code1")}>
							{copiedItem === "code1" ? <CheckIcon className={styles.btnIcon} /> : <ClipboardDocumentIcon className={styles.btnIcon} />}
						</button>
					</div>
					<code className={styles.codeNote}>.codeBlock with copy button</code>
				</div>

				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Inline Code</h3>
					<p>
						Use the <code className={styles.inlineCode}>$color-primary</code> variable for the main brand color.
					</p>
				</div>
			</section>

			{/* Common Patterns Section */}
			<section id="patterns" className={styles.section}>
				<h2 className={styles.sectionTitle}>Common Patterns</h2>

				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Section Header with Action</h3>
					<div className={styles.glassCard}>
						<div className={styles.sectionHeader}>
							<h4 className={styles.cardTitle}>Color Stops</h4>
							<Button className={styles.btnPrimary}>
								<PlusIcon className={styles.btnIcon} />
								Add
							</Button>
						</div>
						<p className={styles.cardDescription}>Content goes here...</p>
					</div>
				</div>

				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Control Row</h3>
					<div className={styles.glassCard}>
						<div className={styles.controlRow}>
							<label className={styles.controlLabel}>X Offset</label>
							<input type="range" className={styles.slider} defaultValue={5} min={-50} max={50} />
							<span className={styles.controlValue}>5px</span>
						</div>
						<div className={styles.controlRow}>
							<label className={styles.controlLabel}>Y Offset</label>
							<input type="range" className={styles.slider} defaultValue={10} min={-50} max={50} />
							<span className={styles.controlValue}>10px</span>
						</div>
					</div>
					<code className={styles.codeNote}>Grid: 70px label | 1fr slider | 60px value</code>
				</div>

				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Info Box / Note</h3>
					<div className={styles.noteBox}>
						<p>
							<strong>Tip:</strong> Click on the gradient slider to add color stops. Drag stops to reposition them, or drag outside the slider to remove them.
						</p>
					</div>
				</div>

				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Preset Grid</h3>
					<div className={styles.presetGrid}>
						<button className={styles.presetBtn} style={{ background: "linear-gradient(135deg, #ff6b6b, #feca57)" }}>
							<span className={styles.presetName}>Sunset</span>
						</button>
						<button className={styles.presetBtn} style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}>
							<span className={styles.presetName}>Ocean</span>
						</button>
						<button className={styles.presetBtn} style={{ background: "linear-gradient(135deg, #11998e, #38ef7d)" }}>
							<span className={styles.presetName}>Forest</span>
						</button>
						<button className={styles.presetBtn} style={{ background: "linear-gradient(135deg, #f12711, #f5af19)" }}>
							<span className={styles.presetName}>Fire</span>
						</button>
					</div>
				</div>

				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Responsive Breakpoints</h3>
					<div className={styles.breakpointList}>
						<div className={styles.breakpointItem}>
							<code>&lt; 480px</code>
							<span>Small mobile</span>
						</div>
						<div className={styles.breakpointItem}>
							<code>480px - 768px</code>
							<span>Mobile / Tablet</span>
						</div>
						<div className={styles.breakpointItem}>
							<code>768px - 1024px</code>
							<span>Tablet / Small Desktop</span>
						</div>
						<div className={styles.breakpointItem}>
							<code>1024px+</code>
							<span>Desktop</span>
						</div>
						<div className={styles.breakpointItem}>
							<code>&gt; 1400px</code>
							<span>Large Desktop</span>
						</div>
					</div>
				</div>

				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Transitions</h3>
					<div className={styles.transitionList}>
						<div className={styles.transitionItem}>
							<code>$transition-fast</code>
							<span>0.15s ease-in-out</span>
						</div>
						<div className={styles.transitionItem}>
							<code>$transition-base</code>
							<span>0.2s ease-in-out</span>
						</div>
						<div className={styles.transitionItem}>
							<code>$transition-slow</code>
							<span>0.3s ease-in-out</span>
						</div>
					</div>
				</div>

				<div className={styles.subsection}>
					<h3 className={styles.subsectionTitle}>Z-Index Scale</h3>
					<div className={styles.zIndexList}>
						<div className={styles.zIndexItem}>
							<code>$z-base</code>
							<span>1</span>
						</div>
						<div className={styles.zIndexItem}>
							<code>$z-dropdown</code>
							<span>1000</span>
						</div>
						<div className={styles.zIndexItem}>
							<code>$z-sticky</code>
							<span>1020</span>
						</div>
						<div className={styles.zIndexItem}>
							<code>$z-fixed</code>
							<span>1030</span>
						</div>
						<div className={styles.zIndexItem}>
							<code>$z-modal-backdrop</code>
							<span>1040</span>
						</div>
						<div className={styles.zIndexItem}>
							<code>$z-modal</code>
							<span>1050</span>
						</div>
						<div className={styles.zIndexItem}>
							<code>$z-popover</code>
							<span>1060</span>
						</div>
						<div className={styles.zIndexItem}>
							<code>$z-tooltip</code>
							<span>1070</span>
						</div>
					</div>
				</div>
			</section>

			{/* File Locations */}
			<section id="files" className={styles.section}>
				<h2 className={styles.sectionTitle}>File Locations</h2>

				<div className={styles.fileList}>
					<h3 className={styles.subsectionTitle}>Style Files</h3>
					<ul>
						<li>
							<code>src/styles/_variables.scss</code> - All SCSS variables
						</li>
						<li>
							<code>src/styles/_mixins.scss</code> - Reusable mixins
						</li>
						<li>
							<code>src/styles/globals.css</code> - Global CSS & theme definitions
						</li>
					</ul>

					<h3 className={styles.subsectionTitle}>Core Components</h3>
					<ul>
						<li>
							<code>src/components/ui/button.tsx</code> - Button primitive
						</li>
						<li>
							<code>src/components/AppLayout/</code> - Main layout wrapper
						</li>
						<li>
							<code>src/components/Sidebar/</code> - Navigation sidebar
						</li>
						<li>
							<code>src/components/TopBar/</code> - Header with theme toggle
						</li>
						<li>
							<code>src/components/ToolCard/</code> - Tool preview cards
						</li>
						<li>
							<code>src/components/ToolLayout/</code> - Tool page wrapper
						</li>
					</ul>

					<h3 className={styles.subsectionTitle}>Feature Components</h3>
					<ul>
						<li>
							<code>src/features/color-picker/</code>
						</li>
						<li>
							<code>src/features/gradient-generator/</code>
						</li>
						<li>
							<code>src/features/box-shadow-generator/</code>
						</li>
						<li>
							<code>src/features/border-radius-generator/</code>
						</li>
						<li>
							<code>src/features/cubic-bezier/</code>
						</li>
						<li>
							<code>src/features/epoch-converter/</code>
						</li>
						<li>
							<code>src/features/px-rem-calculator/</code>
						</li>
						<li>
							<code>src/features/html-entities/</code>
						</li>
						<li>
							<code>src/features/invisible-character-remover/</code>
						</li>
					</ul>
				</div>
			</section>
		</div>
	);
}
