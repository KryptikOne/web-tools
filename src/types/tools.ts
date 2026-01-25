export interface Tool {
	id: string;
	name: string;
	description: string;
	category: ToolCategory;
	route: string;
	icon?: string;
	implemented?: boolean;
}

export enum ToolCategory {
	CODE_WEB = "code-web",
	COLOR_DESIGN = "color-design",
	UTILITY_CONVERSION = "utility-conversion",
	TEXT_DATA = "text-data",
	IMAGE_VISUAL = "image-visual",
	FUN_RANDOM = "fun-random",
}

export interface CategoryInfo {
	id: ToolCategory;
	name: string;
	description: string;
	icon?: string;
}
