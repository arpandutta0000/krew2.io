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
    // start server
    let server = require('./server.js');

    server.app.workers = {};

    // This will create just one server for better testing and monitoring
    if (DEV_ENV) {
        process.env.port = config.gamePorts[0];
        let worker = cluster.fork();
        worker.on('message', (msg) => {
            if (msg.type === 'update-server') {
                const {
                    data,
                    processId
                } = msg;
                server.app.workers[processId] = data;
            }
        });
        log(`green`, `Creating a worker in development.`);
        return;
    }

    // Distribute work onto number of cores a system has
    for (let i = 0; i < config.serverCount; i++) {

        process.env.port = config.gamePorts[i];

        let worker = cluster.fork();
        worker.on('message', (msg) => {
            if (msg.type === 'update-server') {
                const {
                    data,
                    processId
                } = msg;
                server.app.workers[processId] = data;
            }
        });
    }
} else { // gameServers
    // let MemwatchFactoryFunction = require('./memwatch');

    // start socket
    // let bot = require(`./bot.js`);
    let socket = require('./socketForClients.js');

    // start game logic
    let game = require('./game/game.js');
    let Rollbar = require('rollbar');
    let rollbar = new Rollbar('fa0cd86c64f446c4bac992595be24831');

    // MemwatchFactoryFunction(rollbar);

    // process.on('uncaughtException', function (e) {
    //     if (!DEV_ENV) {
    //         log(`red`, e);
    //         return rollbar.error(e);
    //     }
    // });

    try {
        let everySecond = setInterval(function () {
            try {
                // this.socket.emit(msgType, data);
                process.send({
                    type: 'update-server',
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
                ige.log('emit error at', msgType, data, err);
            }

        }, 1000);
    } catch (e) {
        log(`red`, `e`, e);
    }

    log(`green`, `Worker ${process.pid} started`);
    log(`green`, `Server has been up since: ${new Date().toISOString().slice(0, 10)}`);
}