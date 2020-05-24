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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Command = void 0;
const util_1 = require("./util");
class Command {
    /**
     * Call this constructor by calling super from a class extending this one.
     * ```typescript
     * class ACommand extends Command {
     *  constructor(bot) {
     *    super(bot, "label"); // ...
     *  }
     * }
     * ```
     * @param bot A bot instance
     * @param label The main label to register this command under
     * @param options Optional options
     */
    constructor(bot, label, options) {
        var _a;
        this.bot = bot;
        this.label = label;
        this.options = options;
        if ((_a = this.options) === null || _a === void 0 ? void 0 : _a.subCommands) {
            for (const command of this.options.subCommands) {
                command.parent = this;
            }
        }
    }
    /**
     * Runs before the actual commands, running preprocessing such as
     * argument parsing, permissions handling, and executing subcommands
     * @param msg Message to be handled
     * @param args Raw arguments with no parsing
     */
    exec(msg, args) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        return __awaiter(this, void 0, void 0, function* () {
            if (((_a = this.options) === null || _a === void 0 ? void 0 : _a.ownerOnly) && this.bot.extendedOptions.owner !== msg.author.id) {
                return "Only the bot owner can use this command.";
            }
            if ((((_b = this.options) === null || _b === void 0 ? void 0 : _b.permissions) || ((_c = this.options) === null || _c === void 0 ? void 0 : _c.guildOnly)) && !msg.guildID) {
                return "This command only works in guilds!";
            }
            if ((_d = this.options) === null || _d === void 0 ? void 0 : _d.requirements) {
                if (!this.options.requirements(msg)) {
                    return "You do not meet the requirements to run this command.";
                }
            }
            if ((_e = this.options) === null || _e === void 0 ? void 0 : _e.permissions) {
                const hasAllPerms = (_f = this.options) === null || _f === void 0 ? void 0 : _f.permissions.every(p => msg.member.permission.has(p));
                if (!hasAllPerms) {
                    return `You do not have the reuquired permissions to run this command! (${(_g = this.options) === null || _g === void 0 ? void 0 : _g.permissions.join(", ")})`;
                }
            }
            if (((_j = (_h = this.options) === null || _h === void 0 ? void 0 : _h.subCommands) === null || _j === void 0 ? void 0 : _j.length) > 0) {
                const subCommand = args[0];
                if (subCommand) {
                    const handler = (_l = (_k = this.options) === null || _k === void 0 ? void 0 : _k.subCommands) === null || _l === void 0 ? void 0 : _l.find(c => c.handles(subCommand));
                    if (handler)
                        return handler.exec(msg, args.slice(1));
                }
            }
            if ((_m = this.options) === null || _m === void 0 ? void 0 : _m.arguments) {
                const result = yield util_1.parseArgs(this.bot, msg, this.options.arguments, args);
                if (!result)
                    return;
                const { given, parsed } = result;
                return this.run(msg, given, parsed);
            }
            return this.run(msg, args);
        });
    }
    /**
     * Determines whether this command should handle
     * the keyword based on alias and label
     * @param command Command's label/alias (e.g. ping, p)
     */
    handles(command) {
        var _a, _b;
        return util_1.equalsCaseInsensitive(command, this.label) || ((_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.aliases) === null || _b === void 0 ? void 0 : _b.some(a => util_1.equalsCaseInsensitive(command, a)));
    }
    /**
     * Gets subcommands and the subcommands' subcommands, recursively
     */
    getSubcommands() {
        var _a;
        if (!((_a = this.options) === null || _a === void 0 ? void 0 : _a.subCommands))
            return;
        var subCommands = this.options.subCommands;
        for (const command of subCommands) {
            subCommands = subCommands.concat(command.getSubcommands() || []);
        }
        return subCommands;
    }
    /**
     * Creates a string representing the "base command"
     * For subcommands, this includes all of the parent commands.
     *
     * @param prefix The prefix to put before the command
     */
    getBaseCommand(prefix) {
        var baseCommand = "";
        var parent = this;
        while (parent) {
            baseCommand = `${parent.label} ${baseCommand}`;
            parent = parent.parent;
        }
        return prefix + baseCommand;
    }
    /**
     * Adds a prefix to every usage this command has.
     */
    getUsagePrefixed(prefix) {
        var _a, _b;
        return (_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.usages) === null || _b === void 0 ? void 0 : _b.map(u => prefix + u);
    }
    /**
     * Creates an embed documenting this command (and its subcommands, etc.) usage.
     * @param msg Message requesting the embed, used to resolve the prefix
     */
    createEmbed(msg) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            const prefix = (yield this.bot.resolvePrefix(msg))[0].replace("`", "\\`");
            var embed = {
                title: `${prefix}${this.label}`,
                description: ((_a = this.options) === null || _a === void 0 ? void 0 : _a.description) || "*No description.*",
                fields: []
            };
            if ((_b = this.options) === null || _b === void 0 ? void 0 : _b.usages) {
                embed.fields.push({
                    name: "Usage",
                    value: this.getUsagePrefixed(prefix).join("\n")
                });
            }
            if ((_c = this.options) === null || _c === void 0 ? void 0 : _c.aliases) {
                embed.fields.push({
                    name: "Aliases",
                    value: this.options.aliases.map(a => `${prefix}${a}`).join(", ")
                });
            }
            const subCommands = (_d = this.getSubcommands()) === null || _d === void 0 ? void 0 : _d.filter(c => { var _a; return !((_a = c.options) === null || _a === void 0 ? void 0 : _a.ownerOnly); });
            if (subCommands && subCommands.length) {
                embed.fields.push({
                    name: "Subcomands",
                    value: subCommands.map(s => {
                        const usage = s.getUsagePrefixed(prefix);
                        return `**${s.getBaseCommand(prefix)}**${usage ? ("\n" + usage.map(u => "  • " + u).join("\n")) : ""}`;
                    }).join("\n")
                });
            }
            return embed;
        });
    }
}
exports.Command = Command;
