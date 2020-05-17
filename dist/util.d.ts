import { Argument } from "./Command";
import Eris from "eris";
import { Client } from "./Client";
export declare function equalsCaseInsensitive(a: string, b: string): boolean;
export declare function iterateImport(directory: string): AsyncGenerator<{
    entryPath: string;
    obj: any;
}, void, unknown>;
export declare function parseArgs(client: Client, msg: Eris.Message, declared: Argument[], given: string[]): Promise<{
    given: string[];
    parsed: any[];
}>;
