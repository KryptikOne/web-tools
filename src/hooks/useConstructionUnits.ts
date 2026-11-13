"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hydrateUserPreferences, setConstructionPrecision, setConstructionUnitMode } from "@/store/slices/userPreferencesSlice";
import {
	formatLength,
	parseDimension,
	UNIT_MODES,
	type FormatOptions,
	type FractionPrecision,
	type UnitMode,
} from "@/lib/construction/imperialUtils";

/**
 * Site-wide unit mode and fraction precision for the construction tools, with parse/format bound
 * to them. Lengths are always inches in and inches out; only the text changes.
 */
export function useConstructionUnits() {
	const dispatch = useAppDispatch();
	const mode = useAppSelector((s) => s.userPreferences.constructionUnitMode);
	const precision = useAppSelector((s) => s.userPreferences.constructionPrecision);

	useEffect(() => {
		dispatch(hydrateUserPreferences());
	}, [dispatch]);

	const setMode = useCallback((m: UnitMode) => dispatch(setConstructionUnitMode(m)), [dispatch]);
	const setPrecision = useCallback((p: FractionPrecision) => dispatch(setConstructionPrecision(p)), [dispatch]);

	const parse = useCallback((text: string) => parseDimension(text, mode), [mode]);
	const format = useCallback(
		(inches: number, opts?: Partial<FormatOptions>) => formatLength(inches, { mode, precision, ...opts }),
		[mode, precision],
	);

	const unitLabel = useMemo(() => UNIT_MODES.find((u) => u.value === mode)?.short ?? mode, [mode]);

	return { mode, precision, setMode, setPrecision, parse, format, unitLabel };
}

export type ConstructionUnits = ReturnType<typeof useConstructionUnits>;
