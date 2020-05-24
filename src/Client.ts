import Eris from "eris";
require("eris-additions")(Eris);
import CommandRegistry from "./CommandRegistry";
import path from "path";
import Logger from "another-logger";
import { iterateImport } from "./util";
import defaultArgParser from "./DefaultArgParser";
import HelpCommand from "./HelpCommand";
import chokidar from "chokidar";

/**
 * Additional options required by this library.
 */
export interface ExtendedOptions {
    /**
     * The ID of the owner
     */
    owner: string,
    /**
     * A function taking in an [Eris Message](https://abal.moe/Eris/docs/Message)
     * and returning an array of prefix strings, or a string representing the only prefix.
     * 
     * `@mention` is replaced with the bot mention.
     */
    prefix: Function | string,
    /**
     * Whether the bot should be run in "development mode".
     * 
     * This means commands will automatically reload on save,
     * and logs with level `debug` will be shown.
     */
    development?: boolean,
    /**
     * A custom logger to use in place of another-logger.
     */
    logger?: Logger,
    /**
     * A custom set of argument parsers.
     * 
     * Every object key should be the name of a parser, included for use in {@link CommandOptions.arguments}
     * 
     * Each function should take in an Eris message and one argument string, and return undefined if the argument was invalid,
     * or the value to be included in the parsed arguments.
     */
    argParsers?: {
        [key: string]: Function
    },
    /**
     * A list of command categories to be included in the default help command.
     * 
     * For a command to be included in a category, see {@link CommandOptions.category}
     */
    categories?: [
        {
            id: string,
            title: string,
            description: string
        }
    ],
    /**
     * Whether the bot should register default commands like the help command.
     */
    defaultCommands?: boolean
}

/**
 * Custom loggers must have these properties.
 * 
 * Each log level should be a function that takes in a string.
 * 
 * By default, [another-logger](https://www.npmjs.com/package/another-logger) is used.
 */
export interface Logger {
    debug: Function,
    info: Function,
    success: Function,
    warn: Function,
    error: Function
}

export class Client extends Eris.Client {
    extendedOptions: ExtendedOptions;
    commandRegistry: CommandRegistry;
    log: Logger;
    argParsers: object;
    private registeredEvents: { file: string, event: string, handler: (...args: any[]) => {} }[] = [];

    /**
     * Creates a new bot client.
     * @param token The bot token. Store inside a .env or private configuration file, ideally.
     * @param options Options passed to Eris' default client
     * @param extendedOptions Additional options required by this library
     */
    constructor(token: string, options: Eris.ClientOptions, extendedOptions: ExtendedOptions) {
        super(token, Object.assign(options, {
            restMode: true
        }));

        this.extendedOptions = extendedOptions;

        this.commandRegistry = new CommandRegistry(this);

        this.log = extendedOptions.logger || new Logger({
            ignoredLevels: this.extendedOptions.development ? [] : ["debug"]
        });

        this.addEventsIn(path.join(__dirname, "events"));

        this.argParsers = extendedOptions.argParsers || defaultArgParser;

        if (extendedOptions.defaultCommands) {
            this.commandRegistry.register(new HelpCommand(this));
        }
    }

    /**
     * Iterates through a directory recursively, registering every event automatically.
     * Each event should be exported with its own name, not as default:
     * ```typescript
     * module.exports = {
     *  messageCreate: function() { // ...
     *  }
     * }
     * ```
     * or:
     * ```typescript
     * export function messageCreate() { // ...
     * }
     * ```
     * @param directory Directory to register all events from
     */
    async addEventsIn(directory: string) {
        for await (const {obj, entryPath} of iterateImport(directory)) {
            this.addEventsFrom(entryPath, obj);
        }

        if (this.extendedOptions.development) {
            chokidar.watch(directory).on("change", path => {
                this.log.info(`Reloading event in ${path}`);

                delete require.cache[require.resolve(path)];

                const events = this.registeredEvents.filter(e => e.file === path);

                for (const event of events) {
                    this.off(event.event, event.handler);
                }

                this.addEventsFrom(path, require(path));
            });
        }
    }

    /**
     * Adds events from an object with the key being the event name, and the value being the handler.
     * @param path The file path the event was resolved from
     * @param obj Object to add events from
     */
    private addEventsFrom(path: string, obj: object) {
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === "function") {
                const handler = value.bind(this);
                this.on(key, handler);
                this.registeredEvents.push({ file: path, event: key, handler });
            }
        }
    }

    /**
     * Resolves the prefix for any given message.
     * Uses {@link ExtendedOptions.prefix} to find the prefix
     * @param msg Message to resolve prefix based on
     */
    async resolvePrefix(msg: Eris.Message) {
        const prefixResolvable = this.extendedOptions.prefix;
        var prefix = typeof prefixResolvable === "function" ? await prefixResolvable(msg) : [prefixResolvable];

        return prefix.map(p => p.replace("@mention", this.user.mention));
    }
}