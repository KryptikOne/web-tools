import { Tool, ToolCategory, CategoryInfo } from "@/types/tools";

export const CATEGORIES: Record<ToolCategory, CategoryInfo> = {
	[ToolCategory.CODE_WEB]: {
		id: ToolCategory.CODE_WEB,
		name: "Code & Web Dev",
		description: "Developer tools for coding and web development",
	},
	[ToolCategory.COLOR_DESIGN]: {
		id: ToolCategory.COLOR_DESIGN,
		name: "Color & Design",
		description: "Color pickers, generators, and CSS design utilities",
	},
	[ToolCategory.UTILITY_CONVERSION]: {
		id: ToolCategory.UTILITY_CONVERSION,
		name: "Utility & Conversion",
		description: "General utilities and unit conversion tools",
	},
	[ToolCategory.TEXT_DATA]: {
		id: ToolCategory.TEXT_DATA,
		name: "Text & Data",
		description: "Text processing, formatting, and data conversion utilities",
	},
	[ToolCategory.IMAGE_VISUAL]: {
		id: ToolCategory.IMAGE_VISUAL,
		name: "Image & Visual",
		description: "Image processing, conversion, and manipulation tools",
	},
	[ToolCategory.FUN_RANDOM]: {
		id: ToolCategory.FUN_RANDOM,
		name: "Fun & Random",
		description: "Random generators, games, and fun utilities",
	},
};

export const TOOLS_REGISTRY: Tool[] = [
	// COLOR & DESIGN TOOLS
	{
		id: "color-picker",
		name: "Color Picker",
		description: "Advanced OKLCH-based color picker with multi-format conversion",
		category: ToolCategory.COLOR_DESIGN,
		route: "/tools/color-picker",
		implemented: true,
	},
	{
		id: "gradient-generator",
		name: "CSS Gradient Generator",
		description: "Create CSS gradients visually with linear and radial options",
		category: ToolCategory.COLOR_DESIGN,
		route: "/tools/gradient-generator",
		implemented: true,
	},
	{
		id: "box-shadow-generator",
		name: "Box Shadow Generator",
		description: "Generate CSS box shadows",
		category: ToolCategory.COLOR_DESIGN,
		route: "/tools/box-shadow-generator",
		implemented: true,
	},
	{
		id: "border-radius-generator",
		name: "Border Radius Generator",
		description: "Create custom border radius values",
		category: ToolCategory.COLOR_DESIGN,
		route: "/tools/border-radius-generator",
		implemented: true,
	},
	{
		id: "cubic-bezier",
		name: "Cubic Bezier Generator",
		description: "Interactive cubic bezier curve editor for CSS animations",
		category: ToolCategory.COLOR_DESIGN,
		route: "/tools/cubic-bezier",
		implemented: true,
	},
	{
		id: "palette-generator",
		name: "Color Palette Generator",
		description: "Generate color palettes with harmony rules like analogous, complementary, and triadic",
		category: ToolCategory.COLOR_DESIGN,
		route: "/tools/palette-generator",
		implemented: true,
	},

	// UTILITY & CONVERSION
	{
		id: "epoch-converter",
		name: "Epoch Converter",
		description: "Convert Unix timestamps to dates",
		category: ToolCategory.CODE_WEB,
		route: "/tools/epoch-converter",
		implemented: true,
	},
	{
		id: "px-rem-calculator",
		name: "PX/REM Calculator",
		description: "Convert between pixels and rem units",
		category: ToolCategory.UTILITY_CONVERSION,
		route: "/tools/px-rem-calculator",
		implemented: true,
	},
	{
		id: "percentage-calculator",
		name: "Percentage Calculator",
		description: "Calculate percentages easily - find the percentage, part, or whole from any two values",
		category: ToolCategory.UTILITY_CONVERSION,
		route: "/tools/percentage-calculator",
		implemented: true,
	},
	{
		id: "tip-calculator",
		name: "Tip Calculator",
		description: "Calculate tips with preset or custom percentages, split bills between multiple people",
		category: ToolCategory.UTILITY_CONVERSION,
		route: "/tools/tip-calculator",
		implemented: true,
	},

	// IMAGE & VISUAL TOOLS
	{
		id: "dummy-image-generator",
		name: "Dummy Image Generator",
		description: "Generate placeholder images with custom dimensions, colors, and formats (PNG, JPEG, WebP)",
		category: ToolCategory.IMAGE_VISUAL,
		route: "/tools/dummy-image-generator",
		implemented: true,
	},

	// TEXT & DATA TOOLS
	{
		id: "invisible-character-remover",
		name: "Invisible Character Remover",
		description: "Strip invisible and problematic Unicode characters from text",
		category: ToolCategory.TEXT_DATA,
		route: "/tools/invisible-character-remover",
		implemented: true,
	},
	{
		id: "html-entities",
		name: "HTML Entities Reference",
		description: "Comprehensive HTML entities reference with Unicode, Entity, CSS, and HTML codes",
		category: ToolCategory.CODE_WEB,
		route: "/tools/html-entities",
		implemented: true,
	},
	{
		id: "text-binary-converter",
		name: "Text/Binary Converter",
		description: "Convert text to binary and binary to text with ASCII and UTF-8 encoding options",
		category: ToolCategory.CODE_WEB,
		route: "/tools/text-binary-converter",
		implemented: true,
	},

	// FUN & RANDOM TOOLS
	{
		id: "dice-roller",
		name: "Dice Roller",
		description: "Roll virtual dice with D4, D6, D8, D10, D12, D20, and D100 options",
		category: ToolCategory.FUN_RANDOM,
		route: "/tools/dice-roller",
		implemented: true,
	},

	// UTILITY & CONVERSION (additional)
	{
		id: "timezone-converter",
		name: "Timezone Converter",
		description: "Convert times between timezones with visual timeline comparison",
		category: ToolCategory.UTILITY_CONVERSION,
		route: "/tools/timezone-converter",
		implemented: true,
	},
	{
		id: "kitchen-converter",
		name: "Kitchen Converter",
		description: "Convert cooking measurements between imperial and metric, with handy reference charts",
		category: ToolCategory.UTILITY_CONVERSION,
		route: "/tools/kitchen-converter",
		implemented: true,
	},
	{
		id: "distance-converter",
		name: "Distance / Length Converter",
		description: "Convert between miles, kilometers, meters, feet, yards, inches, and more",
		category: ToolCategory.UTILITY_CONVERSION,
		route: "/tools/distance-converter",
		implemented: true,
	},
	{
		id: "weight-converter",
		name: "Weight / Mass Converter",
		description: "Convert between pounds, kilograms, ounces, grams, stones, and tons",
		category: ToolCategory.UTILITY_CONVERSION,
		route: "/tools/weight-converter",
		implemented: true,
	},
	{
		id: "temperature-converter",
		name: "Temperature Converter",
		description: "Convert between Fahrenheit, Celsius, and Kelvin with reference charts",
		category: ToolCategory.UTILITY_CONVERSION,
		route: "/tools/temperature-converter",
		implemented: true,
	},
	{
		id: "area-converter",
		name: "Area Converter",
		description: "Convert between square feet, square meters, acres, hectares, and more",
		category: ToolCategory.UTILITY_CONVERSION,
		route: "/tools/area-converter",
		implemented: true,
	},
	{
		id: "volume-converter",
		name: "Volume Converter",
		description: "Convert between gallons, liters, cubic feet, fluid ounces, and more",
		category: ToolCategory.UTILITY_CONVERSION,
		route: "/tools/volume-converter",
		implemented: true,
	},
	{
		id: "aspect-ratio-calculator",
		name: "Aspect Ratio Calculator",
		description: "Calculate aspect ratios, resize dimensions, and find common presets for video and images",
		category: ToolCategory.UTILITY_CONVERSION,
		route: "/tools/aspect-ratio-calculator",
		implemented: true,
	},
	{
		id: "data-storage-converter",
		name: "Data Storage Converter",
		description: "Convert between bytes, KB, MB, GB, TB with binary (1024) and decimal (1000) modes",
		category: ToolCategory.UTILITY_CONVERSION,
		route: "/tools/data-storage-converter",
		implemented: true,
	},
	{
		id: "bandwidth-calculator",
		name: "Bandwidth Calculator",
		description: "Convert bandwidth units and calculate download times for files",
		category: ToolCategory.UTILITY_CONVERSION,
		route: "/tools/bandwidth-calculator",
		implemented: true,
	},
];

export function getToolsByCategory(category: ToolCategory): Tool[] {
	return TOOLS_REGISTRY.filter((tool) => tool.category === category);
}

export function getToolById(id: string): Tool | undefined {
	return TOOLS_REGISTRY.find((tool) => tool.id === id);
}

export function getAllCategories(): CategoryInfo[] {
	return Object.values(CATEGORIES);
}
