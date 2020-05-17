import Eris from "eris";
declare const _default: {
    time: (_: any, given: string) => any;
    user: typeof parseUser;
    number: (_: any, given: string) => number;
    string: (_: any, given: string) => string;
};
export default _default;
export declare function parseUser(msg: Eris.Message, given: string): Promise<Eris.User | Eris.Member>;
