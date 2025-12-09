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
  TEXT_DATA = 'text-data',
  COLOR_DESIGN = 'color-design',
  IMAGE_VISUAL = 'image-visual',
  CODE_WEB = 'code-web',
  UTILITY_CONVERSION = 'utility-conversion'
}

export interface CategoryInfo {
  id: ToolCategory;
  name: string;
  description: string;
  icon?: string;
}
