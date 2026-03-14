"use client";

import { useState } from "react";
import styles from "./ClothingSizeConverter.module.scss";

interface Category {
	id: string;
	name: string;
}

const CATEGORIES: Category[] = [
	{ id: "mens_shoes", name: "Men's Shoes" },
	{ id: "womens_shoes", name: "Women's Shoes" },
	{ id: "mens_shirts", name: "Men's Shirts" },
	{ id: "womens_tops", name: "Women's Tops" },
	{ id: "mens_pants", name: "Men's Pants" },
	{ id: "rings", name: "Rings" },
];

const MENS_SHOES = [
	{ us: "6", uk: "5.5", eu: "39", cm: "24" },
	{ us: "7", uk: "6.5", eu: "40", cm: "25" },
	{ us: "8", uk: "7.5", eu: "41", cm: "26" },
	{ us: "9", uk: "8.5", eu: "42.5", cm: "27" },
	{ us: "10", uk: "9.5", eu: "43.5", cm: "28" },
	{ us: "11", uk: "10.5", eu: "44.5", cm: "29" },
	{ us: "12", uk: "11.5", eu: "46", cm: "30" },
	{ us: "13", uk: "12.5", eu: "47.5", cm: "31" },
];

const WOMENS_SHOES = [
	{ us: "5", uk: "3", eu: "35.5", cm: "22" },
	{ us: "6", uk: "4", eu: "36.5", cm: "23" },
	{ us: "7", uk: "5", eu: "37.5", cm: "24" },
	{ us: "8", uk: "6", eu: "38.5", cm: "25" },
	{ us: "9", uk: "7", eu: "40", cm: "26" },
	{ us: "10", uk: "8", eu: "41", cm: "27" },
	{ us: "11", uk: "9", eu: "42", cm: "28" },
];

const MENS_SHIRTS = [
	{ us: "XS", uk: "XS", eu: "44", neck: "14\"" },
	{ us: "S", uk: "S", eu: "46", neck: "14.5-15\"" },
	{ us: "M", uk: "M", eu: "48-50", neck: "15.5-16\"" },
	{ us: "L", uk: "L", eu: "52-54", neck: "16.5-17\"" },
	{ us: "XL", uk: "XL", eu: "56-58", neck: "17.5-18\"" },
	{ us: "XXL", uk: "XXL", eu: "60-62", neck: "18.5-19\"" },
];

const WOMENS_TOPS = [
	{ us: "XS (0-2)", uk: "6-8", eu: "32-34", bust: "30-32\"" },
	{ us: "S (4-6)", uk: "10-12", eu: "36-38", bust: "33-34\"" },
	{ us: "M (8-10)", uk: "14-16", eu: "40-42", bust: "35-36\"" },
	{ us: "L (12-14)", uk: "18-20", eu: "44-46", bust: "37-39\"" },
	{ us: "XL (16-18)", uk: "22-24", eu: "48-50", bust: "40-42\"" },
	{ us: "XXL (20-22)", uk: "26-28", eu: "52-54", bust: "43-45\"" },
];

const MENS_PANTS = [
	{ us: "28", uk: "28", eu: "44", waist: "28\"" },
	{ us: "30", uk: "30", eu: "46", waist: "30\"" },
	{ us: "32", uk: "32", eu: "48", waist: "32\"" },
	{ us: "34", uk: "34", eu: "50", waist: "34\"" },
	{ us: "36", uk: "36", eu: "52", waist: "36\"" },
	{ us: "38", uk: "38", eu: "54", waist: "38\"" },
	{ us: "40", uk: "40", eu: "56", waist: "40\"" },
];

const RING_SIZES = [
	{ us: "5", uk: "J½", eu: "49", diameter: "15.7 mm" },
	{ us: "6", uk: "L½", eu: "51.5", diameter: "16.5 mm" },
	{ us: "7", uk: "N½", eu: "54", diameter: "17.3 mm" },
	{ us: "8", uk: "P½", eu: "57", diameter: "18.1 mm" },
	{ us: "9", uk: "R½", eu: "59", diameter: "19 mm" },
	{ us: "10", uk: "T½", eu: "62", diameter: "19.8 mm" },
	{ us: "11", uk: "V½", eu: "64", diameter: "20.6 mm" },
	{ us: "12", uk: "X½", eu: "67", diameter: "21.4 mm" },
];

function getTableData(category: string) {
	switch (category) {
		case "mens_shoes":
			return { data: MENS_SHOES, columns: ["US", "UK", "EU", "CM"] as const, keys: ["us", "uk", "eu", "cm"] as const };
		case "womens_shoes":
			return { data: WOMENS_SHOES, columns: ["US", "UK", "EU", "CM"] as const, keys: ["us", "uk", "eu", "cm"] as const };
		case "mens_shirts":
			return { data: MENS_SHIRTS, columns: ["US", "UK", "EU", "Neck"] as const, keys: ["us", "uk", "eu", "neck"] as const };
		case "womens_tops":
			return { data: WOMENS_TOPS, columns: ["US", "UK", "EU", "Bust"] as const, keys: ["us", "uk", "eu", "bust"] as const };
		case "mens_pants":
			return { data: MENS_PANTS, columns: ["US", "UK", "EU", "Waist"] as const, keys: ["us", "uk", "eu", "waist"] as const };
		case "rings":
			return { data: RING_SIZES, columns: ["US", "UK", "EU", "Diameter"] as const, keys: ["us", "uk", "eu", "diameter"] as const };
		default:
			return { data: MENS_SHOES, columns: ["US", "UK", "EU", "CM"] as const, keys: ["us", "uk", "eu", "cm"] as const };
	}
}

export default function ClothingSizeConverter() {
	const [category, setCategory] = useState<string>("mens_shoes");

	const { data, columns, keys } = getTableData(category);

	return (
		<div className={styles.container}>
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>Clothing Size Converter</h2>

				<div className={styles.categoryTabs}>
					{CATEGORIES.map((cat) => (
						<button
							key={cat.id}
							className={`${styles.categoryTab} ${category === cat.id ? styles.activeTab : ""}`}
							onClick={() => setCategory(cat.id)}
						>
							{cat.name}
						</button>
					))}
				</div>

				<div className={styles.tableWrapper}>
					<table className={styles.referenceTable}>
						<thead>
							<tr>
								{columns.map((col) => (
									<th key={col}>{col}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{data.map((row, i) => (
								<tr key={i}>
									{keys.map((key) => (
										<td key={key}>{(row as Record<string, string>)[key]}</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Sizing Tips</h3>
				<div className={styles.tipsGrid}>
					<div className={styles.tipCard}>
						<h4>Shoe Sizing</h4>
						<p>Measure feet at the end of the day when they&apos;re largest. Stand while measuring for the most accurate fit.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Brand Variation</h4>
						<p>Sizes vary between brands. Always check the brand&apos;s specific size chart when ordering online.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Between Sizes</h4>
						<p>If you&apos;re between sizes, size up for comfort. For shoes, your toes should have about a thumb&apos;s width of space.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Ring Sizing</h4>
						<p>Measure your finger at room temperature. Cold fingers are smaller, warm fingers are larger. Measure 3-4 times for accuracy.</p>
					</div>
				</div>
			</div>
		</div>
	);
}
