import readdirp from "readdirp";
import path from "path";
import { Argument } from "./Command";
import Eris from "eris";
import { Client } from "./Client";

export function equalsCaseInsensitive(a: string, b: string) {
    return a.toUpperCase() === b.toUpperCase();
}

export async function* iterateImport(directory: string) {
    for await (const entry of readdirp(directory, { fileFilter: "*.js" })) {
        const entryPath = path.join(directory, entry.path);
        var obj = require(entryPath);

        if (obj.default) obj = obj.default;

        yield {
            entryPath,
            obj
        };
    }
}

export async function parseArgs(client: Client, msg: Eris.Message, declared: Argument[], given: string[]) {
    const parsedArgs = [];

    for (const idx in declared) {
        const arg = declared[idx];

        if (!given[0] && !arg.optional) {
            msg.channel.createMessage(`Not enough arguments, ${declared.length} required`);
            return;
        }

        if (!client.argParsers[arg.type]) throw new ReferenceError(`Parser for argument type ${arg.type} does not exist.`);
        
        const parsed = await client.argParsers[arg.type](msg, given[0]);

        if (!parsed) {
            if (!arg.optional) {
                msg.channel.createMessage(`Argument ${idx}: Required type ${arg.type}`);
                return;
            } else {
                parsedArgs.push(undefined);
            }
        } else {
            parsedArgs.push(parsed);
            given.shift();
        }
    }

    return {
        given, parsed: parsedArgs
    };
}