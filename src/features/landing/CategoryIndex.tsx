import Link from "next/link";
import { LANDING_CATEGORIES, LANDING_TOOLS } from "./terminalCommands";
import styles from "./Landing.module.scss";

const SAMPLES_PER_CATEGORY = 3;

/** Every category with its count, description and a few sample tools. */
export default function CategoryIndex() {
	return (
		<section className={styles.index} aria-labelledby="landing-index-heading">
			<div className="mx-auto max-w-[1180px]">
				<h2 id="landing-index-heading" className={styles.display}>
					The toolbox
				</h2>
				<p className={styles.lede}>
					{LANDING_CATEGORIES.length} categories, {LANDING_TOOLS.length} tools, all free. Pick a drawer or search from the prompt above.
				</p>
				<div className="mt-[clamp(32px,5vw,56px)] grid grid-cols-1 gap-x-16 gap-y-7 md:grid-cols-2">
					{LANDING_CATEGORIES.filter((c) => c.tools.length).map((c) => (
						<article key={c.id} className={`grid min-w-0 grid-cols-[3.2ch_1fr] gap-x-4 pt-4 ${styles.category}`}>
							<span className={styles.categoryCount} aria-hidden="true">
								{String(c.tools.length).padStart(2, "0")}
							</span>
							<div className="min-w-0">
								<h3 className={styles.categoryName}>
									<Link href="/tools">{c.name}</Link>
								</h3>
								<p className={styles.categoryDesc}>{c.description}</p>
								<p className={`mt-2.5 flex min-w-0 flex-wrap gap-x-3.5 gap-y-1 ${styles.categoryTools}`}>
									{c.tools.slice(0, SAMPLES_PER_CATEGORY).map((t) => (
										<Link key={t.id} href={t.route}>
											{t.name}
										</Link>
									))}
									{c.tools.length > SAMPLES_PER_CATEGORY && (
										<Link href="/tools" className={styles.more}>
											+{c.tools.length - SAMPLES_PER_CATEGORY} more
										</Link>
									)}
								</p>
							</div>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}
