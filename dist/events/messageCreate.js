"use strict";
/** @ignore */ /** */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageCreate = void 0;
function messageCreate(msg) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const prefix = yield this.resolvePrefix(msg);
        const prefixUsed = prefix.find(p => msg.content.replace("<@!", "<@").toUpperCase().startsWith(p.toUpperCase()));
        if (prefixUsed) {
            const args = msg.content.slice(prefixUsed.length).match(/("[^\b"]*?")|('[^\b']*?')|([^\b\s]*)/g).filter(arg => arg !== "");
            const command = args.shift();
            if (command) {
                const response = yield ((_a = this.commandRegistry.resolve(command)) === null || _a === void 0 ? void 0 : _a.exec(msg, args));
                if (response) {
                    msg.channel.createMessage(response);
                }
            }
        }
    });
}
exports.messageCreate = messageCreate;
