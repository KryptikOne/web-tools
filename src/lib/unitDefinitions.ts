/**
 * Unit definitions shared by every unit converter. Each category converts
 * through a base unit; categories with a variant (binary/decimal storage)
 * pass the active variant to the conversion functions.
 */

export interface UnitDefinition {
	id: string;
	name: string;
	abbrev: string;
	toBase: (value: number, variant?: string) => number;
	fromBase: (value: number, variant?: string) => number;
}

export interface UnitVariant {
	id: string;
	label: string;
	description?: string;
}

export interface UnitCategory {
	id: string;
	name: string;
	/** Registry tool id whose route deep-links to this category */
	toolId: string;
	baseUnitId: string;
	units: UnitDefinition[];
	variants?: UnitVariant[];
	/** Units where zero cannot be converted meaningfully (inverse relationships). */
	inverse?: boolean;
}

const factor = (id: string, name: string, abbrev: string, f: number): UnitDefinition => ({
	id,
	name,
	abbrev,
	toBase: (v) => v * f,
	fromBase: (v) => v / f,
});

export const UNIT_CATEGORIES: UnitCategory[] = [
	{
		id: "length",
		name: "Length",
		toolId: "distance-converter",
		baseUnitId: "m",
		units: [
			factor("mm", "Millimeters", "mm", 0.001),
			factor("cm", "Centimeters", "cm", 0.01),
			factor("m", "Meters", "m", 1),
			factor("km", "Kilometers", "km", 1000),
			factor("in", "Inches", "in", 0.0254),
			factor("ft", "Feet", "ft", 0.3048),
			factor("yd", "Yards", "yd", 0.9144),
			factor("mi", "Miles", "mi", 1609.344),
			factor("nmi", "Nautical Miles", "nmi", 1852),
		],
	},
	{
		id: "weight",
		name: "Weight",
		toolId: "weight-converter",
		baseUnitId: "g",
		units: [
			factor("mg", "Milligrams", "mg", 0.001),
			factor("g", "Grams", "g", 1),
			factor("kg", "Kilograms", "kg", 1000),
			factor("t", "Metric Tons", "t", 1_000_000),
			factor("oz", "Ounces", "oz", 28.3495),
			factor("lb", "Pounds", "lb", 453.592),
			factor("st", "Stones", "st", 6350.29),
			factor("ton_us", "US Tons (Short)", "ton", 907185),
			factor("ton_uk", "UK Tons (Long)", "long ton", 1016047),
		],
	},
	{
		id: "temperature",
		name: "Temperature",
		toolId: "temperature-converter",
		baseUnitId: "c",
		units: [
			{ id: "c", name: "Celsius", abbrev: "°C", toBase: (v) => v, fromBase: (v) => v },
			{ id: "f", name: "Fahrenheit", abbrev: "°F", toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
			{ id: "k", name: "Kelvin", abbrev: "K", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
			{ id: "r", name: "Rankine", abbrev: "°R", toBase: (v) => ((v - 491.67) * 5) / 9, fromBase: (v) => ((v + 273.15) * 9) / 5 },
		],
	},
	{
		id: "speed",
		name: "Speed",
		toolId: "speed-converter",
		baseUnitId: "ms",
		units: [
			factor("ms", "Meters per second", "m/s", 1),
			factor("kmh", "Kilometers per hour", "km/h", 1 / 3.6),
			factor("mph", "Miles per hour", "mph", 0.44704),
			factor("fps", "Feet per second", "ft/s", 0.3048),
			factor("knots", "Knots", "kn", 0.514444),
			factor("mach", "Mach (sea level)", "Mach", 343),
		],
	},
	{
		id: "area",
		name: "Area",
		toolId: "area-converter",
		baseUnitId: "sqm",
		units: [
			factor("sqmm", "Square Millimeters", "mm²", 0.000001),
			factor("sqcm", "Square Centimeters", "cm²", 0.0001),
			factor("sqm", "Square Meters", "m²", 1),
			factor("sqkm", "Square Kilometers", "km²", 1_000_000),
			factor("ha", "Hectares", "ha", 10000),
			factor("sqin", "Square Inches", "in²", 0.00064516),
			factor("sqft", "Square Feet", "ft²", 0.092903),
			factor("sqyd", "Square Yards", "yd²", 0.836127),
			factor("acre", "Acres", "ac", 4046.86),
			factor("sqmi", "Square Miles", "mi²", 2589988),
		],
	},
	{
		id: "volume",
		name: "Volume",
		toolId: "volume-converter",
		baseUnitId: "l",
		units: [
			factor("ml", "Milliliters", "mL", 0.001),
			factor("l", "Liters", "L", 1),
			factor("cubm", "Cubic Meters", "m³", 1000),
			factor("floz_us", "Fluid Ounces (US)", "fl oz", 0.0295735),
			factor("floz_uk", "Fluid Ounces (UK)", "fl oz UK", 0.0284131),
			factor("cup_us", "Cups (US)", "cup", 0.236588),
			factor("pt_us", "Pints (US)", "pt", 0.473176),
			factor("qt_us", "Quarts (US)", "qt", 0.946353),
			factor("gal_us", "Gallons (US)", "gal", 3.78541),
			factor("gal_uk", "Gallons (UK)", "gal UK", 4.54609),
			factor("cubin", "Cubic Inches", "in³", 0.0163871),
			factor("cubft", "Cubic Feet", "ft³", 28.3168),
			factor("cubyd", "Cubic Yards", "yd³", 764.555),
		],
	},
	{
		id: "data",
		name: "Data",
		toolId: "data-storage-converter",
		baseUnitId: "b",
		variants: [
			{ id: "binary", label: "Binary (1024)", description: "KB = 1024 bytes, the way operating systems report sizes" },
			{ id: "decimal", label: "Decimal (1000)", description: "KB = 1000 bytes, the way drives are marketed" },
		],
		units: (() => {
			const dual = (id: string, name: string, abbrev: string, bin: number, dec: number): UnitDefinition => ({
				id,
				name,
				abbrev,
				toBase: (v, variant) => v * (variant === "decimal" ? dec : bin),
				fromBase: (v, variant) => v / (variant === "decimal" ? dec : bin),
			});
			return [
				factor("bit", "Bits", "bit", 1 / 8),
				dual("b", "Bytes", "B", 1, 1),
				dual("kb", "Kilobytes", "KB", 1024, 1000),
				dual("mb", "Megabytes", "MB", 1024 ** 2, 1000 ** 2),
				dual("gb", "Gigabytes", "GB", 1024 ** 3, 1000 ** 3),
				dual("tb", "Terabytes", "TB", 1024 ** 4, 1000 ** 4),
				dual("pb", "Petabytes", "PB", 1024 ** 5, 1000 ** 5),
				factor("kib", "Kibibytes", "KiB", 1024),
				factor("mib", "Mebibytes", "MiB", 1024 ** 2),
				factor("gib", "Gibibytes", "GiB", 1024 ** 3),
				factor("tib", "Tebibytes", "TiB", 1024 ** 4),
			];
		})(),
	},
	{
		id: "energy",
		name: "Energy",
		toolId: "energy-converter",
		baseUnitId: "j",
		units: [
			factor("j", "Joules", "J", 1),
			factor("kj", "Kilojoules", "kJ", 1000),
			factor("cal", "Calories (small)", "cal", 4.184),
			factor("kcal", "Kilocalories (food)", "kcal", 4184),
			factor("wh", "Watt-hours", "Wh", 3600),
			factor("kwh", "Kilowatt-hours", "kWh", 3_600_000),
			factor("btu", "BTU", "BTU", 1055.06),
			factor("ev", "Electron Volts", "eV", 1.602e-19),
			factor("ftlbf", "Foot-pounds", "ft·lbf", 1.35582),
		],
	},
	{
		id: "power",
		name: "Power",
		toolId: "power-converter",
		baseUnitId: "w",
		units: [
			factor("w", "Watts", "W", 1),
			factor("kw", "Kilowatts", "kW", 1000),
			factor("mw", "Megawatts", "MW", 1_000_000),
			factor("hp", "Horsepower (mechanical)", "hp", 745.7),
			factor("ps", "Metric Horsepower", "PS", 735.499),
			factor("btuh", "BTU per hour", "BTU/h", 0.29307),
			factor("ftlbs", "Foot-pounds per second", "ft·lbf/s", 1.35582),
			factor("cals", "Calories per second", "cal/s", 4.184),
		],
	},
	{
		id: "pressure",
		name: "Pressure",
		toolId: "pressure-converter",
		baseUnitId: "pa",
		units: [
			factor("pa", "Pascals", "Pa", 1),
			factor("kpa", "Kilopascals", "kPa", 1000),
			factor("mpa", "Megapascals", "MPa", 1_000_000),
			factor("bar", "Bar", "bar", 100000),
			factor("atm", "Atmospheres", "atm", 101325),
			factor("psi", "PSI", "psi", 6894.76),
			factor("mmhg", "mmHg (Torr)", "mmHg", 133.322),
			factor("inhg", "Inches of Mercury", "inHg", 3386.39),
		],
	},
	{
		id: "frequency",
		name: "Frequency",
		toolId: "frequency-converter",
		baseUnitId: "hz",
		units: [
			factor("hz", "Hertz", "Hz", 1),
			factor("khz", "Kilohertz", "kHz", 1000),
			factor("mhz", "Megahertz", "MHz", 1e6),
			factor("ghz", "Gigahertz", "GHz", 1e9),
			factor("thz", "Terahertz", "THz", 1e12),
			factor("rpm", "RPM", "RPM", 1 / 60),
			factor("rads", "Radians per second", "rad/s", 1 / (2 * Math.PI)),
			factor("bpm", "Beats per minute", "BPM", 1 / 60),
		],
	},
	{
		id: "angle",
		name: "Angle",
		toolId: "angle-converter",
		baseUnitId: "deg",
		units: [
			factor("deg", "Degrees", "°", 1),
			factor("rad", "Radians", "rad", 180 / Math.PI),
			factor("grad", "Gradians", "grad", 0.9),
			factor("turn", "Turns", "turn", 360),
			factor("arcmin", "Arc minutes", "′", 1 / 60),
			factor("arcsec", "Arc seconds", "″", 1 / 3600),
		],
	},
	{
		id: "fuel",
		name: "Fuel Economy",
		toolId: "fuel-economy-converter",
		baseUnitId: "kml",
		inverse: true,
		units: [
			factor("kml", "Kilometers per liter", "km/L", 1),
			factor("mpg_us", "Miles per gallon (US)", "mpg (US)", 0.425144),
			factor("mpg_uk", "Miles per gallon (UK)", "mpg (UK)", 0.354006),
			{
				id: "l100km",
				name: "Liters per 100 km",
				abbrev: "L/100km",
				toBase: (v) => (v === 0 ? 0 : 100 / v),
				fromBase: (v) => (v === 0 ? 0 : 100 / v),
			},
			factor("mil", "Miles per liter", "mi/L", 1.60934),
		],
	},
];

export function getUnitCategory(id: string): UnitCategory | undefined {
	return UNIT_CATEGORIES.find((c) => c.id === id);
}

export function getUnitCategoryByToolId(toolId: string): UnitCategory | undefined {
	return UNIT_CATEGORIES.find((c) => c.toolId === toolId);
}

/** Convert a value between two units of a category. */
export function convertUnits(category: UnitCategory, value: number, fromId: string, toId: string, variant?: string): number {
	const from = category.units.find((u) => u.id === fromId);
	const to = category.units.find((u) => u.id === toId);
	if (!from || !to) return NaN;
	return to.fromBase(from.toBase(value, variant), variant);
}

/** Compact display formatting shared by the converters. */
export function formatUnitValue(num: number): string {
	if (!Number.isFinite(num)) return "";
	if (num === 0) return "0";
	const abs = Math.abs(num);
	if (abs < 0.0001) return num.toExponential(3);
	if (abs >= 1e15) return num.toExponential(3);
	if (abs >= 1_000_000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
	if (Number.isInteger(num)) return num.toString();
	const decimals = abs < 1 ? 6 : abs < 100 ? 4 : 2;
	return num.toFixed(decimals).replace(/\.?0+$/, "");
}
