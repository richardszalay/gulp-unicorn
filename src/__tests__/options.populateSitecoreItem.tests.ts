
import { parseItem } from "../node-rainbow";

import { getUuid, enqueueUuid, getDate, setDate, nullHandler } from "./mocks";

jest.mock("uuid/v4", () => () => getUuid());

import File from "vinyl";
import { transform } from "..";
import { UnicornPluginOptions } from "../types";

describe("populateSitecoreItem options", () => {

    let file: File;

    beforeEach(() => {
        file = new File({
            path: __dirname + `/fixtures/parent1/test.js`,
            contents: Buffer.from("function foo2(bar) { return bar; }")
        });

        enqueueUuid("aaa", "bbb");
        Date.now = () => new Date("2018-01-02T03:04:05Z").valueOf();
    });

    it("can override file info properties", async () => {
        const options: UnicornPluginOptions = {
            outputPath: __dirname + "/fixtures/parent1",

            getFileTypeInfo(filename, info) {
                info.name += "2";
                return info;
            },

            populateSitecoreItem(item) {
                item.Path += "2";
            }
        };

        await new Promise((res, rej) => transform(options)._transform(file, "utf8", res));

        const result = parseItem(file.contents!.toString());

        expect(result).toMatchObject({
            Path: "/content/Parent1/test22"
        });
    });

    it("can add fields", async () => {
        const options: UnicornPluginOptions = {
            outputPath: __dirname + "/fixtures/parent1",

            populateSitecoreItem(item) {
                item.SharedFields.push({
                    ID: "111222",
                    Hint: "Custom",
                    Value: "Value"
                });
            }
        };

        await new Promise((res, rej) => transform(options)._transform(file, "utf8", res));

        const result = parseItem(file.contents!.toString());

        const field = result.SharedFields.find((f) => f.Hint === "Custom");

        expect(field).toMatchObject({
            ID: "111222",
            Hint: "Custom",
            Value: "Value"
        });
    });
});
