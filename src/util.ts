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
        let obj = require(entryPath);

        if (obj.default) obj = obj.default;

        yield {
            entryPath,
            obj
        };
    }
}

export async function parseArgs(client: Client, msg: Eris.Message, declared: Argument[], given: string[]) {
    const parsedArgs = {};

    for (const idx in declared) {
        const arg = declared[idx];

        if (!given[0]) {
            if (arg.optional) {
                continue;
            } else {
                msg.channel.createMessage(`Not enough arguments, ${declared.filter(a => !a.optional).length} required`);
                return;
            }
        }

        if (!client.argParsers[arg.type]) throw new ReferenceError(`Parser for argument type ${arg.type} does not exist.`);

        const parserObj = client.argParsers[arg.type];
        const parse = typeof parserObj === "function" ? parserObj : parserObj.parse;

        if (arg.acceptMultiple) {
            const allParsed = [];

            if (!given[0])
                return;

            const toParse = given.shift().split(arg.delimiter || ";");

            for (let i = 0; i < Math.min(toParse.length, arg.limit || 5); i++) {
                const parsed = await parse(msg, toParse[i], arg);

                if (!parsed) {
                    msg.channel.createMessage(`Argument ${idx}: Provided value ${toParse[i]} is invalid`);
                    return;
                }

                allParsed.push(parsed);
            }

            parsedArgs[arg.name] = allParsed;
            continue;
        }

        const parsed = await parse(msg, given[0], arg);

        if (!parsed) {
            if (!arg.optional) {
                msg.channel.createMessage(`Argument ${idx}: Required type ${parserObj.getName ? parserObj.getName(arg) : arg.type}`);
                return;
            }
        } else {
            parsedArgs[arg.name] = parsed;
            given.shift();
        }
    }

    return {
        given, parsed: parsedArgs
    };
}