import { Command } from "../Command";
import Eris from "eris";
import { Client } from "../Client";

export default class SudoCommand extends Command {
    constructor(bot: Client) {
        super(bot, "sudo", {
            ownerOnly: true
        });
    }

    run(msg: Eris.Message, args: string[]) {
        const command = args.shift();

        const commandObj = this.bot.commandRegistry.resolve(command);

        if (commandObj != null) {
            return commandObj.exec(msg, args, true);
        }

        return "Command not found";
    }
}