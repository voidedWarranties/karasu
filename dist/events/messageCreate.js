"use strict";
/** @ignore */ /** */
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageCreate = void 0;
function messageCreate(msg) {
    var _a;
    const prefix = this.resolvePrefix(msg);
    const prefixUsed = prefix.find(p => msg.content.replace("<@!", "<@").toUpperCase().startsWith(p.toUpperCase()));
    if (prefixUsed) {
        const args = msg.content.slice(prefixUsed.length).match(/("[^\b"]*?")|('[^\b']*?')|(\b[^\b\s]*\b)/g).filter(arg => arg !== "");
        const command = args.shift();
        if (command)
            (_a = this.commandRegistry.resolve(command)) === null || _a === void 0 ? void 0 : _a.exec(msg, args);
    }
}
exports.messageCreate = messageCreate;
