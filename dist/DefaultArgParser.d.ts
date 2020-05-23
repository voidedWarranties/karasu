import Eris from "eris";
declare const _default: {
    time: (_: any, given: string) => any;
    user: typeof parseUser;
    channel: typeof parseChannel;
    number: (_: any, given: string) => number;
    string: (_: any, given: string) => string;
    message: (msg: Eris.Message, given: string) => Promise<Eris.Message<Eris.TextChannel> | Eris.Message<Eris.PrivateChannel>>;
};
export default _default;
declare function parseUser(msg: Eris.Message, given: string): Promise<Eris.User | Eris.Member>;
declare function parseChannel(msg: Eris.Message, given: string): Promise<Eris.AnyGuildChannel>;
