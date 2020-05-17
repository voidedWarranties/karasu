/** @ignore *//** */

import Eris from "eris";

export function messageCreate(msg: Eris.Message) {
    const prefix = this.resolvePrefix(msg);

    const prefixUsed = prefix.find(p => msg.content.replace("<@!", "<@").toUpperCase().startsWith(p.toUpperCase()));

    if (prefixUsed) {
        const args = msg.content.slice(prefixUsed.length).match(/("[^\b"]*?")|('[^\b']*?')|(\b[^\b\s]*\b)/g).filter(arg => arg !== "");
        const command = args.shift();

        if (command) this.commandRegistry.resolve(command)?.exec(msg, args);
    }
}