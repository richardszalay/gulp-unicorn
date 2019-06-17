import * as fs from "fs";
import * as path from "path";

import File from "vinyl";

import {
    SitecoreItem,
    updateField,
    getValidItemName,
    reparentItem,
    newItem,
    loadItem,
    formatItem,
    newID,
    findField,
    SitecoreItemReference
} from "./node-rainbow";

export * from "./types";

import { Transform } from "stream";
import { FileTypeInfo, UnicornPluginOptions, OutputPathSelector } from "./types";

const FIELD_IDS = {
    ICON: "06d5295c-ed2f-4a54-9bf2-26228d113318",
    BLOB: "40e50ed9-ba07-4702-992e-a912738d32dc",
    SIZE: "6954b7c7-2487-423f-8600-436cb3b6dc0e",
    MIME_TYPE: "6f47a0a5-9c94-4b48-abeb-42d38def6054",
    EXTENSION: "c06867fe-9a43-4c7d-b739-48780492d06f",
    SORT_ORDER: "ba3f86a2-4a1c-4d78-b63d-91c2779c1b5e",
    CREATED: "25bed78c-4957-4165-998a-ca1b52f67497",
    CREATED_BY: "5dd74568-4d4b-44c1-b513-0af5f4cda34f",
};

const TEMPLATE_IDS = {
    FILE: "962b53c4-f93b-4df9-9821-415c867b8903",
};

type OptionFormats =
    string |
    OutputPathSelector |
    UnicornPluginOptions;

type OutputHandler = (file: File, output: SitecoreItem,
                      outputPath: string | undefined, callback: (error?: any) => void) => void;

export default (options: UnicornPluginOptions, handler?: OutputHandler) =>
    new UnicornTransform(options, handler) as Transform;

export const write = (options: UnicornPluginOptions) => new UnicornTransform(options, writeOutput) as Transform;
export const transform = (options: UnicornPluginOptions) => new UnicornTransform(options, transformOutput) as Transform;

class UnicornTransform extends Transform {

    private handler: OutputHandler;
    private options: UnicornPluginOptions;

    constructor(options: OptionFormats, handler?: OutputHandler) {
        super({objectMode: true});

        if (typeof options === "string" || typeof options === "function") {
            this.options = {
                outputPath: options
            };
        } else {
            this.options = options;
        }

        this.handler = handler || writeOutput;
    }

    _transform(chunk: File, encoding: string, callback: (err?: any) => void) {

        const filename = path.basename(chunk.path);
        const fileInfo = getFileTypeInfo(filename, this.options);
        const parentItem = getParentItem(fileInfo, this.options);

        const outputPath = resolveOutputPath(this.options, fileInfo);
        const unicornItem = getTargetItem(fileInfo, parentItem, outputPath);

        updateSitecoreItem(unicornItem, chunk.contents, fileInfo, this.options);

        this.handler(chunk, unicornItem, outputPath, callback);
    }
}

function getParentItem(info: FileTypeInfo, options: UnicornPluginOptions): SitecoreItemReference {

    const parentReference = resolveParentItem(options, info);

    if (typeof parentReference === "string") {
        return loadParent(info.filename, parentReference) as SitecoreItemReference;
    }

    return parentReference;
}

function loadParent(itemPath: string, parentPath: string) {
    if (!fs.existsSync(parentPath)) {
        throw new Error(`Could not find parent Unicorn YML for ${itemPath} at ${parentPath}`);
    }

    return loadItem(parentPath);
}

function getTargetItem(info: FileTypeInfo, parentItem: SitecoreItemReference, outputPath?: string): SitecoreItem {

    const partialItem = (outputPath && fs.existsSync(outputPath)) ?
        loadItem(outputPath) :
        newItem(info.templateId);

    const unicornItem = reparentItem(partialItem, parentItem, info.name);

    return unicornItem;
}

function updateSitecoreItem(item: SitecoreItem, input: any,
                            fileInfo: FileTypeInfo, options: UnicornPluginOptions) {

    item.Template = fileInfo.templateId;

    if (!Buffer.isBuffer(input)) {
        if (typeof input === "string") {
            input = new Buffer(input); // Older node versions
        } else {
            input = Buffer.from(input);
        }
    }

    if (!item.SharedFields) {
        item.SharedFields = [];
    }

    if (fileInfo.icon) {
        updateField(item.SharedFields, {
            ID: FIELD_IDS.ICON,
            Hint: "__Icon",
            Value: fileInfo.icon
        });
    }

    const newBlobValue = input.toString("base64");
    const blobField = findField(item.SharedFields, FIELD_IDS.BLOB);

    if (!blobField || blobField.Value !== newBlobValue) {
        updateField(item.SharedFields, {
            ID: FIELD_IDS.BLOB,
            Hint: "Blob",
            BlobID: newID(),
            Value: input.toString("base64")
        });
    }

    updateField(item.SharedFields, {
        ID: FIELD_IDS.SIZE,
        Hint: "Size",
        Value: input.length
    });

    updateField(item.SharedFields, {
        ID: FIELD_IDS.MIME_TYPE,
        Hint: "Mime Type",
        Value: fileInfo.mimeType
    });

    updateField(item.SharedFields, {
        ID: FIELD_IDS.SORT_ORDER,
        Hint: "__Sortorder",
        Value: 10
    });

    updateField(item.SharedFields, {
        ID: FIELD_IDS.EXTENSION,
        Hint: "Extension",
        Value: fileInfo.extension
    });

    if (options.populateSitecoreItem) {
        options.populateSitecoreItem(item);
    }
}

const KnownMimeTypes: {[name: string]: string} = {
    ".js": "application/x-javascript",
    ".css": "text/css",
    ".map": "application/json"
};

function getFileTypeInfo(filename: string, options: UnicornPluginOptions): FileTypeInfo {

    const targetFile = changeExtension(filename, ".yml");
    const extension = path.extname(filename);
    const name = getValidItemName(path.basename(filename, extension));

    const info = {
        filename: targetFile,
        name,
        extension: extension.replace(/\.(.+)/, "$1"),
        templateId: TEMPLATE_IDS.FILE,
        mimeType: KnownMimeTypes[extension] || "application/octet-stream"
    };

    if (options.getFileTypeInfo) {
        return options.getFileTypeInfo(filename, info) || info;
    }

    return info;
}

function changeExtension(source: string, ext: string) {
    const basename = path.basename(source, path.extname(source)) + ext;
    return path.join(path.dirname(source), basename);
}

function resolveParentItem(options: UnicornPluginOptions, info: FileTypeInfo) {
    if (options.parentItem) {
        const parentItem = typeof options.parentItem === "string"
                ? options.parentItem
                : options.parentItem(info);

        return parentItem;
    }

    if (options.outputPath) {
        const outputDir = typeof options.outputPath === "string"
                ? options.outputPath
                : options.outputPath(info);

        return outputDir + ".yml";
    }

    throw new Error(`Cannot resolve parent Sitecore item for ${info.filename}`);
}

function resolveOutputPath(options: UnicornPluginOptions, info: FileTypeInfo): string | undefined {

    if (options.outputPath !== undefined) {
        const outputDir = typeof options.outputPath === "string"
            ? options.outputPath
            : options.outputPath(info);

        return path.join(outputDir, info.filename);
    }

    if (options.parentItem !== undefined) {
        const parentItem = typeof options.parentItem === "string"
            ? options.parentItem
            : options.parentItem(info);

        if (typeof parentItem === "string") {
            const parentDir = path.dirname(parentItem);
            const parentName = path.basename(parentItem, path.extname(parentItem));

            return path.join(parentDir, parentName, info.filename);
        }
    }
}

function writeOutput(file: File, output: SitecoreItem, outputPath: string | undefined, callback: (err?: any) => void) {

    const content = formatItem(output);

    if (outputPath === undefined) {
        throw new Error(`Cannot write unicorn output for ${file.basename} without parentItem or ` +
            "outputPath resolving to a string path");
    }

    fs.writeFile(outputPath, content, "utf8", callback);
}

// tslint:disable-next-line:max-line-length
function transformOutput(file: File, output: SitecoreItem, outputPath: string | undefined, callback: (err?: any) => void) {
    file.filename = path.basename(file.path, file.extname);
    file.contents = Buffer.from(formatItem(output));
    callback();
}
