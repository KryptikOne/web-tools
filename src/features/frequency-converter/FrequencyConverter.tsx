"use client";

import UnitConverterPanel from "@/components/UnitConverterPanel";
import { getUnitCategory } from "@/lib/unitDefinitions";
import styles from "./FrequencyConverter.module.scss";

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

export default function FrequencyConverter() {
	return (
		<div className={styles.container}>
			<div className="mb-6">
				<UnitConverterPanel category={getUnitCategory("frequency")!} initialUnitId="mhz" initialValue="1" />
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
