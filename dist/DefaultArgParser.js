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
exports.parseUser = void 0;
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
    }
};
const pingExp = /<@!?\d+>/;
function parseUser(msg, given) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const users = ((_a = msg.member) === null || _a === void 0 ? void 0 : _a.guild.members) || msg.channel.client.users;
        var id;
        if (isNaN(+given)) {
            if (pingExp.test(given)) {
                id = given.replace(/[<@!>]/g, "");
            }
            else {
                const results = users.filter(user => util_1.equalsCaseInsensitive(user.username, given) || (user.nickname && util_1.equalsCaseInsensitive(user.nickname, given)));
                if (results.length === 1) {
                    return results[0];
                }
                else {
                    return;
                }
            }
        }
        else {
            id = given;
        }
        return users.find(user => user.id === id) || (yield msg.channel.client.getRESTUser(id));
    });
}
exports.parseUser = parseUser;
