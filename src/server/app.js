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
global.TEST_ENV = process.env.NODE_ENV == `test`;
global.DEV_ENV = /test|dev/.test(process.env.NODE_ENV);
global.core = core;

/* Master Cluster */
if (cluster.isMaster) {
    // Create the webfront.
    let server = require(`./server.js`);
    server.app.workers = {};

    // Load the bot if it is running in production.
    if (!DEV_ENV && config.domain == `krew.io`) require(`./bot.js`);

    // Create one server in development.
    if (DEV_ENV) {
        process.env.port = config.gamePorts[0];

        // Create the development worker.
        let worker = cluster.fork();
        worker.on(`message`, msg => {
            if (msg.type == `update-server`) {
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
        worker.on('message', msg => {
            if (msg.type === 'update-server') {
                const {
                    data,
                    processId
                } = msg;
                server.app.workers[processId] = data;
            }
        });
    }
} else {
    // Create the game.
    let socket = require('./socketForClients.js');
    let game = require('./game/game.js');

    process.on(`uncaughtException`, e => {
        log(`red`, e);
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
                        maxPlayerCount: 100
                    }
                });
            } catch (err) {
                log(`red`, err, err.stack);
            }
        }, 1e3);
    } catch (e) {
        log(`red`, e);
    }

    log(`green`, `Worker ${process.pid} started.`);
    log(`green`, `Server has been up since: ${new Date().toISOString().slice(0, 10)}`);
}