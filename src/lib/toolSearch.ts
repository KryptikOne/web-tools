import type { Tool } from "@/types/tools";

/**
 * Score how well one search term matches a tool. Higher is better, 0 is no match.
 * Name prefix > word prefix > name substring > route > category name > description.
 */
function scoreTerm(tool: Tool, nameLower: string, categoryName: string, term: string): number {
	if (nameLower.startsWith(term)) return 100;
	if (nameLower.split(/[^a-z0-9.]+/).some((w) => w.startsWith(term))) return 70;
	if (nameLower.includes(term)) return 50;
	if (tool.route.toLowerCase().includes(term)) return 40;
	if (categoryName.includes(term)) return 20;
	if (tool.description.toLowerCase().includes(term)) return 12;
	return 0;
}

/**
 * Multi-term tool search. Every whitespace-separated term must match somewhere;
 * results are ordered best first, with shorter names winning ties.
 *
 * @param categoryNames - Optional category id to display-name map so terms like "security" match.
 */
export function searchTools(query: string, tools: readonly Tool[], categoryNames: Record<string, string> = {}): Tool[] {
	const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
	if (!terms.length) return [];

	const scored: { score: number; tool: Tool }[] = [];
	for (const tool of tools) {
		const nameLower = tool.name.toLowerCase();
		const categoryName = (categoryNames[tool.category] ?? "").toLowerCase();
		let score = 0;
		for (const term of terms) {
			const s = scoreTerm(tool, nameLower, categoryName, term);
			if (!s) {
				score = 0;
				break;
			}
			score += s;
		}
		if (score) scored.push({ score: score - tool.name.length * 0.1, tool });
	}
	return scored.sort((a, b) => b.score - a.score).map((s) => s.tool);
}
