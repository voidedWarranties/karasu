import timestring from "timestring";
import Eris from "eris";
import { equalsCaseInsensitive } from "./util";

export default {
    time: function (_, given: string) {
        try {
            return timestring(given);
        } catch {
            return;
        }
    },
    user: parseUser,
    channel: parseChannel,
    number: function (_, given: string) {
        if (isNaN(+given)) {
            return;
        } else {
            return +given;
        }
    },
    string: function (_, given: string) {
        return given;
    },
    message: async function (msg: Eris.Message, given: string) {
        if (!isNaN(+given)) {
            try {
                return await msg.channel.getMessage(given);
            } catch {
                return;
            }
        }
    },
    role: parseRole
};

async function parseUser(msg: Eris.Message, given: string) {
    const users = msg.member?.guild.members || msg.channel.client.users;

    const id = getSnowflake(/<@!?\d+>/, /[<@!>]/g, given);

    if (id) {
        return users.find(user => user.id === id) || await msg.channel.client.getRESTUser(id);
    } else {
        const results = users.filter(user => equalsCaseInsensitive(user.username, given) || (user.nickname && equalsCaseInsensitive(user.nickname, given)));

        if (results.length === 1) {
            return results[0];
        }
    }
}

async function parseChannel(msg: Eris.Message, given: string) {
    if (!msg.guildID) return;

    const channels = msg.member.guild.channels;

    const id = getSnowflake(/<#\d+>/, /[<#>]/g, given);

    if (id) {
        return channels.find(channel => channel.id === id);
    } else {
        const results = channels.filter(channel => equalsCaseInsensitive(channel.name, given));

        if (results.length === 1) {
            return results[0];
        }
    }
}

async function parseRole(msg: Eris.Message, given: string) {
    if (!msg.guildID) return;

    const roles = msg.member.guild.roles;

    const id = getSnowflake(/<@&\d+>/, /[<@&>]/g, given);

    if (id) {
        return roles.find(r => r.id === id);
    } else {
        const results = roles.filter(r => equalsCaseInsensitive(r.name, given.replace(/["']/g, "")));

        if (results.length === 1) {
            return results[0];
        }
    }
}

function getSnowflake(exp: RegExp, filter: RegExp, given: string) {
    if (isNaN(+given)) {
        if (exp.test(given)) {
            return given.replace(filter, "");
        }
    } else {
        return given;
    }
}