import { SitecoreItem } from "../node-rainbow";
import File from "vinyl";

let uuidQueue: string[] = [];

// tslint:disable-next-line:max-line-length
export function nullHandler(file: File, output: SitecoreItem, outputPath: string | undefined, callback: (err?: any) => void) {
    callback();
}

export function getUuid() {
    if (uuidQueue.length === 0) {
        throw Error("Mock UUID queue depleted");
    }

    return uuidQueue.shift();
}

export function clearUuids() {
    uuidQueue = [];
}

export function enqueueUuid(...ids: string[]) {
    for (const id of ids) {
        uuidQueue.push(id);
    }
}

interface DateMock {
    (): Date;
    setDate(d: Date): void;
}

let mockDateValue: Date = new Date();

const RealDate = Date;

export function getDate(): Date {

    if (arguments.length === 0) {
        return Function.prototype.apply(RealDate, arguments);
    }

    return mockDateValue;
}

export function setDate(d: Date) {
    mockDateValue = d;
}
