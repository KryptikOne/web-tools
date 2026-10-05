/** figlet "ANSI Shadow" renderings of the wordmark, drawn cell-by-cell by the glyph field. */
export const WORDMARK_WIDE = [
	"██████╗ ██╗████████╗████████╗██████╗  ██████╗ ████████╗████████╗",
	"██╔══██╗██║╚══██╔══╝╚══██╔══╝██╔══██╗██╔═══██╗╚══██╔══╝╚══██╔══╝",
	"██████╔╝██║   ██║      ██║   ██████╔╝██║   ██║   ██║      ██║   ",
	"██╔══██╗██║   ██║      ██║   ██╔══██╗██║   ██║   ██║      ██║   ",
	"██████╔╝██║   ██║      ██║   ██████╔╝╚██████╔╝   ██║      ██║   ",
	"╚═════╝ ╚═╝   ╚═╝      ╚═╝   ╚═════╝  ╚═════╝    ╚═╝      ╚═╝   ",
];

/** Two-line version for narrow screens. */
export const WORDMARK_STACKED = [
	"██████╗ ██╗████████╗████████╗",
	"██╔══██╗██║╚══██╔══╝╚══██╔══╝",
	"██████╔╝██║   ██║      ██║   ",
	"██╔══██╗██║   ██║      ██║   ",
	"██████╔╝██║   ██║      ██║   ",
	"╚═════╝ ╚═╝   ╚═╝      ╚═╝   ",
	"",
	"██████╗  ██████╗ ████████╗████████╗",
	"██╔══██╗██╔═══██╗╚══██╔══╝╚══██╔══╝",
	"██████╔╝██║   ██║   ██║      ██║   ",
	"██╔══██╗██║   ██║   ██║      ██║   ",
	"██████╔╝╚██████╔╝   ██║      ██║   ",
	"╚═════╝  ╚═════╝    ╚═╝      ╚═╝   ",
];

/** Small suffix drawn on the baseline after the last letter row. */
export const WORDMARK_SUFFIX = ".dev";

export function artWidth(art: readonly string[]): number {
	return Math.max(...art.map((line) => Array.from(line).length));
}
