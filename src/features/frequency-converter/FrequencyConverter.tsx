"use client";

import { useState, useCallback } from "react";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import styles from "./FrequencyConverter.module.scss";

interface ConversionUnit {
	id: string;
	name: string;
	abbrev: string;
	toBase: (value: number) => number;
	fromBase: (value: number) => number;
}

// Frequency units (base: Hertz)
const FREQUENCY_UNITS: ConversionUnit[] = [
	{ id: "hz", name: "Hertz", abbrev: "Hz", toBase: (v) => v, fromBase: (v) => v },
	{ id: "khz", name: "Kilohertz", abbrev: "kHz", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
	{ id: "mhz", name: "Megahertz", abbrev: "MHz", toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
	{ id: "ghz", name: "Gigahertz", abbrev: "GHz", toBase: (v) => v * 1e9, fromBase: (v) => v / 1e9 },
	{ id: "thz", name: "Terahertz", abbrev: "THz", toBase: (v) => v * 1e12, fromBase: (v) => v / 1e12 },
	{ id: "rpm", name: "RPM", abbrev: "RPM", toBase: (v) => v / 60, fromBase: (v) => v * 60 },
	{ id: "rads", name: "Radians per second", abbrev: "rad/s", toBase: (v) => v / (2 * Math.PI), fromBase: (v) => v * (2 * Math.PI) },
	{ id: "bpm", name: "Beats per minute", abbrev: "BPM", toBase: (v) => v / 60, fromBase: (v) => v * 60 },
];

const AUDIO_FREQUENCIES = [
	{ range: "Sub-bass", frequency: "20-60 Hz", description: "Felt more than heard, rumble" },
	{ range: "Bass", frequency: "60-250 Hz", description: "Bass guitar, kick drum" },
	{ range: "Low midrange", frequency: "250-500 Hz", description: "Warmth, body of instruments" },
	{ range: "Midrange", frequency: "500 Hz - 2 kHz", description: "Vocals, most instruments" },
	{ range: "Upper midrange", frequency: "2-4 kHz", description: "Presence, clarity" },
	{ range: "Treble", frequency: "4-8 kHz", description: "Brilliance, sibilance" },
	{ range: "High treble", frequency: "8-20 kHz", description: "Air, sparkle, cymbals" },
	{ range: "Concert A (A4)", frequency: "440 Hz", description: "Standard tuning pitch" },
	{ range: "Middle C (C4)", frequency: "261.63 Hz", description: "Piano middle C" },
];

const RADIO_BANDS = [
	{ band: "AM Radio", range: "530-1700 kHz", notes: "Amplitude modulation broadcast" },
	{ band: "FM Radio", range: "87.5-108 MHz", notes: "Frequency modulation broadcast" },
	{ band: "VHF TV (2-6)", range: "54-88 MHz", notes: "Low VHF television" },
	{ band: "VHF TV (7-13)", range: "174-216 MHz", notes: "High VHF television" },
	{ band: "GPS (L1)", range: "1575.42 MHz", notes: "GPS navigation signal" },
	{ band: "WiFi 2.4 GHz", range: "2.4-2.5 GHz", notes: "802.11 b/g/n/ax" },
	{ band: "WiFi 5 GHz", range: "5.15-5.85 GHz", notes: "802.11 a/n/ac/ax" },
	{ band: "WiFi 6 GHz", range: "5.925-7.125 GHz", notes: "802.11ax (WiFi 6E)" },
	{ band: "5G (mmWave)", range: "24-47 GHz", notes: "High-band 5G cellular" },
];

const COMMON_CONVERSIONS = [
	{ from: "1 kHz", to: "1,000 Hz" },
	{ from: "1 MHz", to: "1,000 kHz" },
	{ from: "1 GHz", to: "1,000 MHz" },
	{ from: "1 RPM", to: "0.01667 Hz" },
	{ from: "60 RPM", to: "1 Hz" },
	{ from: "3600 RPM", to: "60 Hz" },
	{ from: "60 BPM", to: "1 Hz" },
	{ from: "1 Hz", to: "6.283 rad/s" },
];

function formatNumber(num: number): string {
	if (num === 0) return "0";
	if (Math.abs(num) < 0.0001) return num.toExponential(2);
	if (Math.abs(num) >= 1000000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
	if (Number.isInteger(num)) return num.toString();
	return num.toFixed(Math.abs(num) < 1 ? 4 : 2).replace(/\.?0+$/, "");
}

export default function FrequencyConverter() {
	const [fromUnit, setFromUnit] = useState<string>("mhz");
	const [toUnit, setToUnit] = useState<string>("ghz");
	const [inputValue, setInputValue] = useState<string>("1");

	const convert = useCallback(() => {
		const value = parseFloat(inputValue);
		if (isNaN(value)) return "";

		const from = FREQUENCY_UNITS.find((u) => u.id === fromUnit);
		const to = FREQUENCY_UNITS.find((u) => u.id === toUnit);

		if (!from || !to) return "";

		const baseValue = from.toBase(value);
		const result = to.fromBase(baseValue);

		return formatNumber(result);
	}, [inputValue, fromUnit, toUnit]);

	const swapUnits = () => {
		const temp = fromUnit;
		setFromUnit(toUnit);
		setToUnit(temp);
	};

	const result = convert();

	return (
		<div className={styles.container}>
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>Frequency Converter</h2>

				<div className={styles.converterGrid}>
					<div className={styles.converterInput}>
						<label className={styles.inputLabel}>From</label>
						<div className={styles.inputRow}>
							<input
								type="number"
								inputMode="decimal"
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								className={styles.numberInput}
								placeholder="Enter value"
							/>
							<select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)} className={styles.unitSelect}>
								{FREQUENCY_UNITS.map((unit) => (
									<option key={unit.id} value={unit.id}>
										{unit.name} ({unit.abbrev})
									</option>
								))}
							</select>
						</div>
					</div>

					<button className={styles.swapButton} onClick={swapUnits} title="Swap units">
						<ArrowsRightLeftIcon className="w-5 h-5" />
					</button>

					<div className={styles.converterInput}>
						<label className={styles.inputLabel}>To</label>
						<div className={styles.inputRow}>
							<div className={styles.resultDisplay}>{result || "—"}</div>
							<select value={toUnit} onChange={(e) => setToUnit(e.target.value)} className={styles.unitSelect}>
								{FREQUENCY_UNITS.map((unit) => (
									<option key={unit.id} value={unit.id}>
										{unit.name} ({unit.abbrev})
									</option>
								))}
							</select>
						</div>
					</div>
				</div>

				{result && (
					<div className={styles.resultSummary}>
						<span className={styles.resultText}>
							{inputValue} {FREQUENCY_UNITS.find((u) => u.id === fromUnit)?.abbrev} ={" "}
							<strong>
								{result} {FREQUENCY_UNITS.find((u) => u.id === toUnit)?.abbrev}
							</strong>
						</span>
					</div>
				)}
			</div>

			<div className={styles.chartsGrid}>
				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>Audio Frequency Ranges</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>Range</th>
									<th>Frequency</th>
									<th>Description</th>
								</tr>
							</thead>
							<tbody>
								{AUDIO_FREQUENCIES.map((row, i) => (
									<tr key={i}>
										<td>{row.range}</td>
										<td>{row.frequency}</td>
										<td>{row.description}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				<div className={styles.glassCard}>
					<h3 className={styles.chartTitle}>Common Conversions</h3>
					<div className={styles.tableWrapper}>
						<table className={styles.referenceTable}>
							<thead>
								<tr>
									<th>From</th>
									<th>To</th>
								</tr>
							</thead>
							<tbody>
								{COMMON_CONVERSIONS.map((row, i) => (
									<tr key={i}>
										<td>{row.from}</td>
										<td>{row.to}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Radio Frequency Bands</h3>
				<div className={styles.tableWrapper}>
					<table className={styles.referenceTable}>
						<thead>
							<tr>
								<th>Band</th>
								<th>Frequency Range</th>
								<th>Notes</th>
							</tr>
						</thead>
						<tbody>
							{RADIO_BANDS.map((row, i) => (
								<tr key={i}>
									<td>{row.band}</td>
									<td>{row.range}</td>
									<td>{row.notes}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<div className={styles.glassCard}>
				<h3 className={styles.chartTitle}>Quick Tips</h3>
				<div className={styles.tipsGrid}>
					<div className={styles.tipCard}>
						<h4>RPM to Hz</h4>
						<p>Divide RPM by 60 to get Hz. Example: 3600 RPM ÷ 60 = 60 Hz (US mains frequency)</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Musical Octaves</h4>
						<p>Each octave doubles the frequency. A4=440 Hz, A5=880 Hz, A3=220 Hz.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>CPU Clock Speed</h4>
						<p>Modern CPUs run at 3-5 GHz, meaning 3-5 billion cycles per second.</p>
					</div>
					<div className={styles.tipCard}>
						<h4>Mains Frequency</h4>
						<p>US/Americas: 60 Hz. Europe/Asia/Africa: 50 Hz. This is why some clocks run differently abroad.</p>
					</div>
				</div>
			</div>
		</div>
	);
}
