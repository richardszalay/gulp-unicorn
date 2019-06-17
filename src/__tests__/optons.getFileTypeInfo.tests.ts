
import { parseItem } from "../node-rainbow";

import { getUuid, enqueueUuid, getDate, setDate } from "./mocks";
import { transform, UnicornPluginOptions } from "..";

jest.mock("uuid/v4", () => () => getUuid());

import File from "vinyl";

describe("getFileTypeInfo options", () => {

    let file: File;

    beforeEach(() => {
        file = new File({
            path: __dirname + `/fixtures/parent1/test.js`,
            contents: Buffer.from("function foo2(bar) { return bar; }")
        });

        enqueueUuid("aaa", "bbb");
        Date.now = () => new Date("2018-01-02T03:04:05Z").valueOf();
    });

    it("can change the item name", async () => {
        const options: UnicornPluginOptions = {
            outputPath: __dirname + "/fixtures/parent1",

            getFileTypeInfo(filename, info) {
                info.name += "2";
                return info;
            }
        };

        await new Promise((res, rej) => transform(options)._transform(file, "utf8", res));

        const result = parseItem(file.contents!.toString());

        await expect(result).toMatchObject({
            Path: "/content/Parent1/test2"
        });
    });

    it("can change the template id", async () => {
        const options: UnicornPluginOptions = {
            outputPath: __dirname + "/fixtures/parent1",

            getFileTypeInfo(filename, info) {
                info.templateId = "aaabbbccc";
                return info;
            }
        };

        await new Promise((res, rej) => transform(options)._transform(file, "utf8", res));

        const result = parseItem(file.contents!.toString());

        await expect(result).toMatchObject({
            Template: "aaabbbccc"
        });
    });

    it("can change the template id for existing items", async () => {

        file.path = __dirname + `/fixtures/parent1/child1.js`;

        const options: UnicornPluginOptions = {
            outputPath: __dirname + "/fixtures/parent1",

            getFileTypeInfo(filename, info) {
                info.templateId = "aaabbbccc";
                return info;
            }
        };

        await new Promise((res, rej) => transform(options)._transform(file, "utf8", res));

        const result = parseItem(file.contents!.toString());

        await expect(result).toMatchObject({
            Template: "aaabbbccc"
        });
    });

    it("can change the mimetype", async () => {
        const options: UnicornPluginOptions = {
            outputPath: __dirname + "/fixtures/parent1",

            getFileTypeInfo(filename, info) {
                info.mimeType = "text/custom";
                return info;
            }
        };

        await new Promise((res, rej) => transform(options)._transform(file, "utf8", res));

        const result = parseItem(file.contents!.toString());

        const field = result.SharedFields.find((f) => f.Hint === "Mime Type");

        expect(field!.Value).toEqual("text/custom");
    });

    it("can change the icon", async () => {
        const options: UnicornPluginOptions = {
            outputPath: __dirname + "/fixtures/parent1",

            getFileTypeInfo(filename, info) {
                info.icon = "/icon.png";
                return info;
            }
        };

        await new Promise((res, rej) => transform(options)._transform(file, "utf8", res));

        const result = parseItem(file.contents!.toString());

        const field = result.SharedFields.find((f) => f.Hint === "__Icon");

        expect(field!.Value).toEqual("/icon.png");
    });

    it("can change the extension", async () => {
        const options: UnicornPluginOptions = {
            outputPath: __dirname + "/fixtures/parent1",

            getFileTypeInfo(filename, info) {
                info.extension = "css";
                return info;
            }
        };

        await new Promise((res, rej) => transform(options)._transform(file, "utf8", res));

        const result = parseItem(file.contents!.toString());

        const field = result.SharedFields.find((f) => f.Hint === "Extension");

        expect(field!.Value).toEqual("css");
    });
});
