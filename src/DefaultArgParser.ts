import timestring from "timestring";
import Eris from "eris";
import { equalsCaseInsensitive } from "./util";
import { Argument } from "./Command";

export default {
    time: function (_, given: string) {
        try {
            return timestring(given);
        } catch {
            return;
        }
    },
    user: parseUser,
    member: async function (msg: Eris.Message, given: string, arg: UserArgument) {
        arg.forceMember = true;
        return await parseUser(msg, given, arg);
    },
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
    role: parseRole,
    option: {
        parse: parseOption,
        getName(arg: OptionsArgument, useName: Boolean = false) {
            const validatorString = typeof arg.validator === "function" ?
                "check help usages" :
                arg.validator.map(v => typeof v === "string" ? v : v.value).join("/");

            return `${useName ? arg.name : arg.type}: ${validatorString}`;
        }
    }
};

interface UserArgument extends Argument {
    /**
     * Whether the parser should fail if a member could not be resolved,
     * rather than falling back to finding a user.
     */
    forceMember?: Boolean;
}

async function parseUser(msg: Eris.Message, given: string, arg: UserArgument) {
    const id = getSnowflake(/<@!?\d+>/, /[<@!>]/g, given);
    const client = msg.channel.client;

    // If the message was sent in a guild, attempt to find a member here
    if (msg.guildID) {
        const guild = (msg.channel as Eris.GuildChannel).guild;

        let res: Eris.Member;

        if (id) {
            res = (await guild.fetchMembers({ userIDs: [id] }))[0];
        } else if (given.length > 3) { // Refuse to resolve member if the query is under 3 characters (for now)
            res = (await guild.searchMembers(given, 1))[0];
        }

        // If no member is found, fallback to finding user
        if (res || arg.forceMember)
            return res;
    }

    if (id) {
        // Attempt to return user from cache, otherwise fetch via REST
        return client.users.find(u => u.id === id) || await client.getRESTUser(id);
    } else {
        // Attempt to query user cache by username
        const results = client.users.filter(user => equalsCaseInsensitive(user.username, given));

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

interface OptionsArgument extends Argument {
    /**
     * Special info used by certain arg parsers to determine whether the argument is valid.
     * validator should be:
     * * a function, for which no automatic documentation/usage help will be provided, or
     * * an array with elements of
     *     * a string, just the valid option, or
     *     * an object with keys `value` for the valid option and `aliases`, an array of alternatives
     */
    validator: any;
}

async function parseOption(_, given: string, arg: OptionsArgument) {
    if (!arg.validator) throw new TypeError("No validator was given to an option type argument.");

    if (typeof arg.validator === "function" && arg.validator(given)) {
        return given;
    }

    if (Array.isArray(arg.validator)) {
        if (arg.validator.includes(given))
            return given;

        const validator = arg.validator.find(v => v.value === given || (v.aliases && v.aliases.includes(given)));

        if (validator)
            return validator.value;
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