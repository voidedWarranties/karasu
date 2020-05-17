/** @ignore */ /** */
import { Command } from "./Command";
import Eris from "eris";
import { Client } from "./Client";
export default class HelpCommand extends Command {
    constructor(bot: Client);
    run(msg: Eris.Message): Promise<void>;
}
