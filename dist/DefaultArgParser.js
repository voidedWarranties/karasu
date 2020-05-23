"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const timestring_1 = __importDefault(require("timestring"));
const util_1 = require("./util");
exports.default = {
    time: function (_, given) {
        try {
            return timestring_1.default(given);
        }
        catch (_a) {
            return;
        }
    },
    user: parseUser,
    channel: parseChannel,
    number: function (_, given) {
        if (isNaN(+given)) {
            return;
        }
        else {
            return +given;
        }
    },
    string: function (_, given) {
        return given;
    },
    message: function (msg, given) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!isNaN(+given)) {
                try {
                    return yield msg.channel.getMessage(given);
                }
                catch (_a) {
                    return;
                }
            }
        });
    }
};
function parseUser(msg, given) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const users = ((_a = msg.member) === null || _a === void 0 ? void 0 : _a.guild.members) || msg.channel.client.users;
        const id = getSnowflake(/<@!?\d+>/, /[<@!>]/g, given);
        if (id) {
            return users.find(user => user.id === id) || (yield msg.channel.client.getRESTUser(id));
        }
        else {
            const results = users.filter(user => util_1.equalsCaseInsensitive(user.username, given) || (user.nickname && util_1.equalsCaseInsensitive(user.nickname, given)));
            if (results.length === 1) {
                return results[0];
            }
        }
    });
}
function parseChannel(msg, given) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!msg.guildID)
            return;
        const channels = msg.member.guild.channels;
        const id = getSnowflake(/<#\d+>/, /[<#>]/g, given);
        if (id) {
            return channels.find(channel => channel.id === id);
        }
        else {
            const results = channels.filter(channel => util_1.equalsCaseInsensitive(channel.name, given));
            if (results.length === 1) {
                return results[0];
            }
        }
    });
}
function getSnowflake(exp, filter, given) {
    if (isNaN(+given)) {
        if (exp.test(given)) {
            return given.replace(filter, "");
        }
    }
    else {
        return given;
    }
}
