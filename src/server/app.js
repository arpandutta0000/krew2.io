const log = require(`./utils/log.js`);
const config = require(`./config/config.js`);

const bus = require(`./utils/messageBus.js`);
const cluster = require(`cluster`);
const core = require(`./core/core_concatenated.js`);
global.TEST_ENV = process.env.NODE_ENV === `test`;
global.DEV_ENV = /test|dev/.test(process.env.NODE_ENV);
global.core = core;

/* Master Cluster */
if (cluster.isMaster) {

    // Start the server
    const server = require(`./server.js`);

    server.app.workers = {};

    // If running development only create one server
    if (DEV_ENV) {
        process.env.port = config.gamePorts[0];
        let worker = cluster.fork();
        worker.on(`message`, (msg) => {
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
        worker.on(`message`, (msg) => {
            if (msg.type === `update-server`) {
                const {
                    data,
                    processId
                } = msg;
                server.app.workers[processId] = data;
            }
        });
    }

/* If the custer isn't master */
} else {
    // Start Discord bot
    let bot = require(`./bot.js`);

    // Start socket
    let socket = require(`./socketForClients.js`);

    // Start game logic
    let game = require(`./game/game.js`);
    let Rollbar = require(`rollbar`);
    let rollbar = new Rollbar(`fa0cd86c64f446c4bac992595be24831`);

    // If there is an uncaught error
    process.on(`uncaughtException`, function (e) {
        if (!DEV_ENV) {
            log(`red`, e);
            return rollbar.error(e);
        }
    });

    // Run the game
    try {
        let everySecond = setInterval(function () {
            try {
                process.send({
                    type: `update-server`,
                    processId: process.pid,
                    data: {
                        ip: DEV_ENV ? `127.0.0.1` : config.serverIP,
                        port: process.env.port,
                        playerCount: Object.keys(core.players).length,
                        maxPlayerCount: 100
                    },
                });
            } catch (err) {
                log(`red`, err, err.stack);
                ige.log(`emit error at`, msgType, data, err);
            }

        }, 1000);
    } catch (e) {
        log(`red`, `e`, e);
    }

    // Log starts
    log(`green`, `Worker ${process.pid} started`);
    log(`green`, `Server has been up since: ${new Date().toISOString().slice(0, 10)}`);
}