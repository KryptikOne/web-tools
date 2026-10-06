export interface Tool {
	id: string;
	name: string;
	description: string;
	/** 110–160 char search/AI description. Falls back to `description`. */
	seoDescription?: string;
	category: ToolCategory;
	route: string;
	icon?: string;
	implemented?: boolean;
}

export enum ToolCategory {
	CSS_DESIGN = "css-design",
	IMAGE_MEDIA = "image-media",
	TEXT_DATA = "text-data",
	ENCODING_DATA = "encoding-data",
	WEB_DEV = "web-dev",
	UNIT_CONVERTERS = "unit-converters",
	CALCULATORS_TIME = "calculators-time",
	SECURITY_CRYPTO = "security-crypto",
	NETWORK = "network",
	KITCHEN = "kitchen",
}

export interface CategoryInfo {
	id: ToolCategory;
	name: string;
	description: string;
	icon?: string;
}
