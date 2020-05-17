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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseArgs = exports.iterateImport = exports.equalsCaseInsensitive = void 0;
const readdirp_1 = __importDefault(require("readdirp"));
const path_1 = __importDefault(require("path"));
function equalsCaseInsensitive(a, b) {
    return a.toUpperCase() === b.toUpperCase();
}
exports.equalsCaseInsensitive = equalsCaseInsensitive;
function iterateImport(directory) {
    return __asyncGenerator(this, arguments, function* iterateImport_1() {
        var e_1, _a;
        try {
            for (var _b = __asyncValues(readdirp_1.default(directory, { fileFilter: "*.js" })), _c; _c = yield __await(_b.next()), !_c.done;) {
                const entry = _c.value;
                const entryPath = path_1.default.join(directory, entry.path);
                var obj = require(entryPath);
                if (obj.default)
                    obj = obj.default;
                yield yield __await({
                    entryPath,
                    obj
                });
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) yield __await(_a.call(_b));
            }
            finally { if (e_1) throw e_1.error; }
        }
    });
}
exports.iterateImport = iterateImport;
function parseArgs(client, msg, declared, given) {
    return __awaiter(this, void 0, void 0, function* () {
        const parsedArgs = [];
        for (const idx in declared) {
            if (!given[0]) {
                msg.channel.createMessage(`Not enough arguments, ${declared.length} required`);
                return;
            }
            const arg = declared[idx];
            if (!client.argParsers[arg.type])
                throw new ReferenceError(`Parser for argument type ${arg.type} does not exist.`);
            const parsed = yield client.argParsers[arg.type](msg, given[0]);
            if (!parsed) {
                if (!arg.optional) {
                    msg.channel.createMessage(`Argument ${idx}: Required type ${arg.type}`);
                    return;
                }
                else {
                    parsedArgs.push(undefined);
                    return;
                }
            }
            else {
                parsedArgs.push(parsed);
                given.shift();
            }
        }
        return {
            given, parsed: parsedArgs
        };
    });
}
exports.parseArgs = parseArgs;
