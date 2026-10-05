import Link from "next/link";
import LandingHero from "./LandingHero";
import CategoryIndex from "./CategoryIndex";
import styles from "./Landing.module.scss";

/** bittbott.dev front door: generative terminal hero, category index, privacy statement. */
export default function LandingPage() {
	return (
		<div className={styles.landing}>
			<LandingHero />
			<CategoryIndex />

			<section className={styles.manifesto} aria-label="Privacy">
				<div className="mx-auto grid max-w-[1180px] gap-[22px]">
					<p className={styles.big}>
						Paste a JWT, a photo, a password. <span className={styles.highlight}>It stays on your machine.</span>
					</p>
					<p className={styles.small}>Every tool runs inside your browser tab. There is nothing to upload and no account to make.</p>
					<Link href="/tools" className={`justify-self-start ${styles.cta}`}>
						All tools
					</Link>
				</div>
			</section>

			<footer className={styles.footer}>
				<div className="mx-auto flex max-w-[1180px] flex-wrap justify-between gap-3">
					<span>bittbott.dev</span>
					<span>Free tools that run in your browser.</span>
				</div>
			</footer>
		</div>
	);
}
