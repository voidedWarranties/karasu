import { Client } from "./Client";
import Eris from "eris";
import { equalsCaseInsensitive, parseArgs } from "./util";

export interface CommandOptions {
    /**
     * A list of aliases this command will also respond to
     */
    aliases?: string[];
    /**
     * A list of command instances which should be registered as subcommands to this command.
     * 
     * This must be a list of instances, i.e. `[new SubCommand(bot)]`.
     */
    subCommands?: Command[];
    /**
     * A list of arguments to be enforced when processing the command.
     * 
     * These are included in the `given` parameter of the `run` function,
     * and any arguments that were parsed get removed from the `args` parameter.
     */
    arguments?: Argument[];

    /**
     * A category registered in the {@link ExtendedOptions.categories} to put this command in
     */
    category?: string;
    /**
     * A description of this command.
     */
    description?: string;

    /**
     * Whether this command can only be run by the user defined in {@link ExtendedOptions.owner}
     */
    ownerOnly?: boolean;
    /**
     * A list of discord permissions required to run this command.
     * A list of permission strings is here: [Eris docs](https://abal.moe/Eris/docs/reference)
     */
    permissions?: string[];
    /**
     * A custom requirement function, taking in an [Eris Message](https://abal.moe/Eris/docs/Message)
     * and returning a boolean indicating whether the user meets the requirements.
     */
    requirements?: Function;
}

export interface Argument {
    /**
     * The type of information this argument represents.
     * Must be registered under {@link Client.argParsers}
     */
    type: string;
    /**
     * The name of the argument, to be used in the default help command
     */
    name?: string;
}

export abstract class Command {
    bot: Client;
    label: string;
    options: CommandOptions;
    parent?: Command;

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
    constructor(bot: Client, label: string, options?: CommandOptions) {
        this.bot = bot;
        this.label = label;
        this.options = options;

        if (this.options?.subCommands) {
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
    async exec(msg: Eris.Message, args: string[]) {
        if (this.options?.ownerOnly && this.bot.extendedOptions.owner !== msg.author.id) {
            msg.channel.createMessage("Only the bot owner can use this command.");
            return;
        }

        if (this.options?.requirements) {
            if (!this.options.requirements(msg)) {
                msg.channel.createMessage("You do not meet the requirements to run this command.");
                return;
            }
        }

        if (this.options?.permissions) {
            if (!msg.member) {
                msg.channel.createMessage("This command cannot be used outside of guilds.");
                return;
            }

            const hasAllPerms = this.options?.permissions.every(p => msg.member.permission.has(p));

            if (!hasAllPerms) {
                msg.channel.createMessage(`You do not have the reuquired permissions to run this command! (${this.options?.permissions.join(", ")})`);
                return;
            }
        }

        if (this.options?.subCommands?.length > 0) {
            const subCommand = args[0];
            if (subCommand) {
                const handler = this.options?.subCommands?.find(c => c.handles(subCommand));
                if (handler) return handler.exec(msg, args.slice(1));
            }
        }

        if (this.options?.arguments) {
            const result = await parseArgs(this.bot, msg, this.options.arguments, args);

            if (!result) return;

            const { given, parsed } = result;

            return this.run(msg, given, parsed);
        }

        return this.run(msg, args);
    }

    abstract run(msg: Eris.Message, args: string[], parsed?: any[]): void | Promise<void> | string | Promise<string>;

    /**
     * Determines whether this command should handle
     * the keyword based on alias and label
     * @param command Command's label/alias (e.g. ping, p)
     */
    handles(command: string) {
        return equalsCaseInsensitive(command, this.label) ||
            this.options?.aliases?.some(a => equalsCaseInsensitive(command, a));
    }

    /**
     * Gets subcommands and the subcommands' subcommands, recursively
     */
    getSubcommands() {
        if (!this.options?.subCommands) return;

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
    getUsage(prefix: string) {
        var baseCommand = "";
        var parent: Command = this;
        while (parent) {
            baseCommand = `${parent.label} ${baseCommand}`;
            parent = parent.parent;
        }

        return `${prefix}${baseCommand} ${this.options?.arguments?.map(a => `<${a.name || "?"} (${a.type})>`).join(" ") || ""}`;
    }

    /**
     * Creates an embed documenting this command (and its subcommands, etc.) usage.
     * @param msg Message requesting the embed, used to resolve the prefix
     */
    createEmbed(msg: Eris.Message) {
        const prefix = this.bot.resolvePrefix(msg)[0].replace("`", "\\`");

        var embed = {
            title: `${prefix}${this.label}`,
            description: this.options?.description || "*No description.*",
            fields: []
        };

        embed.fields.push({
            name: "Usage",
            value: this.getUsage(prefix)
        });

        if (this.options?.aliases) {
            embed.fields.push({
                name: "Aliases",
                value: this.options.aliases.map(a => `${prefix}${a}`).join(", ")
            });
        }

        const subCommands = this.getSubcommands();

        if (subCommands) {
            embed.fields.push({
                name: "Subcomands",
                value: subCommands.map(s => s.getUsage(prefix)).join("\n")
            });
        }

        return embed;
    }
}