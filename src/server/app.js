const log = require(`./utils/log.js`);
const config = require(`./config/config.js`);

const bus = require(`./utils/messageBus.js`);
const cluster = require('cluster');
const numCPUs = 3;
var core = require('./core/core_concatenated.js');
global.TEST_ENV = process.env.NODE_ENV === 'test';
global.DEV_ENV = /test|dev/.test(process.env.NODE_ENV);
global.core = core;


if (cluster.isMaster) { // master cluster! runs the website
    // start server
    var server = require('./server.js');

    server.app.workers = {};

    // This will create just one server for better testing and monitoring
    if (DEV_ENV) {
        process.env.port = config.gamePorts[0];
        var worker = cluster.fork();
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

    // fork worker processors based on the number of cores the CPU has
    for (var i = 0; i < numCPUs; i++) {

        process.env.port = config.gamePorts[i];

        var worker = cluster.fork();
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
    var bot = require(`./bot.js`);
    var socket = require('./socketForClients.js');

    // start game logic
    var game = require('./game/game.js');
    var Rollbar = require('rollbar');
    var rollbar = new Rollbar('fa0cd86c64f446c4bac992595be24831');

    // MemwatchFactoryFunction(rollbar);

    process.on('uncaughtException', function (e) {
        if (!DEV_ENV) {
            log(`red`, e);
            return rollbar.error(e);
        }

        log(`red`, e);
    });

    try {
        var everySecond = setInterval(function () {
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