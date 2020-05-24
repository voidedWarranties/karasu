"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const eris_1 = __importDefault(require("eris"));
require("eris-additions")(eris_1.default);
const CommandRegistry_1 = __importDefault(require("./CommandRegistry"));
const path_1 = __importDefault(require("path"));
const another_logger_1 = __importDefault(require("another-logger"));
const util_1 = require("./util");
const DefaultArgParser_1 = __importDefault(require("./DefaultArgParser"));
const HelpCommand_1 = __importDefault(require("./HelpCommand"));
const chokidar_1 = __importDefault(require("chokidar"));
class Client extends eris_1.default.Client {
    /**
     * Creates a new bot client.
     * @param token The bot token. Store inside a .env or private configuration file, ideally.
     * @param options Options passed to Eris' default client
     * @param extendedOptions Additional options required by this library
     */
    constructor(token, options, extendedOptions) {
        super(token, Object.assign(options, {
            restMode: true
        }));
        this.registeredEvents = [];
        this.extendedOptions = extendedOptions;
        this.commandRegistry = new CommandRegistry_1.default(this);
        this.log = extendedOptions.logger || new another_logger_1.default({
            ignoredLevels: this.extendedOptions.development ? [] : ["debug"]
        });
        this.addEventsIn(path_1.default.join(__dirname, "events"));
        this.argParsers = extendedOptions.argParsers || DefaultArgParser_1.default;
        if (extendedOptions.defaultCommands) {
            this.commandRegistry.register(new HelpCommand_1.default(this));
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
    addEventsIn(directory) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                for (var _b = __asyncValues(util_1.iterateImport(directory)), _c; _c = yield _b.next(), !_c.done;) {
                    const { obj, entryPath } = _c.value;
                    this.addEventsFrom(entryPath, obj);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (this.extendedOptions.development) {
                chokidar_1.default.watch(directory).on("change", path => {
                    this.log.info(`Reloading event in ${path}`);
                    delete require.cache[require.resolve(path)];
                    const events = this.registeredEvents.filter(e => e.file === path);
                    for (const event of events) {
                        this.off(event.event, event.handler);
                    }
                    this.addEventsFrom(path, require(path));
                });
            }
        });
    }
    /**
     * Adds events from an object with the key being the event name, and the value being the handler.
     * @param path The file path the event was resolved from
     * @param obj Object to add events from
     */
    addEventsFrom(path, obj) {
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
    resolvePrefix(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            const prefixResolvable = this.extendedOptions.prefix;
            var prefix = typeof prefixResolvable === "function" ? yield prefixResolvable(msg) : [prefixResolvable];
            return prefix.map(p => p.replace("@mention", this.user.mention));
        });
    }
}
exports.Client = Client;
