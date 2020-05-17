import { Command } from "./Command";
import { Client } from "./Client";
import chokidar from "chokidar";
import { equalsCaseInsensitive, iterateImport } from "./util";

export default class CommandRegistry {
    private bot: Client;
    commands: Command[] = [];

    constructor(bot: Client) {
        this.bot = bot;
    }

    /**
     * Iterates through a directory recursively, registering every command automatically.
     * If {@link ExtendedOptions.development} is true, commands will be reloaded upon save.
     * This will reload only the contents of the file registered, not any dependencies.
     * @param directory Directory to register all commands from
     */
    async registerDirectory(directory: string) {
        for await (const { entryPath, obj } of iterateImport(directory)) {
            if (!(obj.prototype instanceof Command)) continue;

            const commandInstance = new obj(this.bot);

            if (commandInstance.run) {
                this.register(commandInstance);

                if (this.bot.extendedOptions.development) {
                    chokidar.watch(entryPath).on("change", () => {
                        this.bot.log.info(`Reloading command in: ${entryPath}`);
                        delete require.cache[require.resolve(entryPath)];

                        var CommandConstructor = require(entryPath);
                        if (CommandConstructor.default) CommandConstructor = CommandConstructor.default;

                        const commandInstance = new CommandConstructor(this.bot);

                        this.unregister(commandInstance.label);
                        this.register(commandInstance);
                    });
                }
            }
        }
    }

    register(instance: Command) {
        if (this.commands.some(c => c.handles(instance.label))) throw new TypeError(`Duplicate alias/label: ${instance.label}`);

        const dupeAlias = this.commands.find(c => instance.options?.aliases?.some(a => c.handles(a)));
        if (dupeAlias) throw new TypeError(`Command "${instance.label}" has duplicate aliases/labels with "${dupeAlias.label}"!`);

        this.commands.push(instance);
    }

    unregister(label: string) {
        this.commands = this.commands.filter(c => !equalsCaseInsensitive(label, c.label));
    }

    unregisterAll() {
        this.commands = [];
    }

    resolve(command: string): Command {
        return this.commands.find(c => c.handles(command));
    }
}