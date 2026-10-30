"use client";

import { useState, useCallback } from "react";
import { ArrowsRightLeftIcon, ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";
import styles from "./KitchenConverter.module.scss";

// Conversion types
type ConversionCategory = "volume" | "weight" | "temperature";

interface ConversionUnit {
	id: string;
	name: string;
	abbrev: string;
	toBase: (value: number) => number; // Convert to base unit (ml for volume, g for weight, celsius for temp)
	fromBase: (value: number) => number; // Convert from base unit
}

// Volume units (base: milliliters)
const VOLUME_UNITS: ConversionUnit[] = [
	{ id: "ml", name: "Milliliters", abbrev: "ml", toBase: (v) => v, fromBase: (v) => v },
	{ id: "l", name: "Liters", abbrev: "L", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
	{ id: "tsp", name: "Teaspoons", abbrev: "tsp", toBase: (v) => v * 4.92892, fromBase: (v) => v / 4.92892 },
	{ id: "tbsp", name: "Tablespoons", abbrev: "tbsp", toBase: (v) => v * 14.7868, fromBase: (v) => v / 14.7868 },
	{ id: "floz", name: "Fluid Ounces", abbrev: "fl oz", toBase: (v) => v * 29.5735, fromBase: (v) => v / 29.5735 },
	{ id: "cup", name: "Cups", abbrev: "cup", toBase: (v) => v * 236.588, fromBase: (v) => v / 236.588 },
	{ id: "pint", name: "Pints", abbrev: "pt", toBase: (v) => v * 473.176, fromBase: (v) => v / 473.176 },
	{ id: "quart", name: "Quarts", abbrev: "qt", toBase: (v) => v * 946.353, fromBase: (v) => v / 946.353 },
	{ id: "gallon", name: "Gallons", abbrev: "gal", toBase: (v) => v * 3785.41, fromBase: (v) => v / 3785.41 },
];

// Weight units (base: grams)
const WEIGHT_UNITS: ConversionUnit[] = [
	{ id: "g", name: "Grams", abbrev: "g", toBase: (v) => v, fromBase: (v) => v },
	{ id: "kg", name: "Kilograms", abbrev: "kg", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
	{ id: "oz", name: "Ounces", abbrev: "oz", toBase: (v) => v * 28.3495, fromBase: (v) => v / 28.3495 },
	{ id: "lb", name: "Pounds", abbrev: "lb", toBase: (v) => v * 453.592, fromBase: (v) => v / 453.592 },
];

// Temperature units (base: celsius)
const TEMP_UNITS: ConversionUnit[] = [
	{ id: "c", name: "Celsius", abbrev: "°C", toBase: (v) => v, fromBase: (v) => v },
	{ id: "f", name: "Fahrenheit", abbrev: "°F", toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
];

// Reference chart data
const VOLUME_REFERENCE = [
	{ imperial: "1 teaspoon", metric: "5 ml" },
	{ imperial: "1 tablespoon", metric: "15 ml" },
	{ imperial: "1 fluid ounce", metric: "30 ml" },
	{ imperial: "¼ cup", metric: "60 ml" },
	{ imperial: "⅓ cup", metric: "80 ml" },
	{ imperial: "½ cup", metric: "120 ml" },
	{ imperial: "⅔ cup", metric: "160 ml" },
	{ imperial: "¾ cup", metric: "180 ml" },
	{ imperial: "1 cup", metric: "240 ml" },
	{ imperial: "1 pint (2 cups)", metric: "475 ml" },
	{ imperial: "1 quart (4 cups)", metric: "950 ml" },
	{ imperial: "1 gallon (16 cups)", metric: "3.8 L" },
];

const WEIGHT_REFERENCE = [
	{ imperial: "½ oz", metric: "15 g" },
	{ imperial: "1 oz", metric: "30 g" },
	{ imperial: "2 oz", metric: "55 g" },
	{ imperial: "3 oz", metric: "85 g" },
	{ imperial: "4 oz (¼ lb)", metric: "115 g" },
	{ imperial: "6 oz", metric: "170 g" },
	{ imperial: "8 oz (½ lb)", metric: "225 g" },
	{ imperial: "12 oz (¾ lb)", metric: "340 g" },
	{ imperial: "16 oz (1 lb)", metric: "455 g" },
	{ imperial: "2 lb", metric: "910 g" },
];

const TEMP_REFERENCE = [
	{ fahrenheit: "250°F", celsius: "120°C", description: "Very Low" },
	{ fahrenheit: "275°F", celsius: "135°C", description: "Low" },
	{ fahrenheit: "300°F", celsius: "150°C", description: "Low" },
	{ fahrenheit: "325°F", celsius: "165°C", description: "Moderately Low" },
	{ fahrenheit: "350°F", celsius: "175°C", description: "Moderate" },
	{ fahrenheit: "375°F", celsius: "190°C", description: "Moderate" },
	{ fahrenheit: "400°F", celsius: "200°C", description: "Moderately Hot" },
	{ fahrenheit: "425°F", celsius: "220°C", description: "Hot" },
	{ fahrenheit: "450°F", celsius: "230°C", description: "Hot" },
	{ fahrenheit: "475°F", celsius: "245°C", description: "Very Hot" },
	{ fahrenheit: "500°F", celsius: "260°C", description: "Extremely Hot" },
];

const BUTTER_REFERENCE = [
	{ sticks: "¼ stick", tbsp: "2 tbsp", cups: "⅛ cup", grams: "28 g", oz: "1 oz" },
	{ sticks: "½ stick", tbsp: "4 tbsp", cups: "¼ cup", grams: "57 g", oz: "2 oz" },
	{ sticks: "1 stick", tbsp: "8 tbsp", cups: "½ cup", grams: "113 g", oz: "4 oz" },
	{ sticks: "1½ sticks", tbsp: "12 tbsp", cups: "¾ cup", grams: "170 g", oz: "6 oz" },
	{ sticks: "2 sticks", tbsp: "16 tbsp", cups: "1 cup", grams: "227 g", oz: "8 oz" },
];

const COMMON_INGREDIENTS = [
	{ ingredient: "All-purpose flour", cups: "1 cup", grams: "125 g" },
	{ ingredient: "Bread flour", cups: "1 cup", grams: "130 g" },
	{ ingredient: "Cake flour", cups: "1 cup", grams: "115 g" },
	{ ingredient: "Granulated sugar", cups: "1 cup", grams: "200 g" },
	{ ingredient: "Packed brown sugar", cups: "1 cup", grams: "220 g" },
	{ ingredient: "Powdered sugar", cups: "1 cup", grams: "120 g" },
	{ ingredient: "Butter", cups: "1 cup", grams: "227 g" },
	{ ingredient: "Honey/Maple syrup", cups: "1 cup", grams: "340 g" },
	{ ingredient: "Milk", cups: "1 cup", grams: "245 g" },
	{ ingredient: "Heavy cream", cups: "1 cup", grams: "240 g" },
	{ ingredient: "Cocoa powder", cups: "1 cup", grams: "85 g" },
	{ ingredient: "Rolled oats", cups: "1 cup", grams: "90 g" },
	{ ingredient: "Rice (uncooked)", cups: "1 cup", grams: "185 g" },
	{ ingredient: "Shredded cheese", cups: "1 cup", grams: "115 g" },
];

function formatNumber(num: number): string {
	if (num === 0) return "0";
	if (Math.abs(num) < 0.01) return num.toExponential(2);
	if (Math.abs(num) >= 10000) return num.toLocaleString(undefined, { maximumFractionDigits: 1 });
	if (Number.isInteger(num)) return num.toString();
	return num.toFixed(Math.abs(num) < 1 ? 3 : 2).replace(/\.?0+$/, "");
}

export default function KitchenConverter() {
	const [category, setCategory] = useState<ConversionCategory>("volume");
	const [fromUnit, setFromUnit] = useState<string>("cup");
	const [toUnit, setToUnit] = useState<string>("ml");
	const [inputValue, setInputValue] = useState<string>("1");
	const [copiedCell, setCopiedCell] = useState<string | null>(null);

	const getUnits = useCallback(() => {
		switch (category) {
			case "volume":
				return VOLUME_UNITS;
			case "weight":
				return WEIGHT_UNITS;
			case "temperature":
				return TEMP_UNITS;
		}
	}, [category]);

	const convert = useCallback(() => {
		const value = parseFloat(inputValue);
		if (isNaN(value)) return "";

		const units = getUnits();
		const from = units.find((u) => u.id === fromUnit);
		const to = units.find((u) => u.id === toUnit);

		if (!from || !to) return "";

		const baseValue = from.toBase(value);
		const result = to.fromBase(baseValue);

		return formatNumber(result);
	}, [inputValue, fromUnit, toUnit, getUnits]);

	const swapUnits = () => {
		const temp = fromUnit;
		setFromUnit(toUnit);
		setToUnit(temp);
	};

	const handleCategoryChange = (newCategory: ConversionCategory) => {
		setCategory(newCategory);
		// Set default units for each category
		switch (newCategory) {
			case "volume":
				setFromUnit("cup");
				setToUnit("ml");
				break;
			case "weight":
				setFromUnit("oz");
				setToUnit("g");
				break;
			case "temperature":
				setFromUnit("f");
				setToUnit("c");
				break;
		}
		setInputValue("1");
	};

	const copyToClipboard = async (text: string, cellId: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedCell(cellId);
			setTimeout(() => setCopiedCell(null), 1500);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const units = getUnits();
	const result = convert();

	return (
		<div className={styles.container}>
			{/* Converter Section */}
			<div className={`mb-6 ${styles.glassCard}`}>
				<h2 className={styles.sectionTitle}>Measurement Converter</h2>

				{/* Category Tabs */}
				<div className={`flex gap-2 mb-6 p-1 w-fit ${styles.categoryTabs}`}>
					<button className={`text-sm font-medium ${styles.categoryTab} ${category === "volume" ? styles.active : ""}`} onClick={() => handleCategoryChange("volume")}>
						Volume
					</button>
					<button className={`text-sm font-medium ${styles.categoryTab} ${category === "weight" ? styles.active : ""}`} onClick={() => handleCategoryChange("weight")}>
						Weight
					</button>
					<button className={`text-sm font-medium ${styles.categoryTab} ${category === "temperature" ? styles.active : ""}`} onClick={() => handleCategoryChange("temperature")}>
						Temperature
					</button>
				</div>

				{/* Converter Interface */}
				<div className={`grid grid-cols-[1fr_auto_1fr] gap-4 items-end ${styles.converterGrid}`}>
					<div className={`flex flex-col gap-2 ${styles.converterInput}`}>
						<label className={`text-xs font-semibold uppercase ${styles.inputLabel}`}>From</label>
						<div className={`flex gap-2 ${styles.inputRow}`}>
							<input type="number" inputMode="decimal" value={inputValue} onChange={(e) => setInputValue(e.target.value)} className={`flex-1 text-xl font-semibold ${styles.numberInput}`} placeholder="Enter value" />
							<select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)} className={`text-sm ${styles.unitSelect}`}>
								{units.map((unit) => (
									<option key={unit.id} value={unit.id}>
										{unit.name} ({unit.abbrev})
									</option>
								))}
							</select>
						</div>
					</div>

					<button className={`flex items-center justify-center self-end ${styles.swapButton}`} onClick={swapUnits} title="Swap units">
						<ArrowsRightLeftIcon className="w-5 h-5" />
					</button>

					<div className={`flex flex-col gap-2 ${styles.converterInput}`}>
						<label className={`text-xs font-semibold uppercase ${styles.inputLabel}`}>To</label>
						<div className={`flex gap-2 ${styles.inputRow}`}>
							<div className={`flex-1 flex items-center text-xl font-semibold cursor-not-allowed ${styles.resultDisplay}`}>{result || "—"}</div>
							<select value={toUnit} onChange={(e) => setToUnit(e.target.value)} className={`text-sm ${styles.unitSelect}`}>
								{units.map((unit) => (
									<option key={unit.id} value={unit.id}>
										{unit.name} ({unit.abbrev})
									</option>
								))}
							</select>
						</div>
					</div>
				</div>

				{result && (
					<div className={`flex items-center justify-center gap-3 mt-6 p-4 ${styles.resultSummary}`}>
						<span className={styles.resultText}>
							{inputValue} {units.find((u) => u.id === fromUnit)?.abbrev} = <strong>{result} {units.find((u) => u.id === toUnit)?.abbrev}</strong>
						</span>
						<button className={`${styles.copyBtn} ${copiedCell === "result" ? styles.copied : ""}`} onClick={() => copyToClipboard(`${result} ${units.find((u) => u.id === toUnit)?.abbrev}`, "result")} title="Copy to clipboard">
							{copiedCell === "result" ? <CheckIcon className={styles.copyIcon} /> : <ClipboardDocumentIcon className={styles.copyIcon} />}
						</button>
					</div>
				)}
			</div>

			{/* Reference Charts */}
			<div className={`grid grid-cols-2 gap-6 ${styles.chartsGrid}`}>
				{/* Volume Reference */}
				<div className={`mb-6 ${styles.glassCard}`}>
					<h3 className={`text-base font-semibold ${styles.chartTitle}`}>Volume Conversions</h3>
					<div className="overflow-x-auto">
						<table className={`w-full text-sm ${styles.referenceTable}`}>
							<thead>
								<tr>
									<th>Imperial</th>
									<th>Metric</th>
								</tr>
							</thead>
							<tbody>
								{VOLUME_REFERENCE.map((row, i) => (
									<tr key={i}>
										<td>{row.imperial}</td>
										<td className={`relative font-medium cursor-pointer ${styles.clickableCell}`} onClick={() => copyToClipboard(row.metric, `vol-${i}`)}>
											{row.metric}
											{copiedCell === `vol-${i}` && <CheckIcon className={styles.copiedIcon} />}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* Weight Reference */}
				<div className={`mb-6 ${styles.glassCard}`}>
					<h3 className={`text-base font-semibold ${styles.chartTitle}`}>Weight Conversions</h3>
					<div className="overflow-x-auto">
						<table className={`w-full text-sm ${styles.referenceTable}`}>
							<thead>
								<tr>
									<th>Imperial</th>
									<th>Metric</th>
								</tr>
							</thead>
							<tbody>
								{WEIGHT_REFERENCE.map((row, i) => (
									<tr key={i}>
										<td>{row.imperial}</td>
										<td className={`relative font-medium cursor-pointer ${styles.clickableCell}`} onClick={() => copyToClipboard(row.metric, `wt-${i}`)}>
											{row.metric}
											{copiedCell === `wt-${i}` && <CheckIcon className={styles.copiedIcon} />}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* Temperature Reference */}
				<div className={`mb-6 ${styles.glassCard}`}>
					<h3 className={`text-base font-semibold ${styles.chartTitle}`}>Oven Temperatures</h3>
					<div className="overflow-x-auto">
						<table className={`w-full text-sm ${styles.referenceTable}`}>
							<thead>
								<tr>
									<th>Fahrenheit</th>
									<th>Celsius</th>
									<th>Heat</th>
								</tr>
							</thead>
							<tbody>
								{TEMP_REFERENCE.map((row, i) => (
									<tr key={i}>
										<td>{row.fahrenheit}</td>
										<td className={`relative font-medium cursor-pointer ${styles.clickableCell}`} onClick={() => copyToClipboard(row.celsius, `temp-${i}`)}>
											{row.celsius}
											{copiedCell === `temp-${i}` && <CheckIcon className={styles.copiedIcon} />}
										</td>
										<td className={`text-sm ${styles.mutedCell}`}>{row.description}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* Butter Reference */}
				<div className={`mb-6 ${styles.glassCard}`}>
					<h3 className={`text-base font-semibold ${styles.chartTitle}`}>Butter Measurements</h3>
					<div className="overflow-x-auto">
						<table className={`w-full text-sm ${styles.referenceTable}`}>
							<thead>
								<tr>
									<th>Sticks</th>
									<th>Tbsp</th>
									<th>Cups</th>
									<th>Grams</th>
								</tr>
							</thead>
							<tbody>
								{BUTTER_REFERENCE.map((row, i) => (
									<tr key={i}>
										<td>{row.sticks}</td>
										<td>{row.tbsp}</td>
										<td>{row.cups}</td>
										<td className={`relative font-medium cursor-pointer ${styles.clickableCell}`} onClick={() => copyToClipboard(row.grams, `butter-${i}`)}>
											{row.grams}
											{copiedCell === `butter-${i}` && <CheckIcon className={styles.copiedIcon} />}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* Common Ingredients */}
			<div className={`mb-6 ${styles.glassCard}`}>
				<h3 className={`text-base font-semibold ${styles.chartTitle}`}>Common Ingredient Weights</h3>
				<p className={`text-sm ${styles.chartSubtitle}`}>Weight equivalents for 1 cup of common baking ingredients</p>
				<div className={`grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 ${styles.ingredientsGrid}`}>
					{COMMON_INGREDIENTS.map((item, i) => (
						<div key={i} className={`flex flex-col gap-1 relative cursor-pointer ${styles.ingredientCard}`} onClick={() => copyToClipboard(item.grams, `ing-${i}`)}>
							<span className={`text-sm font-medium ${styles.ingredientName}`}>{item.ingredient}</span>
							<span className={`text-xs ${styles.ingredientValue}`}>
								{item.cups} = <strong>{item.grams}</strong>
							</span>
							{copiedCell === `ing-${i}` && <CheckIcon className={`absolute top-2 right-2 w-4 h-4 ${styles.ingredientCopied}`} />}
						</div>
					))}
				</div>
			</div>

			{/* Tips */}
			<div className={`mb-6 ${styles.glassCard}`}>
				<h3 className={`text-base font-semibold ${styles.chartTitle}`}>Quick Tips</h3>
				<div className={`grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 ${styles.tipsGrid}`}>
					<div className={`p-4 ${styles.tipCard}`}>
						<h4>Measuring Liquids</h4>
						<p>Use a liquid measuring cup placed on a flat surface. Read at eye level for accuracy.</p>
					</div>
					<div className={`p-4 ${styles.tipCard}`}>
						<h4>Measuring Dry Ingredients</h4>
						<p>Spoon into measuring cup and level off with a straight edge. Don&apos;t pack unless specified.</p>
					</div>
					<div className={`p-4 ${styles.tipCard}`}>
						<h4>Measuring Flour</h4>
						<p>Fluff flour first, spoon into cup, then level. Scooping directly compacts and adds too much.</p>
					</div>
					<div className={`p-4 ${styles.tipCard}`}>
						<h4>Weighing is Best</h4>
						<p>For baking, weighing ingredients in grams is more accurate than volume measurements.</p>
					</div>
				</div>
			</div>
		</div>
	);
}
