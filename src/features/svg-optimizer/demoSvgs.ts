export interface DemoSvg {
	id: string;
	name: string;
	description: string;
	svg: string;
}

export const DEMO_SVGS: DemoSvg[] = [
	{
		id: "simple-icon",
		name: "Simple icon",
		description: "A clean Heroicon-style chevron — minimal optimization potential.",
		svg: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>`,
	},
	{
		id: "inkscape-export",
		name: "Inkscape export (bloated)",
		description: "Typical Inkscape output with editor metadata, sodipodi namespaces, and bloated path data.",
		svg: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- Created with Inkscape (http://www.inkscape.org/) -->
<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="100" height="100" viewBox="0 0 100 100" version="1.1" id="svg1" sodipodi:docname="circle.svg" inkscape:version="1.3 (0e150ed, 2023-07-21)">
  <sodipodi:namedview id="namedview1" pagecolor="#ffffff" bordercolor="#666666" borderopacity="1.0" inkscape:showpageshadow="2" inkscape:pageopacity="0.0" inkscape:pagecheckerboard="0" inkscape:deskcolor="#d1d1d1" inkscape:document-units="mm" inkscape:zoom="1" inkscape:cx="50" inkscape:cy="50" inkscape:window-width="1920" inkscape:window-height="1080" inkscape:window-x="0" inkscape:window-y="0" inkscape:window-maximized="0" inkscape:current-layer="svg1"/>
  <defs id="defs1"/>
  <g id="layer1">
    <circle style="fill:#1d4ed8;fill-opacity:1;stroke-width:1.0" id="path1" cx="50.000000" cy="50.000000" r="40.000000"/>
  </g>
</svg>`,
	},
	{
		id: "logo-with-text",
		name: "Logo with text",
		description: "An SVG containing both shapes and a <text> element.",
		svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" width="200" height="60">
  <rect x="0" y="0" width="200" height="60" fill="#0f172a" rx="8"/>
  <circle cx="30" cy="30" r="18" fill="#22d3ee"/>
  <text x="60" y="38" font-family="Inter, sans-serif" font-size="22" font-weight="600" fill="#f8fafc">SiteName</text>
</svg>`,
	},
	{
		id: "illustration",
		name: "Illustration (mixed shapes)",
		description: "Multiple overlapping shapes with style attributes and groups.",
		svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <g transform="translate(0,0)">
    <rect x="20" y="20" width="100" height="100" style="fill: rgb(244, 63, 94); stroke: rgb(0, 0, 0); stroke-width: 2;"/>
    <circle cx="200" cy="80" r="60" fill="#22c55e" opacity="0.8"/>
    <polygon points="280,20 340,140 220,140" fill="#3b82f6"/>
    <ellipse cx="120" cy="220" rx="80" ry="40" fill="#f59e0b"/>
    <line x1="0" y1="270" x2="400" y2="270" stroke="#1e293b" stroke-width="4"/>
  </g>
</svg>`,
	},
	{
		id: "complex-paths",
		name: "Complex paths",
		description: "Multiple path elements with potential for merging and path-data optimization.",
		svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M 10.000000 10.000000 L 30.000000 10.000000 L 30.000000 30.000000 L 10.000000 30.000000 Z" fill="#ef4444"/>
  <path d="M 40.000000 10.000000 L 60.000000 10.000000 L 60.000000 30.000000 L 40.000000 30.000000 Z" fill="#ef4444"/>
  <path d="M 70.000000 10.000000 L 90.000000 10.000000 L 90.000000 30.000000 L 70.000000 30.000000 Z" fill="#ef4444"/>
  <path d="M 10.000000 50.000000 C 20.000000 40.000000 30.000000 60.000000 40.000000 50.000000 S 60.000000 40.000000 70.000000 50.000000" stroke="#0ea5e9" fill="none" stroke-width="2"/>
</svg>`,
	},
];
