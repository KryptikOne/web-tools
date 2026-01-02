"use client";

import { useState, useCallback } from "react";
import { ArrowPathIcon, PlusIcon, MinusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import styles from "./DiceRoller.module.scss";

interface DieType {
	id: string;
	name: string;
	sides: number;
	color: string;
}

interface DieRoll {
	id: string;
	dieType: DieType;
	value: number;
	isRolling: boolean;
}

interface DiceGroup {
	dieType: DieType;
	count: number;
}

const DICE_TYPES: DieType[] = [
	{ id: "d4", name: "D4", sides: 4, color: "#ef4444" },
	{ id: "d6", name: "D6", sides: 6, color: "#f97316" },
	{ id: "d8", name: "D8", sides: 8, color: "#eab308" },
	{ id: "d10", name: "D10", sides: 10, color: "#22c55e" },
	{ id: "d12", name: "D12", sides: 12, color: "#3b82f6" },
	{ id: "d20", name: "D20", sides: 20, color: "#8b5cf6" },
	{ id: "d100", name: "D100", sides: 100, color: "#ec4899" },
];

export default function DiceRoller() {
	const [diceGroups, setDiceGroups] = useState<DiceGroup[]>([{ dieType: DICE_TYPES[1], count: 1 }]); // Start with 1 D6
	const [rolls, setRolls] = useState<DieRoll[]>([]);
	const [isRolling, setIsRolling] = useState(false);
	const [rollHistory, setRollHistory] = useState<{ rolls: DieRoll[]; total: number; timestamp: number }[]>([]);

	const rollDice = useCallback(() => {
		if (isRolling) return;

		setIsRolling(true);

		// Create initial rolling state
		const newRolls: DieRoll[] = [];
		let rollId = 0;

		diceGroups.forEach((group) => {
			for (let i = 0; i < group.count; i++) {
				newRolls.push({
					id: `roll-${rollId++}`,
					dieType: group.dieType,
					value: 1,
					isRolling: true,
				});
			}
		});

		setRolls(newRolls);

		// Animate rolling
		const animationDuration = 800;
		const animationSteps = 10;
		const stepDuration = animationDuration / animationSteps;

		let step = 0;
		const animationInterval = setInterval(() => {
			step++;

			setRolls((prevRolls) =>
				prevRolls.map((roll) => ({
					...roll,
					value: Math.floor(Math.random() * roll.dieType.sides) + 1,
				}))
			);

			if (step >= animationSteps) {
				clearInterval(animationInterval);

				// Final roll values
				const finalRolls = newRolls.map((roll) => ({
					...roll,
					value: Math.floor(Math.random() * roll.dieType.sides) + 1,
					isRolling: false,
				}));

				setRolls(finalRolls);
				setIsRolling(false);

				// Add to history
				const total = finalRolls.reduce((sum, roll) => sum + roll.value, 0);
				setRollHistory((prev) => [{ rolls: finalRolls, total, timestamp: Date.now() }, ...prev.slice(0, 9)]);
			}
		}, stepDuration);
	}, [diceGroups, isRolling]);

	const addDieGroup = (dieType: DieType) => {
		const existingIndex = diceGroups.findIndex((g) => g.dieType.id === dieType.id);
		if (existingIndex >= 0) {
			setDiceGroups((prev) => prev.map((g, i) => (i === existingIndex ? { ...g, count: Math.min(g.count + 1, 20) } : g)));
		} else {
			setDiceGroups((prev) => [...prev, { dieType, count: 1 }]);
		}
	};

	const removeDieGroup = (dieType: DieType) => {
		const existingIndex = diceGroups.findIndex((g) => g.dieType.id === dieType.id);
		if (existingIndex >= 0) {
			const group = diceGroups[existingIndex];
			if (group.count > 1) {
				setDiceGroups((prev) => prev.map((g, i) => (i === existingIndex ? { ...g, count: g.count - 1 } : g)));
			} else {
				setDiceGroups((prev) => prev.filter((_, i) => i !== existingIndex));
			}
		}
	};

	const clearDice = () => {
		setDiceGroups([]);
		setRolls([]);
	};

	const clearHistory = () => {
		setRollHistory([]);
	};

	const getDieCount = (dieType: DieType) => {
		const group = diceGroups.find((g) => g.dieType.id === dieType.id);
		return group?.count || 0;
	};

	const totalDice = diceGroups.reduce((sum, g) => sum + g.count, 0);
	const currentTotal = rolls.reduce((sum, roll) => sum + roll.value, 0);

	// Generate dice notation (e.g., "2d6 + 1d20")
	const diceNotation = diceGroups
		.filter((g) => g.count > 0)
		.map((g) => `${g.count}${g.dieType.name.toLowerCase()}`)
		.join(" + ");

	return (
		<div className={styles.container}>
			{/* Dice Selection */}
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>Select Dice</h2>
				<div className={styles.diceSelector}>
					{DICE_TYPES.map((die) => {
						const count = getDieCount(die);
						return (
							<div key={die.id} className={styles.dieOption}>
								<button className={`${styles.dieButton} ${count > 0 ? styles.active : ""}`} style={{ "--die-color": die.color } as React.CSSProperties} onClick={() => addDieGroup(die)}>
									<span className={styles.dieName}>{die.name}</span>
									{count > 0 && <span className={styles.dieCount}>{count}</span>}
								</button>
								{count > 0 && (
									<div className={styles.dieControls}>
										<button className={styles.controlBtn} onClick={() => removeDieGroup(die)} title="Remove one">
											<MinusIcon className="w-3.5 h-3.5" />
										</button>
										<button className={styles.controlBtn} onClick={() => addDieGroup(die)} title="Add one">
											<PlusIcon className="w-3.5 h-3.5" />
										</button>
									</div>
								)}
							</div>
						);
					})}
				</div>

				{totalDice > 0 && (
					<div className={styles.selectionInfo}>
						<span className={styles.notation}>{diceNotation}</span>
						<Button onClick={clearDice} className={styles.clearBtn}>
							<TrashIcon className="w-4 h-4" />
							Clear
						</Button>
					</div>
				)}
			</div>

			{/* Roll Button & Results */}
			<div className={styles.glassCard}>
				<div className={styles.rollSection}>
					<Button onClick={rollDice} disabled={totalDice === 0 || isRolling} className={styles.rollButton}>
						<ArrowPathIcon className={`w-6 h-6 ${isRolling ? styles.spinning : ""}`} />
						{isRolling ? "Rolling..." : "Roll Dice"}
					</Button>

					{rolls.length > 0 && (
						<div className={styles.resultsArea}>
							<div className={styles.diceResults}>
								{rolls.map((roll) => (
									<div key={roll.id} className={`${styles.dieResult} ${roll.isRolling ? styles.rolling : ""}`} style={{ "--die-color": roll.dieType.color } as React.CSSProperties}>
										<span className={styles.resultValue}>{roll.value}</span>
										<span className={styles.resultLabel}>{roll.dieType.name}</span>
									</div>
								))}
							</div>

							{rolls.length > 1 && (
								<div className={styles.totalDisplay}>
									<span className={styles.totalLabel}>Total</span>
									<span className={styles.totalValue}>{currentTotal}</span>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Roll History */}
			{rollHistory.length > 0 && (
				<div className={styles.glassCard}>
					<div className={styles.historyHeader}>
						<h2 className={styles.sectionTitle}>Roll History</h2>
						<Button onClick={clearHistory} className={styles.clearHistoryBtn}>
							<TrashIcon className="w-4 h-4" />
							Clear
						</Button>
					</div>
					<div className={styles.historyList}>
						{rollHistory.map((entry, index) => (
							<div key={entry.timestamp} className={styles.historyEntry}>
								<span className={styles.historyIndex}>#{rollHistory.length - index}</span>
								<div className={styles.historyRolls}>
									{entry.rolls.map((roll, i) => (
										<span key={i} className={styles.historyRoll} style={{ "--die-color": roll.dieType.color } as React.CSSProperties}>
											{roll.value}
										</span>
									))}
								</div>
								<span className={styles.historyTotal}>= {entry.total}</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Info Section */}
			<div className={styles.glassCard}>
				<h2 className={styles.sectionTitle}>About Dice</h2>
				<div className={styles.infoGrid}>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Standard Polyhedral Dice</h3>
						<p className={styles.infoText}>These are the dice commonly used in tabletop role-playing games like Dungeons & Dragons. The number indicates how many sides each die has.</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>D20 - The Iconic Die</h3>
						<p className={styles.infoText}>The 20-sided die is the most famous RPG die, used for attack rolls, saving throws, and skill checks in many game systems.</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>D100 - Percentile</h3>
						<p className={styles.infoText}>Also called a percentile die, the D100 generates numbers from 1-100 and is often used for probability-based events.</p>
					</div>
					<div className={styles.infoItem}>
						<h3 className={styles.infoSubtitle}>Dice Notation</h3>
						<p className={styles.infoText}>Written as NdX where N is the number of dice and X is the sides. For example, 2d6 means &quot;roll two six-sided dice.&quot;</p>
					</div>
				</div>
			</div>
		</div>
	);
}
