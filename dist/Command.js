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
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        return __awaiter(this, void 0, void 0, function* () {
            if (((_a = this.options) === null || _a === void 0 ? void 0 : _a.ownerOnly) && this.bot.extendedOptions.owner !== msg.author.id) {
                msg.channel.createMessage("Only the bot owner can use this command.");
                return;
            }
            if ((_b = this.options) === null || _b === void 0 ? void 0 : _b.requirements) {
                if (!this.options.requirements(msg)) {
                    msg.channel.createMessage("You do not meet the requirements to run this command.");
                    return;
                }
            }
            if ((_c = this.options) === null || _c === void 0 ? void 0 : _c.permissions) {
                if (!msg.member) {
                    msg.channel.createMessage("This command cannot be used outside of guilds.");
                    return;
                }
                const hasAllPerms = (_d = this.options) === null || _d === void 0 ? void 0 : _d.permissions.every(p => msg.member.permission.has(p));
                if (!hasAllPerms) {
                    msg.channel.createMessage(`You do not have the reuquired permissions to run this command! (${(_e = this.options) === null || _e === void 0 ? void 0 : _e.permissions.join(", ")})`);
                    return;
                }
            }
            if (((_g = (_f = this.options) === null || _f === void 0 ? void 0 : _f.subCommands) === null || _g === void 0 ? void 0 : _g.length) > 0) {
                const subCommand = args[0];
                if (subCommand) {
                    const handler = (_j = (_h = this.options) === null || _h === void 0 ? void 0 : _h.subCommands) === null || _j === void 0 ? void 0 : _j.find(c => c.handles(subCommand));
                    if (handler)
                        return handler.exec(msg, args.slice(1));
                }
            }
            if ((_k = this.options) === null || _k === void 0 ? void 0 : _k.arguments) {
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
     * Creates a string for the usage of the command,
     * based on the arguments declared and their names.
     * If executed on a subcommand, the parent is found recursively
     * to make sure the entire command (and not just subcommand) is printed.
     *
     * @param prefix The prefix to put in the message
     */
    getUsage(prefix) {
        var _a, _b;
        var baseCommand = "";
        var parent = this;
        while (parent) {
            baseCommand = `${parent.label} ${baseCommand}`;
            parent = parent.parent;
        }
        return `${prefix}${baseCommand} ${((_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.arguments) === null || _b === void 0 ? void 0 : _b.map(a => `<${a.name || "?"} (${a.type})>`).join(" ")) || ""}`;
    }
    /**
     * Creates an embed documenting this command (and its subcommands, etc.) usage.
     * @param msg Message requesting the embed, used to resolve the prefix
     */
    createEmbed(msg) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const prefix = (yield this.bot.resolvePrefix(msg))[0].replace("`", "\\`");
            var embed = {
                title: `${prefix}${this.label}`,
                description: ((_a = this.options) === null || _a === void 0 ? void 0 : _a.description) || "*No description.*",
                fields: []
            };
            embed.fields.push({
                name: "Usage",
                value: this.getUsage(prefix)
            });
            if ((_b = this.options) === null || _b === void 0 ? void 0 : _b.aliases) {
                embed.fields.push({
                    name: "Aliases",
                    value: this.options.aliases.map(a => `${prefix}${a}`).join(", ")
                });
            }
            const subCommands = this.getSubcommands().filter(c => { var _a; return !((_a = c.options) === null || _a === void 0 ? void 0 : _a.ownerOnly); });
            if (subCommands.length) {
                embed.fields.push({
                    name: "Subcomands",
                    value: subCommands.map(s => s.getUsage(prefix)).join("\n")
                });
            }
            return embed;
        });
    }
}
exports.Command = Command;
