// Configuration.
const config = require(`./config/config.js`);
const dotenv = require(`dotenv`).config();

// Utils.
const log = require(`./utils/log.js`);
const bus = require(`./utils/messageBus.js`);

// Require cluster.
const cluster = require(`cluster`);

// Require game core.
const core = require(`./core/core_concatenated.js`);
global.TEST_ENV = process.env.NODE_ENV === `test`;
global.DEV_ENV = /test|dev/.test(process.env.NODE_ENV);
global.core = core;

/* Master Cluster */
if (cluster.isMaster) {
    // Create the webfront.
    let server = require(`./server.js`);
    server.app.workers = {};

    // Load the bot if it is running in production.
    if (!DEV_ENV && config.domain === `krew.io`) require(`./bot.js`);

    process.on(`uncaughtException`, (e) => {
        if (!DEV_ENV) {
            log(`red`, e, e.stack ? e.stack : ``);
        }
    });
    // Create one server in development.
    if (DEV_ENV) {
        process.env.port = config.gamePorts[0];

        // Create the development worker.
        let worker = cluster.fork();
        worker.on(`message`, msg => {
            if (msg.type === `update-server`) {
                const {
                    data,
                    processId
                } = msg;
                server.app.workers[processId] = data;
            }
        });

        return log(`green`, `Creating a worker in development.`);
    }

    // Distribute work onto number of cores a system has
    for (let i = 0; i < config.serverCount; i++) {
        process.env.port = config.gamePorts[i];

        let worker = cluster.fork();
        worker.on(`message`, msg => {
            if (msg.type === `update-server`) {
                const {
                    data,
                    processId
                } = msg;
                server.app.workers[processId] = data;
            } else if (msg.type === `message-bus`) {
                let data = msg.data;

                if (msg.name === `report`) bus.emit(`report`, data.title, data.description);
                else if (msg.name === `msg`) bus.emit(`msg`, data.id, data.name, data.server, data.message);
            }
        });
    }
} else {
    // Create the game.
    let socket = require(`./socketForClients.js`);
    let game = require(`./game/game.js`);

    process.on(`uncaughtException`, (e) => {
        if (!DEV_ENV) {
            log(`red`, e, e.stack ? e.stack : ``);
        }
    });

    try {
        let everySecond = setInterval(() => {
            try {
                process.send({
                    type: `update-server`,
                    processId: process.pid,
                    data: {
                        ip: DEV_ENV ? `127.0.0.1` : config.serverIP,
                        port: process.env.port,
                        playerCount: Object.keys(core.players).length,
                        maxPlayerCount: config.maxPlayerCount
                    }
                });
            } catch (err) {
                log(`red`, err.stack);
            }
        }, 1e3);
    } catch (err) {
        log(`red`, err.stack);
    }

    bus.on(`report`, (title, description) => {
        process.send({
            type: `message-bus`,
            name: `report`,
            data: {
                title,
                description
            }
        });
    });

    bus.on(`msg`, (id, name, server, message) => {
        process.send({
            type: `message-bus`,
            name: `msg`,
            data: {
                id,
                name,
                server,
                message
            }
        });
    });

    log(`green`, `Worker ${process.pid} started.`);
    log(`green`, `Server has been up since: ${new Date().toISOString().slice(0, 10)}`);
}
