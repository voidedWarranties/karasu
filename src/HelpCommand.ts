/** @ignore *//** */

import { Command } from "./Command";
import Eris from "eris";
import { Client } from "./Client";

export default class HelpCommand extends Command {
    constructor(bot: Client) {
        super(bot, "help", {
            subCommands: [
                new CommandSubCommand(bot)
            ]
        });
    }

    async run(msg: Eris.Message) {
        const categories = this.bot.extendedOptions.categories;
        const commands = this.bot.commandRegistry.commands;
        const prefix = this.bot.resolvePrefix(msg)[0].replace("`", "\\`");

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
${commands.filter(c => c.options?.category === category.id && !c.options?.ownerOnly).map(c => `${prefix}${c.label}`).join(", ")}
                    `
                };

                embed.fields.push(field);

                if (embed.fields.length === 25) {
                    await msg.channel.createMessage({ embed });

                    embed = {
                        title: "Help, cont.",
                        fields: []
                    };
                }
            }

            msg.channel.createMessage({ embed });
        }
    }
}

class CommandSubCommand extends Command {
    constructor(bot: Client) {
        super(bot, "command", {
            aliases: ["cmd"]
        });
    }

    run(msg: Eris.Message, args: string[]) {
        const command = this.bot.commandRegistry.resolve(args[0]);
        if (!command) msg.channel.createMessage("No command found.");

        msg.channel.createMessage({ embed: command.createEmbed(msg) });
    }
}