const { Client } = require("../dist/index");
const path = require("path");

const client = new Client("YOUR-TOKEN", {}, {
    development: true,
    owner: "OWNER-ID",
    prefix: msg => {
        return ["`", msg.guildID, "@mention "];
    },
    defaultCommands: true,
    categories: [
        {
            id: "util",
            title: "Utilities",
            description: "A bunch of useless crap"
        }
    ]
});

client.on("ready", () => {
    client.log.info("Logged In");
});

client.addEventsIn(path.join(__dirname, "events"));

client.commandRegistry.registerDirectory(path.join(__dirname, "commands"));

client.connect();