"use client";

import { useMemo, useState } from "react";
import { ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";
import SegmentedControl from "@/components/SegmentedControl";
import { useClipboard } from "@/hooks/useClipboard";
import { convertUnits, formatUnitValue, type UnitCategory } from "@/lib/unitDefinitions";
import styles from "./UnitConverterPanel.module.scss";

interface UnitConverterPanelProps {
	category: UnitCategory;
	/** Unit id and value to start with (defaults to 1 in the base unit) */
	initialUnitId?: string;
	initialValue?: string;
}

/**
 * Every unit in a category as a live row: edit any one and the others update.
 * The edited row keeps the exact text typed; the rest show formatted results.
 */
export default function UnitConverterPanel({ category, initialUnitId, initialValue = "1" }: UnitConverterPanelProps) {
	const [source, setSource] = useState<{ unitId: string; text: string }>({
		unitId: initialUnitId ?? category.baseUnitId,
		text: initialValue,
	});
	const [variant, setVariant] = useState<string | undefined>(category.variants?.[0]?.id);
	const { copy, isCopied } = useClipboard();

	// Reset when the category changes (the hub swaps categories in place)
	const [lastCategory, setLastCategory] = useState(category.id);
	if (lastCategory !== category.id) {
		setLastCategory(category.id);
		setSource({ unitId: category.baseUnitId, text: "1" });
		setVariant(category.variants?.[0]?.id);
	}

	const sourceValue = useMemo(() => {
		const n = parseFloat(source.text.replace(/,/g, ""));
		return Number.isFinite(n) ? n : null;
	}, [source.text]);

	const rows = useMemo(
		() =>
			category.units.map((unit) => {
				if (unit.id === source.unitId) return { unit, text: source.text, isSource: true };
				if (sourceValue === null) return { unit, text: "", isSource: false };
				const converted = convertUnits(category, sourceValue, source.unitId, unit.id, variant);
				return { unit, text: formatUnitValue(converted), isSource: false };
			}),
		[category, source, sourceValue, variant]
	);

	return (
		<div className={styles.panel}>
			{category.variants && (
				<div className={styles.variantRow}>
					<SegmentedControl
						label={`${category.name} mode`}
						size="sm"
						fill={false}
						value={variant ?? category.variants[0].id}
						onChange={setVariant}
						options={category.variants.map((v) => ({ value: v.id, label: v.label, title: v.description }))}
					/>
				</div>
			)}
			{rows.map(({ unit, text, isSource }) => {
				const inputId = `unit-${category.id}-${unit.id}`;
				return (
					<div key={unit.id} className={`${styles.row} ${isSource ? styles.rowActive : ""}`}>
						<label htmlFor={inputId} className={styles.rowLabel}>
							<span className={styles.unitName}>{unit.name}</span>
							<span className={styles.unitAbbrev}>{unit.abbrev}</span>
						</label>
						<input
							id={inputId}
							type="text"
							inputMode="decimal"
							value={text}
							onChange={(e) => setSource({ unitId: unit.id, text: e.target.value })}
							onFocus={(e) => e.target.select()}
							className={styles.rowInput}
							placeholder="0"
							autoComplete="off"
							spellCheck={false}
						/>
						<button
							type="button"
							className={styles.rowCopy}
							onClick={() => copy(text, unit.id)}
							disabled={!text}
							aria-label={`Copy ${unit.name}`}
						>
							{isCopied(unit.id) ? <CheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
						</button>
					</div>
				);
			})}
		</div>
	);
}
