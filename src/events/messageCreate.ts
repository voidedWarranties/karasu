/** @ignore *//** */

import Eris from "eris";

function startsAndEndsWith(value: string, wrap: string) {
    return value.startsWith(wrap) && value.endsWith(wrap);
}

export async function messageCreate(msg: Eris.Message) {
    const prefix = await this.resolvePrefix(msg);
    const content = msg.content.replace("<@!", "<@");

    if (content.trim() === `<@${this.user.id}>`) {
        await msg.channel.createMessage(`My prefix in this server is \`${prefix[0]}\``);

        return;
    }

    const prefixUsed = prefix.find(p => content.toUpperCase().startsWith(p.toUpperCase()));

    if (prefixUsed) {
        let args = msg.content.slice(prefixUsed.length).match(/("[^\b"]*?")|('[^\b']*?')|([^\b\s]*)/g).filter(arg => arg !== "");
        args = args.map(arg => {
            if (startsAndEndsWith(arg, "\"") || startsAndEndsWith(arg, "\'")) {
                return arg.slice(1, -1);
            }

            return arg;
        });

        const command = args.shift();

        if (command) {
            const response = await this.commandRegistry.resolve(command)?.exec(msg, args);

            if (response) {
                msg.channel.createMessage(response);
            }
        }
    }
}