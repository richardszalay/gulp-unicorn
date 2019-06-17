
import { transform } from "..";
import File from "vinyl";

import { getUuid, enqueueUuid, getDate, setDate, clearUuids } from "./mocks";

import { parseItem } from "../node-rainbow";

jest.mock("uuid/v4", () => () => getUuid());

describe("default options", () => {

    beforeEach(() => {
        clearUuids();
    });

    it("creates item if it doesn't exist", async () => {
        const file = new File({
            path: __dirname + `/fixtures/parent1/test.js`,
            contents: Buffer.from("function foo(bar) { return bar; }")
        });

        enqueueUuid("aaa", "bbb");
        Date.now = () => new Date("2018-01-02T03:04:05Z").valueOf();

        await new Promise((res, rej) => transform({
            outputPath: __dirname + "/fixtures/parent1"
        })._transform(file, "utf8", res));

        expect(file.contents.toString())
            .toMatchSnapshot("new");
    });

    it("updates item if it already exists", async () => {
        const file = new File({
            path: __dirname + `/fixtures/parent1/child1.js`,
            contents: Buffer.from("function foo(bar) { return bar; }")
        });

        enqueueUuid("aaa", "bbb");
        Date.now = () => new Date("2018-01-02T03:04:05Z").valueOf();

        await new Promise((res, rej) => transform({
            outputPath: __dirname + "/fixtures/parent1"
        })._transform(file, "utf8", res));

        expect(file.contents.toString())
            .toMatchSnapshot("exists");
    });

    it("does not generate a new blobID if the blob value hasn't changed", async () => {
        const file = new File({
            path: __dirname + `/fixtures/parent1/child1.js`,
            contents: Buffer.from("function foo(bar) { return bar; }")
        });

        enqueueUuid("aaa", "bbb");
        Date.now = () => new Date("2018-01-02T03:04:05Z").valueOf();

        await new Promise((res, rej) => transform({
            outputPath: __dirname + "/fixtures/parent1"
        })._transform(file, "utf8", res));

        const resultItem = parseItem(file.contents.toString());

        const blobField = resultItem.SharedFields.find((f) => f.Hint === "Blob");

        expect(blobField!.BlobID).toBe("ORIGINAL_BLOB_ID");
    });

    it("generates a new blobID if the blob value has changed", async () => {
        const file = new File({
            path: __dirname + `/fixtures/parent1/child1.js`,
            contents: Buffer.from("function foo2(bar) { return bar; }")
        });

        enqueueUuid("NEW_BLOB_ID");
        Date.now = () => new Date("2018-01-02T03:04:05Z").valueOf();

        await new Promise((res, rej) => transform({
            outputPath: __dirname + "/fixtures/parent1"
        })._transform(file, "utf8", res));

        const resultItem = parseItem(file.contents.toString());

        const blobField = resultItem.SharedFields.find((f) => f.Hint === "Blob");

        expect(blobField!.BlobID).toBe("NEW_BLOB_ID");
    });
});
