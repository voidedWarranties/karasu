import EventEmitter from "events";

export interface CollectorOptions {
    filter: Function;
    timeout: number;
    limit: number;
    event: boolean;
}

export abstract class Collector<T> extends EventEmitter {
    event: string;

    options: CollectorOptions;

    resolve: Function = null;
    collector: T[] = [];

    timeout: NodeJS.Timeout;

    constructor(event: string, options: CollectorOptions) {
        super();

        this.event = event;
        this.options = Object.assign({
            timeout: 30000,
            limit: 1
        }, options);
    }

    abstract process(...args);

    validate(received: T) {
        if (this.options.filter(received)) {
            if (this.options.event)
                this.emit("received", received);

            if (this.options.limit > 1)
                this.collector.push(received);

            if (this.options.limit === 1 || this.collector.length === this.options.limit) {
                this.resolve(this.collector.length ? this.collector : received);
                this.emit("end");

                clearTimeout(this.timeout);

                return true;
            }
        }

        return false;
    }

    run() {
        return new Promise(resolve => {
            this.resolve = resolve;

            if (this.options.timeout) {
                this.timeout = setTimeout(() => {
                    this.resolve = null;

                    resolve(this.options.limit > 1 ? this.collector : null);

                    this.emit("end");
                    this.removeAllListeners();
                }, this.options.timeout);
            }
        });
    }
}