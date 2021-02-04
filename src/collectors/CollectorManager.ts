import { Collector, CollectorOptions } from "./Collector";
import { Client } from "../Client";

import MessageCollector from "./MessageCollector";
import ReactionCollector from "./ReactionCollector";

export default class CollectorManager {
    bot: Client;
    handlers: {
        [key: string]: (...args) => void
    } = {};
    collectors: Collector<any>[] = [];

    constructor(bot: Client) {
        this.bot = bot;
    }

    awaitMessages(options: CollectorOptions) {
        return this.register(new MessageCollector(options));
    }

    awaitReactions(options: CollectorOptions) {
        return this.register(new ReactionCollector(options));
    }

    register(collector: Collector<any>) {
        if (!this.handlers[collector.event]) {
            this.handlers[collector.event] = (...args) => {
                const targets = this.collectors.filter(c => c.event === collector.event);

                for (let i = 0; i < targets.length; i++) {
                    const target = targets[i];
                    const result = target.process(...args);

                    if (target.validate(result)) {
                        this.collectors.splice(i, 1);
                    }
                }
            };

            this.bot.on(collector.event, this.handlers[collector.event]);
        }

        const idx = this.collectors.length;

        this.collectors.push(collector);

        const promise = collector.run().then(res => {
            this.collectors.splice(idx, 1);

            return res;
        });

        return collector.options.event ? collector : promise;
    }
}