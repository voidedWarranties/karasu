import { Client } from "./Client";
import Eris from "eris";
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
    /**
     * Whether this argument is optional
     */
    optional?: boolean;
}
export declare abstract class Command {
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
    constructor(bot: Client, label: string, options?: CommandOptions);
    /**
     * Runs before the actual commands, running preprocessing such as
     * argument parsing, permissions handling, and executing subcommands
     * @param msg Message to be handled
     * @param args Raw arguments with no parsing
     */
    exec(msg: Eris.Message, args: string[]): any;
    abstract run(msg: Eris.Message, args: string[], parsed?: any[]): void | Promise<void> | string | Promise<string>;
    /**
     * Determines whether this command should handle
     * the keyword based on alias and label
     * @param command Command's label/alias (e.g. ping, p)
     */
    handles(command: string): boolean;
    /**
     * Gets subcommands and the subcommands' subcommands, recursively
     */
    getSubcommands(): Command[];
    /**
     * Creates a string for the usage of the command,
     * based on the arguments declared and their names.
     * If executed on a subcommand, the parent is found recursively
     * to make sure the entire command (and not just subcommand) is printed.
     *
     * @param prefix The prefix to put in the message
     */
    getUsage(prefix: string): string;
    /**
     * Creates an embed documenting this command (and its subcommands, etc.) usage.
     * @param msg Message requesting the embed, used to resolve the prefix
     */
    createEmbed(msg: Eris.Message): {
        title: string;
        description: string;
        fields: any[];
    };
}
