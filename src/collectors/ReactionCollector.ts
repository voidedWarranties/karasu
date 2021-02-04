import { Collector, CollectorOptions } from "./Collector";
import Eris from "eris";

interface Reaction {
    msg: Eris.Message | object;
    emoji: object;
    reactor: Eris.Member | object;
}

export default class ReactionCollector extends Collector<Reaction> {
    constructor(options: CollectorOptions) {
        super("messageReactionAdd", options);
    }

    process(...args) {
        const [msg, emoji, reactor] = args;

        return {
            msg, emoji, reactor
        };
    }
}