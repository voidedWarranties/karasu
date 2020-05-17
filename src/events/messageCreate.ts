/** @ignore *//** */

import Eris from "eris";

export async function messageCreate(msg: Eris.Message) {
    const prefix = await this.resolvePrefix(msg);

    const prefixUsed = prefix.find(p => msg.content.replace("<@!", "<@").toUpperCase().startsWith(p.toUpperCase()));

    if (prefixUsed) {
        const args = msg.content.slice(prefixUsed.length).match(/("[^\b"]*?")|('[^\b']*?')|([^\b\s]*)/g).filter(arg => arg !== "");
        const command = args.shift();

        if (command) {
            const response = await this.commandRegistry.resolve(command)?.exec(msg, args);

            if (response) {
                msg.channel.createMessage(response);
            }
        }
    }
}