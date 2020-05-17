"use strict";
/** @ignore */ /** */
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
const Command_1 = require("./Command");
class HelpCommand extends Command_1.Command {
    constructor(bot) {
        super(bot, "help", {
            subCommands: [
                new CommandSubCommand(bot)
            ]
        });
    }
    run(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            const categories = this.bot.extendedOptions.categories;
            const commands = this.bot.commandRegistry.commands;
            const prefix = this.bot.resolvePrefix(msg)[0];
            if (categories.length) {
                var embed = {
                    title: "Help",
                    fields: []
                };
                for (const category of categories) {
                    const field = {
                        name: category.title,
                        value: `
*${category.description}*
${commands.filter(c => { var _a, _b; return ((_a = c.options) === null || _a === void 0 ? void 0 : _a.category) === category.id && !((_b = c.options) === null || _b === void 0 ? void 0 : _b.ownerOnly); }).map(c => `${prefix}${c.label}`).join(", ")}
                    `
                    };
                    embed.fields.push(field);
                    if (embed.fields.length === 25) {
                        yield msg.channel.createMessage({ embed });
                        embed = {
                            title: "Help, cont.",
                            fields: []
                        };
                    }
                }
                msg.channel.createMessage({ embed });
            }
        });
    }
}
exports.default = HelpCommand;
class CommandSubCommand extends Command_1.Command {
    constructor(bot) {
        super(bot, "command", {
            aliases: ["cmd"]
        });
    }
    run(msg, args) {
        const command = this.bot.commandRegistry.resolve(args[0]);
        if (!command)
            msg.channel.createMessage("No command found.");
        msg.channel.createMessage({ embed: command.createEmbed(msg) });
    }
}
