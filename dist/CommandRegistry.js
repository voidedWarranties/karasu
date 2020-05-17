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
const Command_1 = require("./Command");
const chokidar_1 = __importDefault(require("chokidar"));
const util_1 = require("./util");
class CommandRegistry {
    constructor(bot) {
        this.commands = [];
        this.bot = bot;
    }
    /**
     * Iterates through a directory recursively, registering every command automatically.
     * If {@link ExtendedOptions.development} is true, commands will be reloaded upon save.
     * This will reload only the contents of the file registered, not any dependencies.
     * @param directory Directory to register all commands from
     */
    registerDirectory(directory) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                for (var _b = __asyncValues(util_1.iterateImport(directory)), _c; _c = yield _b.next(), !_c.done;) {
                    const { entryPath, obj } = _c.value;
                    if (!(obj.prototype instanceof Command_1.Command))
                        continue;
                    const commandInstance = new obj(this.bot);
                    if (commandInstance.run) {
                        this.register(commandInstance);
                        if (this.bot.extendedOptions.development) {
                            chokidar_1.default.watch(entryPath).on("change", () => {
                                this.bot.log.info(`Reloading command in: ${entryPath}`);
                                delete require.cache[require.resolve(entryPath)];
                                const CommandConstructor = require(entryPath) || require(entryPath).default;
                                const commandInstance = new CommandConstructor(this.bot);
                                this.unregister(commandInstance.label);
                                this.register(commandInstance);
                            });
                        }
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        });
    }
    register(instance) {
        if (this.commands.some(c => c.handles(instance.label)))
            throw new TypeError(`Duplicate alias/label: ${instance.label}`);
        const dupeAlias = this.commands.find(c => { var _a, _b; return (_b = (_a = instance.options) === null || _a === void 0 ? void 0 : _a.aliases) === null || _b === void 0 ? void 0 : _b.some(a => c.handles(a)); });
        if (dupeAlias)
            throw new TypeError(`Command "${instance.label}" has duplicate aliases/labels with "${dupeAlias.label}"!`);
        this.commands.push(instance);
    }
    unregister(label) {
        this.commands = this.commands.filter(c => !util_1.equalsCaseInsensitive(label, c.label));
    }
    unregisterAll() {
        this.commands = [];
    }
    resolve(command) {
        return this.commands.find(c => c.handles(command));
    }
}
exports.default = CommandRegistry;
