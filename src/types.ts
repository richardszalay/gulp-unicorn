import { SitecoreItem } from "./node-rainbow";

export { SitecoreItem, ItemField, ItemLanguage, ItemVersion, OrphanSitecoreItem } from "./node-rainbow";

export interface FileTypeInfo {
    filename: string;
    name: string;
    extension: string;
    mimeType: string;
    templateId: string;
    icon?: string;
}

export type OutputPathSelector = (fileTypeInfo: FileTypeInfo) => string;

export type ParentItemSelector = (fileTypeInfo: FileTypeInfo) => string | { ID: string, Path: string };

export interface UnicornPluginOptions {
    outputPath?: string | OutputPathSelector;

    parentItem?: string | ParentItemSelector;

    getFileTypeInfo?(assetPath: string, info: FileTypeInfo): FileTypeInfo | undefined;

    populateSitecoreItem?(item: SitecoreItem): void;
}
