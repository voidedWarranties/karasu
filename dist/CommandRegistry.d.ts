import { Command } from "./Command";
import { Client } from "./Client";
export default class CommandRegistry {
    private bot;
    commands: Command[];
    constructor(bot: Client);
    /**
     * Iterates through a directory recursively, registering every command automatically.
     * If {@link ExtendedOptions.development} is true, commands will be reloaded upon save.
     * This will reload only the contents of the file registered, not any dependencies.
     * @param directory Directory to register all commands from
     */
    registerDirectory(directory: string): Promise<void>;
    register(instance: Command): void;
    unregister(label: string): void;
    unregisterAll(): void;
    resolve(command: string): Command;
}
