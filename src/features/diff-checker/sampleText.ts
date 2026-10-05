/**
 * "Sample" button content. Each change exercises one Diff Checker feature:
 * - SEARCH_DELAY_MS 3000 → 300: a single-character change (try Words vs Chars)
 * - "Kitchen-converter" casing: hidden by "Ignore case"
 * - UNIT_CONVERTERS → KITCHEN: a changed word inside a line
 * - sortTools indentation (tab → spaces): hidden by "Ignore whitespace" / "Trim lines"
 * - legacyToolUrl: removed lines; isNewTool: added lines
 * - formatToolName: moved as-is; searchTools: moved and edited
 * - The doc comment + groupByCategory: unchanged lines that collapse
 */

export const SAMPLE_NAMES = { left: "toolHelpers.old.ts", right: "toolHelpers.ts" };

export const SAMPLE_ORIGINAL = `/**
 * Tool registry helpers.
 * Shared by the sidebar, search and the home page.
 */
import { ToolCategory, type Tool } from "@/types/tools";

const MAX_RESULTS = 20;
const SEARCH_DELAY_MS = 3000;
export const FEATURED = ["diff-checker", "color-picker", "Kitchen-converter"];

export function formatToolName(tool: Tool): string {
	const label = tool.name.trim();
	return label.length > 24 ? \`\${label.slice(0, 24)}…\` : label;
}

export function isKitchenTool(tool: Tool): boolean {
	return tool.category === ToolCategory.UNIT_CONVERTERS;
}

export function sortTools(tools: Tool[]): Tool[] {
	return [...tools].sort((a, b) => a.name.localeCompare(b.name));
}

export function legacyToolUrl(tool: Tool): string {
	return \`/legacy/\${tool.id}.html\`;
}

export function searchTools(tools: Tool[], query: string): Tool[] {
	const needle = query.toLowerCase();
	const matches = tools.filter((tool) => tool.name.toLowerCase().includes(needle));
	return matches.slice(0, MAX_RESULTS);
}

/**
 * Group tools by category, keeping registry order
 * within each group.
 */
export function groupByCategory(tools: Tool[]): Map<ToolCategory, Tool[]> {
	const groups = new Map<ToolCategory, Tool[]>();
	for (const tool of tools) {
		const list = groups.get(tool.category) ?? [];
		list.push(tool);
		groups.set(tool.category, list);
	}
	return groups;
}`;

export const SAMPLE_MODIFIED = `/**
 * Tool registry helpers.
 * Shared by the sidebar, search and the home page.
 */
import { ToolCategory, type Tool } from "@/types/tools";

const MAX_RESULTS = 20;
const SEARCH_DELAY_MS = 300;
export const FEATURED = ["diff-checker", "color-picker", "kitchen-converter"];

export function isKitchenTool(tool: Tool): boolean {
	return tool.category === ToolCategory.KITCHEN;
}

export function sortTools(tools: Tool[]): Tool[] {
    return [...tools].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Group tools by category, keeping registry order
 * within each group.
 */
export function groupByCategory(tools: Tool[]): Map<ToolCategory, Tool[]> {
	const groups = new Map<ToolCategory, Tool[]>();
	for (const tool of tools) {
		const list = groups.get(tool.category) ?? [];
		list.push(tool);
		groups.set(tool.category, list);
	}
	return groups;
}

export function searchTools(tools: Tool[], query: string): Tool[] {
	const needle = query.trim().toLowerCase();
	const matches = tools.filter((tool) => tool.name.toLowerCase().includes(needle));
	return matches.slice(0, MAX_RESULTS);
}

export function isNewTool(tool: Tool, since: Date): boolean {
	return tool.addedAt !== undefined && tool.addedAt > since;
}

export function formatToolName(tool: Tool): string {
	const label = tool.name.trim();
	return label.length > 24 ? \`\${label.slice(0, 24)}…\` : label;
}`;
