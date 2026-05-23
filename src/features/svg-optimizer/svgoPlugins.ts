export interface PluginMeta {
	id: string;
	label: string;
	description: string;
	defaultOn: boolean;
	a11yWarning?: boolean;
}

export const SVGO_PLUGINS: PluginMeta[] = [
	// Default-on (part of preset-default in SVGO v3)
	{ id: "removeDoctype", label: "Remove DOCTYPE", description: "Remove the <!DOCTYPE> declaration from the SVG.", defaultOn: true },
	{ id: "removeXMLProcInst", label: "Remove XML processing instructions", description: "Remove the <?xml ... ?> declaration.", defaultOn: true },
	{ id: "removeComments", label: "Remove comments", description: "Remove all XML comments.", defaultOn: true },
	{ id: "removeMetadata", label: "Remove metadata", description: "Remove <metadata> elements.", defaultOn: true },
	{ id: "removeEditorsNSData", label: "Remove editor namespace data", description: "Strip editor-specific namespaced attributes (Inkscape, Sketch, Adobe).", defaultOn: true },
	{ id: "cleanupAttrs", label: "Cleanup attributes", description: "Normalize whitespace and line breaks in attribute values.", defaultOn: true },
	{ id: "mergeStyles", label: "Merge styles", description: "Merge multiple <style> elements into one.", defaultOn: true },
	{ id: "inlineStyles", label: "Inline styles", description: "Move CSS rules into matching elements as attributes.", defaultOn: true },
	{ id: "minifyStyles", label: "Minify styles", description: "Minify <style> content using CSSO.", defaultOn: true },
	{ id: "cleanupIds", label: "Cleanup IDs", description: "Remove unused IDs and minify referenced ones.", defaultOn: true },
	{ id: "removeUselessDefs", label: "Remove useless defs", description: "Remove <defs> entries without IDs that aren't referenced.", defaultOn: true },
	{ id: "cleanupNumericValues", label: "Cleanup numeric values", description: "Round floats and remove default px units.", defaultOn: true },
	{ id: "convertColors", label: "Convert colors", description: "Convert rgb() to #hex, shorten hex where possible, name colors.", defaultOn: true },
	{ id: "removeUnknownsAndDefaults", label: "Remove unknowns and defaults", description: "Strip unknown attributes and attributes set to their default value.", defaultOn: true },
	{ id: "removeNonInheritableGroupAttrs", label: "Remove non-inheritable group attrs", description: "Remove non-inheritable presentation attributes from groups.", defaultOn: true },
	{ id: "removeUselessStrokeAndFill", label: "Remove useless stroke/fill", description: "Remove stroke and fill when they have no visible effect.", defaultOn: true },
	{ id: "cleanupEnableBackground", label: "Cleanup enable-background", description: "Remove or fix the enable-background attribute.", defaultOn: true },
	{ id: "removeHiddenElems", label: "Remove hidden elements", description: "Remove elements with display:none, zero opacity, or off-canvas position.", defaultOn: true },
	{ id: "removeEmptyText", label: "Remove empty text", description: "Remove empty <text>, <tspan>, and <tref> elements.", defaultOn: true },
	{ id: "convertShapeToPath", label: "Convert shapes to paths", description: "Convert <rect>, <line>, <polygon>, <polyline> to <path>.", defaultOn: true },
	{ id: "convertEllipseToCircle", label: "Convert ellipse to circle", description: "Convert <ellipse> with equal radii to <circle>.", defaultOn: true },
	{ id: "moveElemsAttrsToGroup", label: "Move element attrs to group", description: "Move common attributes from children up to their parent group.", defaultOn: true },
	{ id: "moveGroupAttrsToElems", label: "Move group attrs to elements", description: "Inverse of above when only one child or attrs conflict.", defaultOn: true },
	{ id: "collapseGroups", label: "Collapse groups", description: "Collapse useless <g> wrappers.", defaultOn: true },
	{ id: "convertPathData", label: "Convert path data", description: "Optimize and shorten path 'd' attributes.", defaultOn: true },
	{ id: "convertTransform", label: "Convert transforms", description: "Collapse multiple transforms into one and shorten matrix notation.", defaultOn: true },
	{ id: "removeEmptyAttrs", label: "Remove empty attrs", description: "Remove attributes with empty string values.", defaultOn: true },
	{ id: "removeEmptyContainers", label: "Remove empty containers", description: "Remove empty <g>, <defs>, and similar containers.", defaultOn: true },
	{ id: "mergePaths", label: "Merge paths", description: "Merge adjacent compatible <path> elements.", defaultOn: true },
	{ id: "removeUnusedNS", label: "Remove unused namespaces", description: "Remove xmlns declarations that aren't referenced.", defaultOn: true },
	{ id: "sortAttrs", label: "Sort attributes", description: "Sort element attributes alphabetically for consistent output.", defaultOn: true },
	{ id: "sortDefsChildren", label: "Sort defs children", description: "Sort children of <defs> for consistent output.", defaultOn: true },
	{ id: "removeDesc", label: "Remove <desc>", description: "Remove <desc> elements (descriptions, often editor metadata).", defaultOn: true, a11yWarning: true },

	// Default-on in SVGO preset-default (verified empirically)
	{ id: "removeViewBox", label: "Remove viewBox", description: "Remove the viewBox attribute. Breaks responsive scaling — avoid for icons.", defaultOn: true, a11yWarning: true },
	{ id: "removeTitle", label: "Remove <title>", description: "Remove <title> elements (alt-text equivalent for screen readers).", defaultOn: true, a11yWarning: true },

	// Default-off (opt-in)
	{ id: "removeDimensions", label: "Remove width/height", description: "Remove root width and height when viewBox is present.", defaultOn: false, a11yWarning: true },
	{ id: "removeRasterImages", label: "Remove raster images", description: "Remove embedded raster images (PNG, JPEG).", defaultOn: false },
	{ id: "removeOffCanvasPaths", label: "Remove off-canvas paths", description: "Remove path elements drawn outside the viewBox.", defaultOn: false },
	{ id: "removeStyleElement", label: "Remove <style>", description: "Remove all <style> elements entirely.", defaultOn: false },
	{ id: "removeScriptElement", label: "Remove scripts", description: "Remove all <script> elements.", defaultOn: false },
	{ id: "removeXMLNS", label: "Remove xmlns", description: "Remove root xmlns attribute (use for inline-HTML SVGs only).", defaultOn: false },
	{ id: "reusePaths", label: "Reuse paths", description: "Find duplicate paths and replace with <use> references.", defaultOn: false },
	{ id: "prefixIds", label: "Prefix IDs", description: "Add a prefix to every ID (helps when inlining multiple SVGs).", defaultOn: false },
];

export const DEFAULT_ENABLED_PLUGIN_IDS = new Set(
	SVGO_PLUGINS.filter((p) => p.defaultOn).map((p) => p.id)
);

export const ALL_PLUGIN_IDS = SVGO_PLUGINS.map((p) => p.id);
