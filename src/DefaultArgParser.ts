import timestring from "timestring";
import Eris from "eris";
import { equalsCaseInsensitive } from "./util";

export default {
    time: function(_, given: string) {
        try {
            return timestring(given);
        } catch {
            return;
        }
    },
    user: parseUser,
    number: function(_, given: string) {
        if (isNaN(+given)) {
            return;
        } else {
            return +given;
        }
    },
    string: function(_, given: string) {
        return given;
    }
};

const pingExp = /<@!?\d+>/;

export async function parseUser(msg: Eris.Message, given: string) {
    const users = msg.member?.guild.members || msg.channel.client.users;

    var id;

    if (isNaN(+given)) {
        if (pingExp.test(given)) {
            id = given.replace(/[<@!>]/g, "");
        } else {
            const results = users.filter(user => equalsCaseInsensitive(user.username, given) || (user.nickname && equalsCaseInsensitive(user.nickname, given)));

            if (results.length === 1) {
                return results[0];
            } else {
                return;
            }
        }
    } else {
        id = given;
    }

    return users.find(user => user.id === id);
}