// import { TOOLS_REGISTRY, CATEGORIES } from "@/config/tools-registry";
import { SparklesIcon, RocketLaunchIcon, BeakerIcon } from "@heroicons/react/24/outline";
import styles from "./page.module.scss";

export default function HomePage() {
	// const totalTools = TOOLS_REGISTRY.length;
	// const implementedTools = TOOLS_REGISTRY.filter((tool) => tool.implemented).length;
	// const categories = Object.keys(CATEGORIES).length;

	return (
		<div className={styles.container}>
			<section className={styles.hero}>
				<div className={styles.heroContent}>
					<h1 className={styles.title}>
						<SparklesIcon className={styles.titleIcon} />
						Welcome to Web Tools
					</h1>
					<p className={styles.subtitle}>A collection of free, browser-based tools for developers and designers. Choose a tool from the sidebar to get started.</p>
				</div>

				{/* <div className={styles.statsGrid}>
					<div className={styles.statCard}>
						<div className={styles.statIcon}>
							<BeakerIcon />
						</div>
						<div className={styles.statContent}>
							<span className={styles.statNumber}>{totalTools}</span>
							<span className={styles.statLabel}>Total Tools</span>
						</div>
					</div>

					<div className={styles.statCard}>
						<div className={styles.statIcon}>
							<RocketLaunchIcon />
						</div>
						<div className={styles.statContent}>
							<span className={styles.statNumber}>{implementedTools}</span>
							<span className={styles.statLabel}>Ready to Use</span>
						</div>
					</div>

					<div className={styles.statCard}>
						<div className={styles.statIcon}>
							<SparklesIcon />
						</div>
						<div className={styles.statContent}>
							<span className={styles.statNumber}>{categories}</span>
							<span className={styles.statLabel}>Categories</span>
						</div>
					</div>
				</div> */}
			</section>

			{/* <section className={styles.features}>
				<h2 className={styles.featuresTitle}>Features</h2>
				<div className={styles.featuresGrid}>
					<div className={styles.featureCard}>
						<h3>🎨 Design Tools</h3>
						<p>Color pickers, gradient generators, CSS utilities and more</p>
					</div>
					<div className={styles.featureCard}>
						<h3>📊 Data Processing</h3>
						<p>JSON formatters, CSV converters, text utilities</p>
					</div>
					<div className={styles.featureCard}>
						<h3>🖼️ Image Tools</h3>
						<p>Image converters, QR code generators, and processors</p>
					</div>
					<div className={styles.featureCard}>
						<h3>🔧 Developer Utilities</h3>
						<p>JWT decoders, encoders, and web development helpers</p>
					</div>
					<div className={styles.featureCard}>
						<h3>⚡ Fast & Private</h3>
						<p>All tools run locally in your browser</p>
					</div>
					<div className={styles.featureCard}>
						<h3>🆓 Free Forever</h3>
						<p>No registration, no payments, no limits</p>
					</div>
				</div>
			</section>

			<section className={styles.getStarted}>
				<h2>☄️ Incoming</h2>
				<p>What you see in the sidebar is what currently exists, but there is more on the roadmap... Bookmark and Stay Tuned for additional tools!</p>
			</section> */}
		</div>
	);
}
