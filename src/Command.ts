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
     * Whether this command can only be run in guilds
     */
    guildOnly?: boolean;
    /**
     * A list of discord permissions required to run this command.
     * A list of permission strings is here: [Eris docs](https://abal.moe/Eris/docs/reference)
     */
    permissions?: string[];
    /**
     * A list of strings representing how to use this command.
     * If none are provided, one will automatically be generated based on the declared arguments.
     * Automatic generation should be avoided unless `args` is not used.
     */
    usages?: string[];
}

export interface Argument {
    /**
     * The type of information this argument represents.
     * Must be registered under {@link Client.argParsers}
     */
    type: string;
    /**
     * The name of the argument, to be used in the parser output
     * and for the default help command
     */
    name: string;
    /**
     * Whether this argument is optional
     */
    optional?: boolean;

    /**
     * Whether the argument parser should parse multiple values delimited by a semicolon or provided `delimiter`.
     * If this is true, the parser will output an array rather than a single value.
     */
    acceptMultiple?: boolean;

    /**
     * The maximum number of arguments to accept when `acceptMultiple` is true.
     * Defaults to 5.
     */
    limit?: number;

    /**
     * The delimiter to use when `acceptMultiple` is enabled.
     */
    delimiter?: string;
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
    async exec(msg: Eris.Message, args: string[], force: boolean = false) {
        const respondCallback = res => {
            return msg.channel.createMessage(this.bot.processCommandResponse(res));
        };

        if (this.options?.ownerOnly && this.bot.extendedOptions.owner !== msg.author.id) {
            return this.bot.handleCommandFailed({ type: "ownerOnly", msg});
        }

        if ((this.options?.permissions || this.options?.guildOnly) && !msg.guildID) {
            return this.bot.handleCommandFailed({ type: "guildOnly", msg })
        }

        if (this.options?.permissions && !force) {
            const hasAllPerms = this.options?.permissions.every(p => msg.member.permission.has(p));

            if (!hasAllPerms) {
                return this.bot.handleCommandFailed({ type: "missingPerms", msg, info: this.options?.permissions });
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

            return this.run(msg, given, parsed, respondCallback);
        }

        return this.run(msg, args, null, respondCallback);
    }

    /**
     * Method for running command logic.
     * @param msg Message the command was triggered by.
     * @param args Arguments that were not parsed.
     * @param parsed Any parsed arguments, or `null` if there are no declared arguments.
     * @param respondCallback A callback to reply to a message in asynchronous contexts, or to reply multiple times. Returns a promise containing a message.
     */
    abstract run(msg: Eris.Message, args: string[], parsed: any, respondCallback: Function): void | Promise<void> | string | Promise<string>;

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

        let subCommands = this.options.subCommands;

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
    getBaseCommand(prefix: string) {
        let baseCommand = "";
        let parent: Command = this;
        while (parent) {
            baseCommand = `${parent.label} ${baseCommand}`;
            parent = parent.parent;
        }

        return prefix + baseCommand;
    }

    /**
     * Adds a prefix to every usage this command has.
     */
    getUsagePrefixed(prefix: string) {
        return this.options?.usages?.map(u => prefix + u);
    }

    /**
     * Automatically creates a usage string based off of the declared arguments.
     */
    getAutoUsageString(prefix: string) {
        let usage = this.getBaseCommand(prefix);

        if (!this.options?.arguments) return null;

        for (const argument of this.options.arguments) {
            const surround = argument.optional ? ["(", ")"] : ["<", ">"];

            const parser = this.bot.argParsers[argument.type];

            usage += ` ${surround[0]}${parser.getName ? parser.getName(argument, true) : argument.name}${surround[1]}`;
        }

        return usage;
    }

    /**
     * Creates an embed documenting this command (and its subcommands, etc.) usage.
     * @param msg Message requesting the embed, used to resolve the prefix
     */
    async createEmbed(msg: Eris.Message) {
        const prefix = (await this.bot.resolvePrefix(msg))[0].replace("`", "\\`");

        const embed = {
            title: `${prefix}${this.label}`,
            description: this.options?.description ?
                await this.bot.processDescription(this.options?.description, (msg.channel as Eris.GuildChannel).guild) :
                "*No description.*",
            fields: []
        };

        if (this.options?.usages) {
            embed.fields.push({
                name: "Usage",
                value: this.getUsagePrefixed(prefix).join("\n")
            });
        } else if (this.options?.arguments) {
            embed.fields.push({
                name: "Usage",
                value: this.getAutoUsageString(prefix)
            });
        }

        if (this.options?.aliases) {
            embed.fields.push({
                name: "Aliases",
                value: this.options.aliases.map(a => `${prefix}${a}`).join(", ")
            });
        }

        const subCommands = this.getSubcommands()?.filter(c => !c.options?.ownerOnly);

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
    }
}