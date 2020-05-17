const { Command } = require("../../dist/index");

module.exports = class PingCommand extends Command {
    constructor(bot) {
        super(bot, "ping", {
            description: "No.",
            aliases: [
                "p"
            ],
            subCommands: [
                new ASubCommand(bot)
            ]
        });
    }

    run(msg, args) {
        msg.channel.createMessage(`Pong ${args.join(", ")}`);
    }
};

class ASubCommand extends Command {
    constructor(bot) {
        super(bot, "a", {
            aliases: [
                "aa"
            ],
            subCommands: [
                new BSubCommand(bot)
            ],
            arguments: [
                {
                    type: "string",
                    name: "I hate you"
                }
            ]
        });
    }

    run(msg, args) {
        msg.channel.createMessage(`Subcommand A ${args.join(", ")}`);
    }
}

class BSubCommand extends Command {
    constructor(bot) {
        super(bot, "b", {
            aliases: [
                "bb"
            ],
            subCommands: [
                new CSubCommand(bot)
            ]
        });
    }

    run(msg, args) {
        msg.channel.createMessage(`Subcommand B ${args.join(", ")}`);
    }
}

class CSubCommand extends Command {
    constructor(bot) {
        super(bot, "c", {
            aliases: [
                "cc"
            ],
            arguments: [{
                name: "LOL",
                type: "time"
            }]
        });
    }

    run(msg, args) {
        msg.channel.createMessage(`Subcommand C ${args.join(", ")}`);
    }
}