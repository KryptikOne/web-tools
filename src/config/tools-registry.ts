import { Tool, ToolCategory, CategoryInfo } from "@/types/tools";

export const CATEGORIES: Record<ToolCategory, CategoryInfo> = {
	[ToolCategory.COLOR_DESIGN]: {
		id: ToolCategory.COLOR_DESIGN,
		name: "Color & Design Tools",
		description: "Color pickers, generators, and CSS design utilities",
	},
	[ToolCategory.IMAGE_VISUAL]: {
		id: ToolCategory.IMAGE_VISUAL,
		name: "Image & Visual Tools",
		description: "Image processing, conversion, and manipulation tools",
	},
	[ToolCategory.CODE_WEB]: {
		id: ToolCategory.CODE_WEB,
		name: "Code & Web Development",
		description: "Developer tools for coding and web development",
	},
	[ToolCategory.UTILITY_CONVERSION]: {
		id: ToolCategory.UTILITY_CONVERSION,
		name: "Utility & Conversion",
		description: "General utilities and unit conversion tools",
	},
	[ToolCategory.TEXT_DATA]: {
		id: ToolCategory.TEXT_DATA,
		name: "Text & Data Tools",
		description: "Text processing, formatting, and data conversion utilities",
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
		id: "cubic-bezier",
		name: "Cubic Bezier Generator",
		description: "Interactive cubic bezier curve editor for CSS animations",
		category: ToolCategory.COLOR_DESIGN,
		route: "/tools/cubic-bezier",
		implemented: true,
	},
	// {
	// 	id: "palette-generator",
	// 	name: "Palette Generator",
	// 	description: "Generate color palettes and schemes",
	// 	category: ToolCategory.COLOR_DESIGN,
	// 	route: "/tools/palette-generator",
	// 	implemented: false,
	// },
	// {
	// 	id: "gradient-generator",
	// 	name: "CSS Gradient Generator",
	// 	description: "Create CSS gradients visually",
	// 	category: ToolCategory.COLOR_DESIGN,
	// 	route: "/tools/gradient-generator",
	// 	implemented: false,
	// },
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
	// {
	// 	id: "css-filter-generator",
	// 	name: "CSS Filter Generator",
	// 	description: "Generate CSS filter effects",
	// 	category: ToolCategory.COLOR_DESIGN,
	// 	route: "/tools/css-filter-generator",
	// 	implemented: false,
	// },
	// {
	// 	id: "background-pattern-generator",
	// 	name: "Background Pattern Generator",
	// 	description: "Create CSS background patterns",
	// 	category: ToolCategory.COLOR_DESIGN,
	// 	route: "/tools/background-pattern-generator",
	// 	implemented: false,
	// },

	// IMAGE & VISUAL TOOLS
	// {
	// 	id: "image-resizer",
	// 	name: "Image Resizer",
	// 	description: "Resize images to specific dimensions",
	// 	category: ToolCategory.IMAGE_VISUAL,
	// 	route: "/tools/image-resizer",
	// 	implemented: false,
	// },
	// {
	// 	id: "image-converter",
	// 	name: "Image Format Converter",
	// 	description: "Convert images between formats (PNG, JPG, WebP)",
	// 	category: ToolCategory.IMAGE_VISUAL,
	// 	route: "/tools/image-converter",
	// 	implemented: false,
	// },
	// {
	// 	id: "base64-image",
	// 	name: "Base64 Image Encoder",
	// 	description: "Convert images to Base64 strings",
	// 	category: ToolCategory.IMAGE_VISUAL,
	// 	route: "/tools/base64-image",
	// 	implemented: false,
	// },
	// {
	// 	id: "dummy-image-generator",
	// 	name: "Dummy Image Generator",
	// 	description: "Generate placeholder images",
	// 	category: ToolCategory.IMAGE_VISUAL,
	// 	route: "/tools/dummy-image-generator",
	// 	implemented: false,
	// },
	// {
	// 	id: "qr-code-generator",
	// 	name: "QR Code Generator",
	// 	description: "Generate QR codes from text or URLs",
	// 	category: ToolCategory.IMAGE_VISUAL,
	// 	route: "/tools/qr-code-generator",
	// 	implemented: false,
	// },
	// {
	// 	id: "qr-code-reader",
	// 	name: "QR Code Reader",
	// 	description: "Scan and decode QR codes",
	// 	category: ToolCategory.IMAGE_VISUAL,
	// 	route: "/tools/qr-code-reader",
	// 	implemented: false,
	// },

	// CODE & WEB DEVELOPMENT
	// {
	// 	id: "jwt-decoder",
	// 	name: "JWT Decoder",
	// 	description: "Decode and inspect JSON Web Tokens",
	// 	category: ToolCategory.CODE_WEB,
	// 	route: "/tools/jwt-decoder",
	// 	implemented: false,
	// },
	// {
	// 	id: "csp-parser",
	// 	name: "CSP Parser",
	// 	description: "Parse and validate Content Security Policy headers",
	// 	category: ToolCategory.CODE_WEB,
	// 	route: "/tools/csp-parser",
	// 	implemented: false,
	// },
	// {
	// 	id: "ogp-generator",
	// 	name: "OGP Tag Generator",
	// 	description: "Generate Open Graph Protocol meta tags",
	// 	category: ToolCategory.CODE_WEB,
	// 	route: "/tools/ogp-generator",
	// 	implemented: false,
	// },
	// {
	// 	id: "ogp-checker",
	// 	name: "OGP Checker",
	// 	description: "Check Open Graph meta tags on websites",
	// 	category: ToolCategory.CODE_WEB,
	// 	route: "/tools/ogp-checker",
	// 	implemented: false,
	// },
	// {
	// 	id: "url-encoder",
	// 	name: "URL Encoder/Decoder",
	// 	description: "Encode and decode URLs",
	// 	category: ToolCategory.CODE_WEB,
	// 	route: "/tools/url-encoder",
	// 	implemented: false,
	// },

	// UTILITY & CONVERSION
	// {
	// 	id: "password-generator",
	// 	name: "Password Generator",
	// 	description: "Generate secure random passwords",
	// 	category: ToolCategory.UTILITY_CONVERSION,
	// 	route: "/tools/password-generator",
	// 	implemented: false,
	// },
	{
		id: "epoch-converter",
		name: "Epoch Converter",
		description: "Convert Unix timestamps to dates",
		category: ToolCategory.UTILITY_CONVERSION,
		route: "/tools/epoch-converter",
		implemented: true,
	},
	// {
	// 	id: "number-base-converter",
	// 	name: "Number Base Converter",
	// 	description: "Convert between number bases (binary, octal, decimal, hex)",
	// 	category: ToolCategory.UTILITY_CONVERSION,
	// 	route: "/tools/number-base-converter",
	// 	implemented: false,
	// },
	{
		id: "px-rem-calculator",
		name: "PX/REM Calculator",
		description: "Convert between pixels and rem units",
		category: ToolCategory.UTILITY_CONVERSION,
		route: "/tools/px-rem-calculator",
		implemented: true,
	},
	// {
	// 	id: "aspect-ratio-calculator",
	// 	name: "Aspect Ratio Calculator",
	// 	description: "Calculate aspect ratios and dimensions",
	// 	category: ToolCategory.UTILITY_CONVERSION,
	// 	route: "/tools/aspect-ratio-calculator",
	// 	implemented: false,
	// },
	// {
	// 	id: "percentage-calculator",
	// 	name: "Percentage Calculator",
	// 	description: "Calculate percentages and ratios",
	// 	category: ToolCategory.UTILITY_CONVERSION,
	// 	route: "/tools/percentage-calculator",
	// 	implemented: false,
	// },
	// {
	// 	id: "ip-checker",
	// 	name: "IP Address Checker",
	// 	description: "Check your IP address and location",
	// 	category: ToolCategory.UTILITY_CONVERSION,
	// 	route: "/tools/ip-checker",
	// 	implemented: false,
	// },

	// TEXT & DATA TOOLS
	// {
	// 	id: "ascii-to-hex",
	// 	name: "ASCII to Hex",
	// 	description: "Convert ASCII text to hexadecimal format",
	// 	category: ToolCategory.TEXT_DATA,
	// 	route: "/tools/ascii-to-hex",
	// 	implemented: false,
	// },
	// {
	// 	id: "base64-encode",
	// 	name: "Base64 Encoder/Decoder",
	// 	description: "Encode and decode Base64 strings",
	// 	category: ToolCategory.TEXT_DATA,
	// 	route: "/tools/base64-encode",
	// 	implemented: false,
	// },
	// {
	// 	id: "character-counter",
	// 	name: "Character Counter",
	// 	description: "Count characters, words, and lines in text",
	// 	category: ToolCategory.TEXT_DATA,
	// 	route: "/tools/character-counter",
	// 	implemented: false,
	// },
	// {
	// 	id: "csv-to-json",
	// 	name: "CSV to JSON",
	// 	description: "Convert CSV data to JSON format",
	// 	category: ToolCategory.TEXT_DATA,
	// 	route: "/tools/csv-to-json",
	// 	implemented: false,
	// },
	// {
	// 	id: "json-formatter",
	// 	name: "JSON Formatter",
	// 	description: "Format and validate JSON data",
	// 	category: ToolCategory.TEXT_DATA,
	// 	route: "/tools/json-formatter",
	// 	implemented: false,
	// },
	// {
	// 	id: "json-to-csv",
	// 	name: "JSON to CSV",
	// 	description: "Convert JSON data to CSV format",
	// 	category: ToolCategory.TEXT_DATA,
	// 	route: "/tools/json-to-csv",
	// 	implemented: false,
	// },
	// {
	// 	id: "json-to-yaml",
	// 	name: "JSON to YAML",
	// 	description: "Convert JSON to YAML format",
	// 	category: ToolCategory.TEXT_DATA,
	// 	route: "/tools/json-to-yaml",
	// 	implemented: false,
	// },
	// {
	// 	id: "html-escape",
	// 	name: "HTML Escape/Unescape",
	// 	description: "Escape and unescape HTML entities",
	// 	category: ToolCategory.TEXT_DATA,
	// 	route: "/tools/html-escape",
	// 	implemented: false,
	// },
	// {
	// 	id: "html-tag-remover",
	// 	name: "HTML Tag Remover",
	// 	description: "Remove HTML tags from text",
	// 	category: ToolCategory.TEXT_DATA,
	// 	route: "/tools/html-tag-remover",
	// 	implemented: false,
	// },
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
		category: ToolCategory.TEXT_DATA,
		route: "/tools/html-entities",
		implemented: true,
	},
	// {
	// 	id: "sql-formatter",
	// 	name: "SQL Formatter",
	// 	description: "Format and beautify SQL queries",
	// 	category: ToolCategory.TEXT_DATA,
	// 	route: "/tools/sql-formatter",
	// 	implemented: false,
	// },
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
