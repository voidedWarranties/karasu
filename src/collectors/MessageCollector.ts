import { Collector, CollectorOptions } from "./Collector";
import Eris from "eris";

export default class MessageCollector extends Collector<Eris.Message> {
    constructor(options: CollectorOptions) {
        super("messageCreate", options);
    }

    process(...args) {
        return args[0];
    }
}