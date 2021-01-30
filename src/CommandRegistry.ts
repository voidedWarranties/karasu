import { Command } from "./Command";
import { Client } from "./Client";
import chokidar from "chokidar";
import { equalsCaseInsensitive, iterateImport } from "./util";
import path from "path";
import * as esprima from "esprima";
import fs from "fs";

export default class CommandRegistry {
    private bot: Client;
    commands: Command[] = [];
    dependencies: {
        [key: string]: string[]
    } = {};
    watchers: {
        [key: string]: chokidar.FSWatcher;
    } = {};

    constructor(bot: Client) {
        this.bot = bot;
    }

    /**
     * Iterates through a directory recursively, registering every command automatically.
     * If {@link ExtendedOptions.development} is true, commands will be reloaded upon save.
     * This will attempt to reload the command when it is saved.
     * Additionally, when dependencies are found, they will be reloaded along with all dependent commands.
     * All dependencies are reloaded when a file is saved.
     * @param directory Directory to register all commands from
     */
    async registerDirectory(directory: string) {
        for await (const { entryPath, obj } of iterateImport(directory)) {
            if (!(obj.prototype instanceof Command)) continue;

            const commandInstance = new obj(this.bot);

            if (commandInstance.run) {
                this.register(commandInstance);

                if (this.bot.extendedOptions.development) {
                    this.watchDependencies(entryPath);

                    chokidar.watch(entryPath).on("change", () => {
                        this.reloadCommand(entryPath);

                        this.watchDependencies(entryPath);
                    });
                }
            }
        }
    }

    watchDependencies(entryPath: string) {
        const paths = this.getFileDependencies(entryPath);
        if (!paths || !paths.length) return;

        for (const [key, value] of Object.entries(this.dependencies)) {
            const position = value.indexOf(entryPath);
            if (position > -1) this.dependencies[key].splice(value.indexOf(entryPath), 1);
        }

        for (const dep of paths) {
            if (!this.dependencies[dep]) {
                this.dependencies[dep] = [];

                this.bot.log.info(`Registering watcher for dependency ${dep}`);
                this.watchers[dep] = chokidar.watch(dep).on("change", () => {
                    this.bot.log.info(`Reloading dependency in: ${dep}`);

                    delete require.cache[dep];

                    for (const commandPath of this.dependencies[dep]) {
                        this.reloadCommand(commandPath);
                    }
                });
            }

            this.dependencies[dep].push(entryPath);
        }

        for (const [key, value] of Object.entries(this.dependencies)) {
            if (!value.length) {
                this.bot.log.info(`Dependency ${key} is now orphaned, closing watcher`);

                delete this.dependencies[key];

                this.watchers[key].close();
                delete this.watchers[key];
            }
        }
    }

    getFileDependencies(filePath: string) {
        const folder = path.dirname(filePath);

        try {
            const content = fs.readFileSync(filePath, "utf-8");
            const parsed = esprima.parseModule(content);
            let imports = [];

            for (const token of parsed.body) {
                let importPath;

                if (token.type === "ImportDeclaration") {
                    importPath = token.source.value;
                } else if (token.type === "VariableDeclaration") {
                    const init = token.declarations[0].init;

                    if (init.type === "CallExpression" && init.callee.name === "require") {
                        importPath = init.arguments[0].value;
                    }
                }

                if (!importPath) continue;

                if (importPath.startsWith("../") || importPath.startsWith("./")) {
                    const fullPath = require.resolve(path.join(folder, importPath));
                    imports.push(fullPath);

                    imports = imports.concat(this.getFileDependencies(fullPath));
                }
            }

            return imports;
        } catch (e) {
            this.bot.log.error(`Failed to get dependencies of ${filePath}: ${e}`);
        }
    }

    reloadCommand(filePath: string) {
        this.bot.log.info(`Reloading command in: ${filePath}`);
        delete require.cache[require.resolve(filePath)];

        let CommandConstructor = require(filePath);
        if (CommandConstructor.default) CommandConstructor = CommandConstructor.default;

        const commandInstance = new CommandConstructor(this.bot);

        this.unregister(commandInstance.label);
        this.register(commandInstance);
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